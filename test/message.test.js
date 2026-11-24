import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMessage } from '../src/message.ts';

test('formats multiple types and explicit false AI metadata', () => {
  const options = { types: ['feat', 'docs'], title: 'ship', scope: 'cli', aiGenerated: 'false', aiReview: 'true', gitArgs: [] };
  const actual = formatMessage(options, new Map([['feat', ':sparkles: 新增 / feat'], ['docs', ':pencil: 文档 / docs']]));
  assert.equal(actual, '「 :sparkles: 新增 / feat, :pencil: 文档 / docs 」(cli): ship\n\n「[AI] Agentic Coding 产物 / Agentic Coding Product」\nAI-Generated: false\nAI-Review: true');
});

test('includes both breaking-change lines', () => {
  const actual = formatMessage({ types: ['fix'], title: 'repair', breaking: 'migrate', gitArgs: [] }, new Map([['fix', ':bug: 修复 / fix']]));
  assert.match(actual, /BREAKING CHANGE: migrate/); 
});