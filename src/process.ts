import { constants } from 'node:os';
import spawn from 'cross-spawn';

export function run(command: string, args: string[]) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      resolve(code ?? (signal ? 128 + constants.signals[signal] : 1));
    });
  });
}
