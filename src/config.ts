import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join } from 'node:path';
import { parse } from 'yaml';

const defaultFile = new URL('../config/default.yml', import.meta.url);
export const configPath = join(
  process.env.XDG_CONFIG_HOME && isAbsolute(process.env.XDG_CONFIG_HOME)
    ? process.env.XDG_CONFIG_HOME
    : join(homedir(), '.config'),
  'wgc', 'config.yml',
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function loadConfig() {
  let file;
  try {
    file = await readFile(configPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    file = await readFile(defaultFile, 'utf8');
  }
  const config: unknown = parse(file);
  if (!isRecord(config)) throw new Error('Expected a YAML mapping.');
  const { commitCommand, types } = config;
  if (!Array.isArray(commitCommand) || commitCommand.length === 0 ||
      commitCommand.some(value => typeof value !== 'string' || !value.trim() || value.includes('\0'))) {
    throw new Error('commitCommand must be a non-empty array of command tokens.');
  }
  if (!isRecord(types) || !Object.keys(types).length) {
    throw new Error('types must be a non-empty YAML mapping.');
  }
  const labels = new Map<string, string>();
  for (const [key, label] of Object.entries(types)) {
    if (!/^[^\s,]+$/.test(key) || typeof label !== 'string' || !label.trim()) {
      throw new Error('Invalid type mapping for ' + key + '; expected non-empty label text.');
    }
    labels.set(key, label);
  }
  return { commitCommand: commitCommand as [string, ...string[]], labels };
}

export async function resetConfig() {
  const contents = await readFile(defaultFile);
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, contents);
}
