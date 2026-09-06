import { defineConfig } from 'vitest/config'

/**
 * Vitest toma por defecto todo `**\/*.{test,spec}.ts`, lo que incluiría los specs de Playwright
 * de `end2end/`. Correrían bajo el runner equivocado y `npm test` fallaría por una razón que no
 * tiene nada que ver con el código. Los dos runners conviven excluyendo esa carpeta acá.
 */
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'end2end/**'],
  },
})
