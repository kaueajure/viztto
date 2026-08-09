import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.dirname(fileURLToPath(import.meta.url))
const imagemAmostra = path.join(raiz, 'fixtures', 'amostra.png')
const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const clienteId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const projetoId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

const marcaPadrao = {
  corPrincipal: '#b8ff4f',
  corSecundaria: '#7c8cff',
  tema: 'escuro',
  fonte: 'instrument',
  estilo: 'suave',
  logoUrl: null,
  logoClaroUrl: `/api/portal/personalizacao-assets/workspace/${workspaceId}/logoClaroUrl?v=inicial`,
  logoEscuroUrl: null,
  capaUrl: null,
  fundoTipo: 'gradiente',
  fundoCor: '#080b12',
  fundoGradiente: 'aurora',
  fundoImagemUrl: null,
  miniaturaPadraoUrl: null,
  marcaDaguaUrl: null,
  marcaDaguaOpacidade: 0.18,
  nomePortal: 'Portal do cliente',
  mensagemAprovacao: 'Material aprovado com sucesso.',
  mensagemAlteracoes: 'Solicitacao enviada.',
  rodapeTexto: '',
  suporteEmail: '',
  suporteTelefone: '',
  suporteWhatsapp: '',
  mostrarPrazo: true,
  mostrarStatus: true,
  mostrarCliente: true,
  mostrarTipo: true,
  mostrarVersao: true,
  materiaisAprovados: 'mostrar',
  whiteLabel: true,
}

async function prepararConfiguracoes(page: Page) {
  const estado = {
    csrf: 0,
    uploads: 0,
    falhasCsrf: 0,
    patches: [] as Array<Record<string, unknown>>,
    protegido: false,
    logoUrl: marcaPadrao.logoClaroUrl as string | null,
  }

  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const pathname = url.pathname
    const method = request.method()

    if (pathname === '/api/autenticacao/sessao') {
      await route.fulfill({
        json: {
          sessao: {
            usuarioId: '11111111-1111-4111-8111-111111111111',
            usuarioNome: 'Gestora Teste',
            usuarioEmail: 'gestora@viztto.local',
            workspaceId,
            funcao: 'administrador',
            admin: false,
          },
        },
      })
      return
    }
    if (pathname === '/api/autenticacao/csrf') {
      estado.csrf += 1
      await route.fulfill({ json: { token: `csrf-${estado.csrf}` } })
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
    if (pathname === '/api/clientes') {
      await route.fulfill({
        json: {
          dados: [
            {
              id: clienteId,
              workspaceId,
              nome: 'Cliente Teste',
              status: 'ativo',
              criadoEm: new Date().toISOString(),
              atualizadoEm: new Date().toISOString(),
            },
          ],
        },
      })
      return
    }
    if (pathname === '/api/projetos') {
      await route.fulfill({
        json: {
          dados: [
            {
              id: projetoId,
              clienteId,
              nome: 'Projeto Teste',
              tipo: 'Campanha',
              status: 'em_revisao',
              atualizadoEm: new Date().toISOString(),
            },
          ],
        },
      })
      return
    }
    if (
      pathname === '/api/materiais' ||
      pathname === '/api/usuarios/equipe' ||
      pathname === '/api/equipe/convites' ||
      pathname === '/api/atividades' ||
      pathname === '/api/notificacoes'
    ) {
      await route.fulfill({ json: { dados: [] } })
      return
    }
    if (pathname === '/api/configuracoes') {
      await route.fulfill({
        json: {
          dado: {
            perfil: {
              nome: 'Gestora Teste',
              email: 'gestora@viztto.local',
              funcao: 'administrador',
            },
            workspace: {
              id: workspaceId,
              nome: 'Workspace Teste',
              slug: 'workspace-teste',
              corPrincipal: '#b8ff4f',
              logoUrl: null,
            },
            preferencias: {
              comentarios: true,
              alteracoes: true,
              aprovacoes: true,
              prazos: true,
              email: true,
              sistema: true,
            },
          },
        },
      })
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
            recursos: {
              permiteIdentidadePersonalizada: true,
              permiteCalendarioEditorial: true,
              permiteRelatorios: true,
              permiteComentariosImagem: true,
              permiteComentariosVideo: true,
              permiteComentariosPdf: true,
              permiteLinksPortalCliente: true,
              permiteVariosAprovadores: true,
              permiteHistoricoAvancado: true,
              permitePrioridadeSuporte: true,
              permiteFuncoesAvancadas: true,
            },
          },
        },
      })
      return
    }
    if (pathname.includes('/api/portal/personalizacao-assets/') && method === 'GET') {
      await route.fulfill({ path: imagemAmostra, contentType: 'image/png' })
      return
    }
    if (pathname.startsWith('/api/portal-configuracoes/')) {
      const partes = pathname.split('/')
      const escopo = partes[3]
      const id = partes[4]
      const campo = partes[6]
      if (method === 'GET') {
        await route.fulfill({
          json: {
            dado: {
              configuracao: {
                ...marcaPadrao,
                logoClaroUrl: escopo === 'workspace' ? estado.logoUrl : null,
              },
              configuracaoPropria: {},
              herdando: false,
              protegido: escopo === 'projeto' && estado.protegido,
              expiraEm: null,
            },
          },
        })
        return
      }
      if (campo && method === 'POST') {
        estado.uploads += 1
        if (!estado.falhasCsrf) {
          estado.falhasCsrf += 1
          await route.fulfill({
            status: 403,
            json: { erro: { codigo: 'csrf_invalido', mensagem: 'Token CSRF invalido.' } },
          })
          return
        }
        estado.logoUrl = `/api/portal/personalizacao-assets/${escopo}/${id}/${campo}?v=${estado.uploads}`
        await route.fulfill({
          json: { mensagem: 'Imagem atualizada.', dado: { url: estado.logoUrl } },
        })
        return
      }
      if (campo && method === 'DELETE') {
        estado.logoUrl = null
        await route.fulfill({ json: { mensagem: 'Imagem removida.', dado: { url: null } } })
        return
      }
      if (method === 'PATCH') {
        const body = request.postDataJSON() as Record<string, unknown>
        estado.patches.push(body)
        if (body.senha === null) estado.protegido = false
        else if (typeof body.senha === 'string') estado.protegido = true
        await route.fulfill({
          json: {
            mensagem: 'Personalizacao atualizada.',
            dado: {
              protegido: estado.protegido,
              expiraEm: body.expiraEm ?? null,
              linkAlterado: Object.hasOwn(body, 'senha'),
            },
          },
        })
        return
      }
    }

    await route.fulfill({ status: 404, json: { erro: { codigo: 'nao_encontrado' } } })
  })

  return estado
}

test.describe('Configurações do portal', () => {
  test('renova o CSRF, substitui a imagem exibida e permite removê-la', async ({ page }) => {
    const estado = await prepararConfiguracoes(page)
    await page.goto('/app/configuracoes')
    await page.getByRole('tab', { name: 'Portal', exact: true }).click()

    const card = page.getByText('Logo para tema claro', { exact: true }).locator('..')
    const previa = card.getByRole('img')
    await expect(previa).toHaveAttribute('src', /v=inicial/)
    await expect(card.getByText('Substituir imagem')).toBeVisible()

    await card.locator('input[type="file"]').setInputFiles({
      name: 'arquivo.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('arquivo invalido'),
    })
    await expect(page.getByRole('alert')).toContainText('Use uma imagem JPEG, PNG ou WebP')
    expect(estado.uploads).toBe(0)

    await card.locator('input[type="file"]').setInputFiles(imagemAmostra)
    await expect(page.getByRole('status')).toContainText('Logo para tema claro atualizada.')
    await expect(previa).toHaveAttribute('src', /v=2/)
    expect(estado.csrf).toBe(2)

    await card.locator('input[type="file"]').setInputFiles(imagemAmostra)
    await expect(previa).toHaveAttribute('src', /v=3/)
    await expect(card.getByRole('img')).toHaveCount(1)

    await card.getByRole('button', { name: 'Remover' }).click()
    await expect(card.getByText('Nenhuma imagem definida')).toBeVisible()
    await expect(card.getByRole('img')).toHaveCount(0)
  })

  test('valida segurança, salva senha e remove a proteção sem exigir data', async ({ page }) => {
    const estado = await prepararConfiguracoes(page)
    await page.goto('/app/configuracoes')
    await page.getByRole('tab', { name: 'Portal', exact: true }).click()
    await page.getByLabel('Personalizar').selectOption('projeto')
    await expect(page.getByText('Estado salvo: sem senha')).toBeVisible()

    await page.getByRole('switch', { name: 'Definir data de expiração' }).click()
    await page.getByRole('button', { name: 'Salvar personalização' }).click()
    await expect(page.getByRole('alert')).toContainText('Escolha uma data de expiração válida')
    expect(estado.patches).toHaveLength(0)

    await page.getByRole('switch', { name: 'Definir data de expiração' }).click()
    await page.getByRole('switch', { name: 'Exigir senha para acessar este portal' }).click()
    await page.getByLabel('Senha de acesso').fill('123')
    await page.getByRole('button', { name: 'Salvar personalização' }).click()
    await expect(page.getByRole('alert')).toContainText('pelo menos 4 caracteres')
    expect(estado.patches).toHaveLength(0)

    await page.getByLabel('Senha de acesso').fill('Portal@123')
    await page.getByRole('switch', { name: 'Prazo', exact: true }).click()
    await page.getByRole('button', { name: 'Salvar personalização' }).click()
    await expect(page.getByRole('status')).toContainText('novo link de acesso')
    expect(estado.patches.at(-1)).toEqual(
      expect.objectContaining({ senha: 'Portal@123', expiraEm: null }),
    )
    expect(estado.patches.at(-1)?.configuracao).toEqual(
      expect.objectContaining({ mostrarPrazo: false }),
    )
    await expect(page.getByText('Estado salvo: senha ativa')).toBeVisible()

    await page.getByRole('switch', { name: 'Exigir senha para acessar este portal' }).click()
    await page.getByRole('button', { name: 'Salvar personalização' }).click()
    expect(estado.patches.at(-1)).toEqual(expect.objectContaining({ senha: null, expiraEm: null }))
    await expect(page.getByText('Estado salvo: sem senha')).toBeVisible()
  })
})
