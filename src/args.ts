const valueOptions = {
  '--type': 'types',
  '--title': 'title',
  '--scope': 'scope',
  '--body': 'body',
  '--breaking': 'breaking',
  '--harness': 'harness',
  '--ai-generated': 'aiGenerated',
  '--ai-review': 'aiReview',
} as const;

type Key = typeof valueOptions[keyof typeof valueOptions];
export type CommitOptions = Partial<Record<Exclude<Key, 'types' | 'title'>, string>> & {
  types: string[];
  title: string;
  gitArgs: string[];
  wyDryRun: boolean;
};

export function parseArgs(argv: string[]): CommitOptions {
  const values: Partial<Record<Key, string>> = {};
  const types: string[] = [];
  const gitArgs: string[] = [];
  let wyDryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    // ？还是支持了 -- 吗……
    if (token === '--') {
      gitArgs.push(...argv.slice(i));
      break;
    }
    const equals = token.indexOf('=');
    const name = equals === -1 ? token : token.slice(0, equals);
    if (name === '--wy-dry-run') {
      if (equals !== -1) throw new Error('--wy-dry-run does not take a value.');
      wyDryRun = true;
      continue;
    }
    // Match -m, attached values, familiar short flag bundles, and Git's long abbreviations.
    if (/^-[aqsvenioz]*m/.test(token) || /^--m(?:e(?:s(?:s(?:a(?:g(?:e)?)?)?)?)?)?$/.test(name)) {
      throw new Error('Do not pass -m or --message; use --title and --body.');
    }
    if (!Object.hasOwn(valueOptions, name)) {
      gitArgs.push(token);
      continue;
    }
    const key = valueOptions[name as keyof typeof valueOptions];
    const next = argv[i + 1];
    if (equals === -1 && (next === undefined || /^-/.test(next))) {
      throw new Error(name + ' requires a value; use ' + name + '=VALUE for values starting with a dash.');
    }
    const value = equals === -1 ? argv[++i] : token.slice(equals + 1);
    if (!value.trim()) throw new Error(name + ' requires a non-empty value.');
    if (key === 'types') {
      const entries = value.split(',').map(entry => entry.trim());
      if (entries.includes('')) throw new Error('--type contains an empty entry.');
      types.push(...entries);
      continue;
    }
    if ((key === 'aiReview' || key === 'aiGenerated') && value !== 'true' && value !== 'false') {
      throw new Error(name + ' expects true or false.');
    }
    if ((key === 'title' || key === 'scope' || key === 'harness') && /[\r\n]/.test(value)) {
      throw new Error(name + ' must be a single line.');
    }
    values[key] = value;
  }

  if (!types.length) throw new Error('--type is required.');
  if (!values.title) throw new Error('--title is required.');
  return { ...values, title: values.title, types, gitArgs, wyDryRun };
}
