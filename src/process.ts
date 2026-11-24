import { spawn } from 'node:child_process';
import { constants } from 'node:os';

export function run(command: string, args: string[]) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(command, args, { shell: false, stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      resolve(code ?? (signal ? 128 + constants.signals[signal] : 1));
    });
  });
}
