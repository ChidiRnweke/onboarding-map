import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { CONFIG_FILE, SKILLS_DIR, TEMPLATES_DIR, VERSION } from './paths.ts';

export const TEMPLATES = () => readdirSync(TEMPLATES_DIR).map((f) => basename(f, '.ts'));

/**
 * Starts a project in `dir`: a map from a template, the config, a package.json
 * that depends on onboarding-map (unless one exists), and the agent skills.
 * Never overwrites a file that is already there.
 */
export function init(dir: string, template: string): string[] {
  const done: string[] = [];
  mkdirSync(dir, { recursive: true });
  const write = (name: string, content: string) => {
    const file = join(dir, name);
    if (existsSync(file)) return done.push(`kept existing ${name}`);
    writeFileSync(file, content);
    done.push(`created ${name}`);
  };

  const source = join(TEMPLATES_DIR, `${template}.ts`);
  if (!existsSync(source)) throw new Error(`No template '${template}'. Available: ${TEMPLATES().join(', ')}`);
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
  done.push(...installSkills(dir));
  return done;
}

const AGENTS_START = '<!-- onboarding-map:start -->';
const AGENTS_END = '<!-- onboarding-map:end -->';

/**
 * Copies the skills into .claude/skills/ (Claude Code picks them up there) and
 * points to them from AGENTS.md, which other coding agents read. Re-running
 * replaces both with the installed version's.
 */
export function installSkills(dir: string): string[] {
  const done: string[] = [];
  const target = join(dir, '.claude/skills');
  const skills = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const s of skills) {
    cpSync(join(SKILLS_DIR, s.name), join(target, s.name), { recursive: true });
    done.push(`installed skill ${relative(dir, join(target, s.name))}`);
  }

  const section = [
    AGENTS_START,
    '## Onboarding map',
    '',
    'This project is an onboarding map (the `onboarding-map` package). The map is the file named in',
    `\`${CONFIG_FILE}\` (default \`map.ts\`). Before editing it, read the skill that fits the task:`,
    '',
    ...skills.map((s) => `- \`.claude/skills/${s.name}/SKILL.md\``),
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
