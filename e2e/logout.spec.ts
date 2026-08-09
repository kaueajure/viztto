import { expect, test, type Page } from '@playwright/test'

const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

async function prepararSessao(page: Page) {
  const estado = { autenticado: true, saidas: 0 }

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname

    if (pathname === '/api/autenticacao/sessao') {
      if (!estado.autenticado) {
        await route.fulfill({
          status: 401,
          json: { erro: { codigo: 'nao_autenticado', mensagem: 'Entre para continuar.' } },
        })
        return
      }
      await route.fulfill({
        json: {
          sessao: {
            usuarioId: '11111111-1111-4111-8111-111111111111',
            usuarioNome: 'Usuário Teste',
            usuarioEmail: 'usuario@viztto.local',
            workspaceId,
            funcao: 'administrador',
            admin: false,
          },
        },
      })
      return
    }
    if (pathname === '/api/autenticacao/csrf') {
      await route.fulfill({ json: { token: 'csrf-logout' } })
      return
    }
    if (pathname === '/api/autenticacao/sair') {
      estado.saidas += 1
      estado.autenticado = false
      await route.fulfill({ status: 204, body: '' })
      return
    }
    if (pathname === '/api/workspaces/atual') {
      await route.fulfill({
        json: {
          dado: {
            id: workspaceId,
            nome: 'Workspace Teste',
            slug: 'workspace-teste',
            plano: 'agency',
            criadoEm: new Date().toISOString(),
          },
        },
      })
      return
    }
    if (
      pathname === '/api/clientes' ||
      pathname === '/api/projetos' ||
      pathname === '/api/materiais' ||
      pathname === '/api/usuarios/equipe' ||
      pathname === '/api/equipe/convites' ||
      pathname === '/api/atividades' ||
      pathname === '/api/notificacoes'
    ) {
      await route.fulfill({ json: { dados: [] } })
      return
    }
    if (pathname === '/api/assinaturas/limites') {
      await route.fulfill({
        json: {
          dado: {
            codigo: 'agency',
            nome: 'Agency',
            beneficios: [],
            limites: {},
            uso: {},
            recursos: { permiteIdentidadePersonalizada: true },
          },
        },
      })
      return
    }

    await route.fulfill({ status: 404, json: { erro: { codigo: 'nao_encontrado' } } })
  })

  return estado
}

test('remove o fundo da logo e encerra completamente a sessao', async ({ page }) => {
  const estado = await prepararSessao(page)
  await page.goto('/app/inicio')
  await expect(page.getByRole('heading', { level: 1, name: /usuário/i })).toBeVisible()

  const simbolo = page.locator('img[src^="/brand/logo-mark.png"]').first().locator('..')
  await expect(simbolo).toBeVisible()
  await expect
    .poll(() => simbolo.evaluate((elemento) => getComputedStyle(elemento).backgroundColor))
    .toBe('rgba(0, 0, 0, 0)')

  await page.getByRole('button', { name: 'Abrir menu do usuário' }).click()
  const [respostaSaida] = await Promise.all([
    page.waitForResponse(
      (resposta) =>
        resposta.url().includes('/api/autenticacao/sair') && resposta.request().method() === 'POST',
    ),
    page.getByRole('button', { name: 'Sair', exact: true }).click(),
  ])
  expect(respostaSaida.status()).toBe(204)
  await expect(page).toHaveURL(/\/entrar$/)
  await expect(page.getByRole('heading', { name: /entre no seu espaço de revisão/i })).toBeVisible()
  expect(estado.saidas).toBe(1)

  await page.goto('/app/inicio')
  await expect(page).toHaveURL(/\/entrar$/)
})
