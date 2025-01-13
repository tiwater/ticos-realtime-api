import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['ws'],
  platform: 'node',
  target: 'node16',
  esbuildOptions(options) {
    options.mainFields = ['module', 'main'];
    options.conditions = ['import', 'require'];
    options.packages = 'external';
  },
}); 