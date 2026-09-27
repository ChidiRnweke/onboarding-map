#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { audit } from '../core/audit.ts';
import { changelog } from '../core/changelog.ts';
import { lastChanged, loadMap, loadMapAt } from '../core/load.ts';
import { formatIssue, type ValidationIssue } from '../core/model.ts';
import { check, deriveChecked, type CheckResult } from './check.ts';
import { APP_DIR, resolveConfig, SCHEMA_FILE, VERSION } from './paths.ts';
import { init, installSkills, TEMPLATES } from './scaffold.ts';
import { serve } from './serve.ts';
import { resolveTargets, SKILL_TARGETS, TargetError } from './targets.ts';

/** Options every command that reads the map accepts. */
const mapArgs = {
  map: {
    type: 'string',
    description: 'Map file (default: from onboarding-map.config.json, else map.ts / map.json)',
  },
} as const;
const jsonArg = {
  json: { type: 'boolean', description: 'Machine-readable output, for scripts and agents' },
} as const;

/** Where the skills go: a comma list of the targets, or all, or none. Asked for when left out. */
const targetArg = {
  target: {
    type: 'string',
    description: `Where to install the agent skills: ${Object.entries(SKILL_TARGETS)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ')}, all or none. Asked for when left out; required when not interactive.`,
  },
} as const;

/** Resolves the targets, or prints why not and fails the command. */
async function targetsOrExit(flag: string | undefined, dir: string) {
  try {
    return await resolveTargets(flag, dir);
  } catch (e) {
    if (!(e instanceof TargetError)) throw e;
    console.error(e.message);
    process.exit(1);
  }
}

const print = (issues: ValidationIssue[], mark: string) =>
  issues.forEach((i) => console.log(`${mark} ${formatIssue(i)}`));

/** Prints a check result and exits non-zero when the map is invalid. */
function report(result: CheckResult, json: boolean): void {
  if (json) {
    console.log(
      JSON.stringify(
        { ok: !result.errors.length, errors: result.errors, warnings: result.warnings },
        null,
        2,
      ),
    );
  } else {
    print(result.errors, '✗');
    print(result.warnings, '!');
    if (!result.errors.length)
      console.log(`✓ valid${result.warnings.length ? ` (${result.warnings.length} warning(s))` : ''}`);
  }
  if (result.errors.length) process.exitCode = 1;
}

const validateCmd = defineCommand({
  meta: { name: 'validate', description: 'Check that every reference in the map resolves; exit 1 if not' },
  args: { ...mapArgs, ...jsonArg },
  async run({ args }) {
    const { map } = resolveConfig(process.cwd(), args);
    report(await check(map), !!args.json);
  },
});

const buildCmd = defineCommand({
  meta: { name: 'build', description: 'Validate the map and write a static site' },
  args: { ...mapArgs, out: { type: 'string', description: 'Output folder (default ./dist)' } },
  async run({ args }) {
    const config = resolveConfig(process.cwd(), args);
    const result = await check(config.map);
    if (result.errors.length) return report(result, false);
    print(result.warnings, '!');
    rmSync(config.out, { recursive: true, force: true });
    cpSync(APP_DIR, config.out, { recursive: true });
    writeFileSync(resolve(config.out, 'map.json'), JSON.stringify(deriveChecked(result)));
    console.log(`✓ built ${relative(process.cwd(), config.out) || '.'}/ — serve it from any static host`);
  },
});

const devCmd = defineCommand({
  meta: { name: 'dev', description: 'Serve the map and reload the page when the file changes' },
  args: { ...mapArgs, port: { type: 'string', description: 'Port (default 4321)', default: '4321' } },
  run({ args }) {
    serve(resolveConfig(process.cwd(), args).map, Number(args.port));
  },
});

const changelogCmd = defineCommand({
  meta: { name: 'changelog', description: 'Describe what changed in the map since a git revision' },
  args: {
    ...mapArgs,
    ...jsonArg,
    against: {
      type: 'string',
      description: 'Git revision to compare with; rev:path for a file that has moved',
      default: 'HEAD',
    },
    out: { type: 'string', description: 'Write the Markdown to this file instead of printing it' },
  },
  async run({ args }) {
    const { map } = resolveConfig(process.cwd(), args);
    const [before, after] = await Promise.all([loadMapAt(map, args.against), loadMap(map)]);
    const result = changelog(before, after);
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else if (args.out) {
      writeFileSync(args.out, result.markdown);
      console.log(`✓ wrote ${args.out}`);
    } else process.stdout.write(result.markdown);
  },
});

const auditCmd = defineCommand({
  meta: {
    name: 'audit',
    description: 'List content that may be stale or unfinished (never fails the build)',
  },
  args: {
    ...mapArgs,
    ...jsonArg,
    'check-urls': { type: 'boolean', description: 'Request every documentation link and report failures' },
  },
  async run({ args }) {
    const { map: file } = resolveConfig(process.cwd(), args);
    const result = await check(file);
    if (!result.map || result.errors.length) return report(result, !!args.json);
    const findings = await audit(result.map, {
      lastChanged: lastChanged(file),
      checkUrls: args['check-urls'],
    });
    if (args.json) return console.log(JSON.stringify({ findings }, null, 2));
    for (const f of findings)
      console.log(`${f.kind.padEnd(13)} ${f.path}: ${f.message}${f.url ? ` <${f.url}>` : ''}`);
    const counts = Object.entries(Object.groupBy(findings, (f) => f.kind)).map(
      ([k, v]) => `${v!.length} ${k}`,
    );
    console.log(
      findings.length ? `\n${findings.length} finding(s): ${counts.join(', ')}` : '✓ nothing to report',
    );
  },
});

const schemaCmd = defineCommand({
  meta: { name: 'schema', description: 'Print the JSON Schema for map.json files' },
  run() {
    process.stdout.write(readFileSync(SCHEMA_FILE, 'utf8'));
  },
});

const initCmd = defineCommand({
  meta: { name: 'init', description: 'Start a new map project with agent skills installed' },
  args: {
    dir: { type: 'positional', description: 'Folder to create it in', required: false, default: '.' },
    template: {
      type: 'string',
      description: `Map to start from (${TEMPLATES().join(', ')})`,
      default: 'starter',
    },
    ...targetArg,
  },
  async run({ args }) {
    const dir = resolve(args.dir);
    if (!TEMPLATES().includes(args.template)) {
      console.error(`No template '${args.template}'. Available: ${TEMPLATES().join(', ')}`);
      process.exit(1);
    }
    // Settled before anything is written, so a refused run leaves no half-made project.
    const targets = await targetsOrExit(args.target, dir);
    init(dir, args.template, targets).forEach((l) => console.log(`  ${l}`));
    const cd = relative(process.cwd(), dir);
    console.log(`\nNext:\n${cd ? `  cd ${cd}\n` : ''}  npm install\n  npx onboarding-map dev`);
    console.log(`\nThen ask your coding agent, e.g. "turn these notes into an onboarding map".`);
  },
});

const skillsCmd = defineCommand({
  meta: { name: 'skills', description: 'Agent skills for writing and maintaining maps' },
  subCommands: {
    install: defineCommand({
      meta: {
        name: 'install',
        description: "Copy the skills to your coding agents' skill folders and point to them from AGENTS.md",
      },
      args: targetArg,
      async run({ args }) {
        const targets = await targetsOrExit(args.target, process.cwd());
        if (!targets.length) return console.log('  nothing installed');
        installSkills(process.cwd(), targets).forEach((l) => console.log(`  ${l}`));
      },
    }),
  },
});

runMain(
  defineCommand({
    meta: { name: 'onboarding-map', version: VERSION, description: 'An onboarding map for any subject' },
    subCommands: {
      init: initCmd,
      dev: devCmd,
      build: buildCmd,
      validate: validateCmd,
      changelog: changelogCmd,
      audit: auditCmd,
      schema: schemaCmd,
      skills: skillsCmd,
    },
  }),
);
