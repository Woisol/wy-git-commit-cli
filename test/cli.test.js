import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'wy-git-commit-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const env = { ...process.env, XDG_CONFIG_HOME: cwd, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: join(cwd, 'no-config') };
  for (const key of [
    'GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_PREFIX', 'GIT_COMMON_DIR',
    'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_NAMESPACE', 'GIT_SHALLOW_FILE',
  ]) delete env[key];
  const run = (command, args) => spawnSync(command, args, { cwd, env, encoding: 'utf8' });
  const invoke = (...args) => run(process.execPath, [cli, ...args]);
  return { cwd, env, run, invoke, config: join(cwd, 'wy-git-commit', 'config.yml') };
}

test('creates a real commit and forwards Git failure status and stderr', t => {
  const { run, invoke } = fixture(t);
  assert.equal(run('git', ['init', '-q']).status, 0);
  assert.equal(run('git', ['config', 'user.name', 'CLI Test']).status, 0);
  assert.equal(run('git', ['config', 'user.email', 'cli@example.invalid']).status, 0);
  const result = invoke('--type', 'feat,docs', '--title', '实现命令', '--body', 'First\nSecond', '--allow-empty');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /root-commit/);
  const log = run('git', ['log', '-1', '--format=%B']);
  assert.equal(log.stdout.replace(/\r\n/g, '\n').trimEnd(), '「 :sparkles: 新增 / feat, :pencil: 文档 / docs 」: 实现命令\n\nFirst\nSecond');
  const failed = invoke('--type', 'feat', '--title', 'try', '--not-a-real-git-option');
  assert.equal(failed.status, 129);
  assert.match(failed.stderr, /not-a-real-git-option/);
});

test('prints the generated message without running the commit command in debug-only mode', t => {
  const { invoke } = fixture(t);
  const result = invoke('--type', 'feat', '--title', 'inspect only', '--wy-dry-run');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '「 :sparkles: 新增 / feat 」: inspect only');
});

test('uses custom YAML and command tokens, then resets all settings', t => {
  const { cwd, config, invoke } = fixture(t);
  assert.equal(invoke('reset').status, 0);
  const defaults = readFileSync(config, 'utf8');
  const fake = join(cwd, 'fake.cjs');
  writeFileSync(fake, 'console.log(JSON.stringify(process.argv.slice(2))); console.error("forwarded error"); process.exitCode = 17;');
  writeFileSync(config, JSON.stringify({ commitCommand: [process.execPath, fake, 'fixed'], types: { custom: 'custom label' } }));
  const result = invoke('--type', 'custom', '--title', 'check', '--ai-review=false', '--future', 'value');
  assert.equal(result.status, 17, result.stderr);
  assert.match(result.stderr, /forwarded error/);
  assert.deepEqual(JSON.parse(result.stdout), ['fixed', '-m', '「 custom label 」: check\n\n「[AI] Agentic Coding 产物 / Agentic Coding Product」\nAI-Review: false', '--future', 'value']);
  assert.equal(invoke('reset').status, 0);
  assert.equal(readFileSync(config, 'utf8'), defaults);
});

test('setup invokes npx and propagates its exit status', t => {
  const { cwd, env, invoke } = fixture(t);
  const bin = join(cwd, 'bin');
  mkdirSync(bin);
  if (process.platform === 'win32') {
    writeFileSync(join(bin, 'npx.cmd'), '@echo off\r\necho %~1 %~2 %~3 %~4 %~5\r\nexit /b 19\r\n');
  } else {
    writeFileSync(join(bin, 'npx'), '#!/bin/sh\nprintf "%s " "$@"\nexit 19\n', { mode: 0o755 });
  }
  const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') ?? 'PATH';
  env[pathKey] = bin + (process.platform === 'win32' ? ';' : ':') + env[pathKey];
  const result = invoke('setup');
  assert.equal(result.status, 19, result.stderr);
  assert.equal(result.stdout.trim(), 'skills add https://github.com/Woisol/WY-Git-Commit.git --skill wy-git-commit');
});
