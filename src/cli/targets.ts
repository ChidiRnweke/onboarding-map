import { cancel, isCancel, multiselect } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Where each coding agent looks for a project's skills. Claude Code reads
 * .claude/skills; Codex and other tools that follow the Agent Skills standard
 * read .agents/skills; Codex also still scans its older .codex/skills.
 */
export const SKILL_TARGETS = {
  claude: '.claude/skills',
  agents: '.agents/skills',
  codex: '.codex/skills',
} as const;

export type SkillTarget = keyof typeof SKILL_TARGETS;

const NAMES = Object.keys(SKILL_TARGETS) as SkillTarget[];

const LABELS: Record<SkillTarget, string> = {
  claude: 'Claude Code',
  agents: 'Codex, and other tools following the Agent Skills standard',
  codex: 'Codex (older path)',
};

/** A refusal the CLI reports as a message and exit code, not a stack trace. */
export class TargetError extends Error {}

/**
 * Which folders to install the skills into. `--target` takes a comma list of
 * claude, agents and codex, or `all`, or `none`. Without it the user is asked,
 * with the folders the project already has preselected; when nobody can be
 * asked (CI, an agent's shell), the choice has to be explicit.
 */
export async function resolveTargets(flag: string | undefined, dir: string): Promise<SkillTarget[]> {
  if (flag !== undefined) return parseTargets(flag);

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new TargetError(
      `Choose where to install the skills: --target ${NAMES.join(',')} (or all, or none).`,
    );
  }
  const chosen = await multiselect<SkillTarget>({
    message: 'Which coding agents should get the map-writing skills?',
    options: NAMES.map((t) => ({ value: t, label: LABELS[t], hint: SKILL_TARGETS[t] })),
    initialValues: NAMES.filter((t) => existsSync(join(dir, SKILL_TARGETS[t].split('/')[0]))),
    required: false,
  });
  if (isCancel(chosen)) {
    cancel('Nothing was installed.');
    throw new TargetError('Cancelled.');
  }
  return chosen;
}

export function parseTargets(flag: string): SkillTarget[] {
  const names = flag
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (names.length === 1 && names[0] === 'all') return [...NAMES];
  if (names.length === 1 && names[0] === 'none') return [];
  const unknown = names.filter((n) => !(n in SKILL_TARGETS));
  if (unknown.length || !names.length) {
    throw new TargetError(
      `Unknown --target ${unknown.join(', ') || '(empty)'}. Use ${NAMES.join(', ')}, all or none.`,
    );
  }
  return [...new Set(names as SkillTarget[])];
}
