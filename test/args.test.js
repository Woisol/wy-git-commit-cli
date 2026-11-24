import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/args.ts';

test('parses repeated types and forwards unknown arguments in order', () => {
  const options = parseArgs(['--type', 'feat,docs', '--type=fix', '--title', 'ship', '--no-verify', '--cleanup=scissors']);
  assert.deepEqual(options.types, ['feat', 'docs', 'fix']);
  assert.deepEqual(options.gitArgs, ['--no-verify', '--cleanup=scissors']);
  assert.equal(options.wyDebugOnly, false);
  assert.equal(parseArgs(['--type', 'feat', '--title', 'ship', '--wy-dry-run']).wyDebugOnly, true);
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
