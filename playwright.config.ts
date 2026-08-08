import { defineConfig, devices } from '@playwright/test'

/**
 * E2E do fluxo principal.
 *
 * Preferível: banco `viztto_testes` (`npm run test:preparar` + `BANCO_NOME=viztto_testes`).
 * Em máquina sem banco de testes, o servidor herda o `.env` (ainda força
 * NODE_ENV=development, URL local e cookie inseguro para o token de verificação).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
    locale: 'pt-BR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command:
        'cross-env NODE_ENV=development PORTA=3001 URL_APLICACAO=http://127.0.0.1:5173 COOKIE_SEGURO=false tsx servidor/servidor.ts',
      url: 'http://127.0.0.1:3001/api/saude',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORTA: '3001',
        URL_APLICACAO: 'http://127.0.0.1:5173',
        COOKIE_SEGURO: 'false',
        ...(process.env.BANCO_NOME_E2E ? { BANCO_NOME: process.env.BANCO_NOME_E2E } : {}),
      },
    },
    {
      command: 'cross-env E2E=1 vite --host 127.0.0.1 --port 5173 --strictPort',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        E2E: '1',
      },
    },
  ],
})
