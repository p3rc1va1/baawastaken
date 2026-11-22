import { defineConfig } from 'vitest/config';

// Two projects: Node (sprites, Astro components, scripts) and the Workers runtime (the edge Worker).
export default defineConfig({
  test: {
    projects: ['./vitest.node.config.ts', './vitest.worker.config.ts'],
  },
});
