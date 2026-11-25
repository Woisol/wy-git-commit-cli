import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/args.ts';

test('parses repeated types and forwards unknown arguments in order', () => {
  const options = parseArgs(['--type', 'feat,docs', '--type=fix', '--title', 'ship', '--no-verify', '--cleanup=scissors']);
  assert.deepEqual(options.types, ['feat', 'docs', 'fix']);
  assert.deepEqual(options.gitArgs, ['--no-verify', '--cleanup=scissors']);
  assert.equal(options.wyDryRun, false);
  assert.equal(parseArgs(['--type', 'feat', '--title', 'ship', '--wy-dry-run']).wyDryRun, true);
});

test('uses the leading type and title and forwards remaining Git arguments', () => {
  const args = ['custom, docs', '更新命令', '--scope=cli', '--future', 'value', '--', '--title'];
  const options = parseArgs(args);
  assert.deepEqual(options.types, ['custom', 'docs']);
  assert.equal(options.title, '更新命令');
  assert.equal(options.scope, 'cli');
  assert.deepEqual(options.gitArgs, ['--future', 'value', '--', '--title']);
});

test('named fields override positional values and preserve Git pathspecs after --', () => {
  const options = parseArgs(['fix', 'old title', '--title=ship', '--type=feat', '--type=docs', '--', 'one.txt', 'two.txt']);
  assert.deepEqual(options.types, ['feat', 'docs']);
  assert.equal(options.title, 'ship');
  assert.deepEqual(options.gitArgs, ['--', 'one.txt', 'two.txt']);
});

test('each named option overrides only its own positional field', () => {
  const typeOverride = parseArgs(['fix', 'ship', '--type=docs']);
  assert.deepEqual(typeOverride.types, ['docs']);
  assert.equal(typeOverride.title, 'ship');
  assert.deepEqual(typeOverride.gitArgs, []);
  const titleOverride = parseArgs(['fix', 'old title', '--title=ship']);
  assert.deepEqual(titleOverride.types, ['fix']);
  assert.equal(titleOverride.title, 'ship');
  assert.deepEqual(titleOverride.gitArgs, []);
});

test('rejects missing or invalid positional fields without guessing Git option values', () => {
  assert.throws(() => parseArgs(['feat', '--allow-empty']), /--type is required/);
  assert.throws(() => parseArgs(['--future', 'value', 'feat', 'ship']), /--type is required/);
  assert.throws(() => parseArgs(['feat,', 'ship']), /empty entry/);
  assert.throws(() => parseArgs(['feat', ' ']), /non-empty/);
  assert.throws(() => parseArgs(['feat', 'first\nsecond']), /single line/);
});

test('rejects a value for --wy-dry-run', () => {
  assert.throws(() => parseArgs(['--type', 'feat', '--title', 'ship', '--wy-dry-run=true']), /does not take a value/);
});

test('rejects generated message options', () => {
  assert.throws(() => parseArgs(['--type', 'feat', '--title', 'x', '--message=x']), /Do not pass/);
  assert.throws(() => parseArgs(['--type', 'feat', '--title', 'x', '-mfoo']), /Do not pass/);
});

test('rejects an invalid boolean', () => {
  assert.throws(() => parseArgs(['--type', 'feat', '--title', 'x', '--ai-review', 'maybe']), /true or false/);
});
