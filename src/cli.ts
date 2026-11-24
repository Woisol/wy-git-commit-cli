import { join } from 'node:path';
import { parseArgs } from './args.ts';
import { configPath, loadConfig, resetConfig } from './config.ts';
import { formatMessage } from './message.ts';
import { run } from './process.ts';

function setup() {
  const args = ['skills', 'add', 'https://github.com/Woisol/WY-Git-Commit.git', '--skill', 'wy-git-commit'];
  if (process.platform === 'win32') {
    // npm provides npx.cmd on Windows. Only these fixed setup arguments go through cmd.
    const cmd = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'cmd.exe');
    return run(cmd, ['/d', '/c', 'npx.cmd', ...args]);
  }
  return run('npx', args);
}
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
    if (argv[0] === 'setup') return setup();
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
