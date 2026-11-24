import type { CommitOptions } from './args.ts';

export function formatMessage(options: CommitOptions, types: ReadonlyMap<string, string>) {
  const labels = options.types.map(type => {
    const label = types.get(type);
    if (label === undefined) throw new Error('Unknown type: ' + type);
    return label;
  });
  const scope = options.scope ? '(' + options.scope + ')' : '';
  const paragraphs = ['「 ' + labels.join(', ') + ' 」' + scope + ': ' + options.title];
  if (options.body) paragraphs.push(options.body);
  if (options.breaking) {
    paragraphs.push('「 :boom: 破坏性更改 / BREAKING CHANGE 」\nBREAKING CHANGE: ' +
      options.breaking.replace(/\r?\n/g, '\n '));
  }
  if (options.harness !== undefined || options.aiGenerated !== undefined || options.aiReview !== undefined) {
    const ai = ['「[AI] Agentic Coding 产物 / Agentic Coding Product」'];
    if (options.harness !== undefined) {
      ai.push('本次提交由 ' + options.harness + ' 执行 / This commit was made by ' + options.harness + '.');
    }
    if (options.aiGenerated !== undefined) ai.push('AI-Generated: ' + options.aiGenerated);
    if (options.aiReview !== undefined) ai.push('AI-Review: ' + options.aiReview);
    paragraphs.push(ai.join('\n'));
  }
  return paragraphs.join('\n\n');
}
