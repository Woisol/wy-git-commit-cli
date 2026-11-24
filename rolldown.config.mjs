import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/cli.ts',
  platform: 'node',
  external: ['yaml', 'cross-spawn'],
  output: { file: 'dist/cli.js', format: 'esm', banner: '#!/usr/bin/env node' },
});
