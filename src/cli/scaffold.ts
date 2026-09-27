import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { CONFIG_FILE, SKILLS_DIR, TEMPLATES_DIR, VERSION } from './paths.ts';
import { SKILL_TARGETS, type SkillTarget } from './targets.ts';

export const TEMPLATES = () => readdirSync(TEMPLATES_DIR).map((f) => basename(f, '.ts'));

/**
 * Starts a project in `dir`: a map from a template, the config, a package.json
 * that depends on onboarding-map (unless one exists), and the agent skills in
 * each of `targets`. Never overwrites a file that is already there.
 */
export function init(dir: string, template: string, targets: SkillTarget[]): string[] {
  const source = join(TEMPLATES_DIR, `${template}.ts`);
  if (!existsSync(source)) throw new Error(`No template '${template}'. Available: ${TEMPLATES().join(', ')}`);
  const done: string[] = [];
  mkdirSync(dir, { recursive: true });
  const write = (name: string, content: string) => {
    const file = join(dir, name);
    if (existsSync(file)) return done.push(`kept existing ${name}`);
    writeFileSync(file, content);
    done.push(`created ${name}`);
  };

  write('map.ts', readFileSync(source, 'utf8'));
  write(CONFIG_FILE, JSON.stringify({ map: './map.ts', out: './dist' }, null, 2) + '\n');
  write(
    'package.json',
    JSON.stringify(
      {
        name: basename(dir)
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-'),
        private: true,
        type: 'module',
        scripts: {
          dev: 'onboarding-map dev',
          build: 'onboarding-map build',
          validate: 'onboarding-map validate',
          audit: 'onboarding-map audit',
        },
        devDependencies: { 'onboarding-map': `^${VERSION}` },
      },
      null,
      2,
    ) + '\n',
  );
  write('.gitignore', 'node_modules\ndist\n');
  done.push(...installSkills(dir, targets));
  return done;
}

const AGENTS_START = '<!-- onboarding-map:start -->';
const AGENTS_END = '<!-- onboarding-map:end -->';

/**
 * Copies the skills into each target folder, where that coding agent picks
 * them up, and points to them from AGENTS.md, which most agents read.
 * Re-running replaces both with the installed version's.
 */
export function installSkills(dir: string, targets: SkillTarget[]): string[] {
  if (!targets.length) return [];
  const done: string[] = [];
  const skills = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const t of targets) {
    for (const s of skills)
      cpSync(join(SKILLS_DIR, s.name), join(dir, SKILL_TARGETS[t], s.name), { recursive: true });
    done.push(`installed ${skills.length} skills in ${SKILL_TARGETS[t]}/`);
  }

  const [first, ...rest] = targets.map((t) => SKILL_TARGETS[t]);
  const section = [
    AGENTS_START,
    '## Onboarding map',
    '',
    'This project is an onboarding map (the `onboarding-map` package). The map is the file named in',
    `\`${CONFIG_FILE}\` (default \`map.ts\`). Before editing it, read the skill that fits the task:`,
    '',
    ...skills.map((s) => `- \`${first}/${s.name}/SKILL.md\``),
    ...(rest.length ? ['', `The same skills are in ${rest.map((r) => `\`${r}/\``).join(' and ')}.`] : []),
    '',
    'After every edit run `npx onboarding-map validate --json` and fix what it reports.',
    AGENTS_END,
  ].join('\n');
  const agents = join(dir, 'AGENTS.md');
  const current = existsSync(agents) ? readFileSync(agents, 'utf8') : '';
  const pattern = new RegExp(`${AGENTS_START}[\\s\\S]*?${AGENTS_END}`);
  const next = pattern.test(current)
    ? current.replace(pattern, section)
    : `${current}${current && !current.endsWith('\n') ? '\n' : ''}${current ? '\n' : ''}${section}\n`;
  writeFileSync(agents, next);
  done.push(current ? 'updated AGENTS.md' : 'created AGENTS.md');
  return done;
}
