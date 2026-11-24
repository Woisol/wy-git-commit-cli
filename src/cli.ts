import { parseArgs } from './args.js';
import { configPath, loadConfig, resetConfig } from './config.js';
import { formatMessage } from './message.js';
import { run } from './process.js';

const skillSource = 'https://github.com/Woisol/WY-Git-Commit.git';
const help = [
  'Usage:',
  '  wy-git-commit --type TYPE --title TITLE [options] [git commit arguments]',
  '  wy-git-commit reset',
  '  wy-git-commit setup',
  '',
  'Options: --scope SCOPE, --body BODY, --breaking MIGRATION, --harness NAME,',
  '         --ai-generated true|false, --ai-review true|false',
  'Repeat --type or use a comma-separated list.',
  'Configuration: ' + configPath,
].join('\n');

async function main(argv: string[]) {
  if (argv.length === 1 && argv[0] === '--help') {
    console.log(help);
    return 0;
  }
  if (argv[0] === 'reset' || argv[0] === 'setup') {
    if (argv.length !== 1) throw new Error(argv[0] + ' does not take arguments.');
    if (argv[0] === 'setup') return run('npx', ['skills', 'add', skillSource, '--skill', 'wy-git-commit']);
    await resetConfig();
    console.log('Reset configuration: ' + configPath);
    return 0;
  }
  const options = parseArgs(argv);
  const config = await loadConfig();
  const message = formatMessage(options, config.labels);
  const [command, ...fixedArgs] = config.commitCommand;
  return run(command, [...fixedArgs, '-m', message, ...options.gitArgs]);
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (error) {
  console.error('wy-git-commit: ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 2;
}
