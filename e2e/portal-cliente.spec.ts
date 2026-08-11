import { expect, test, type Page } from '@playwright/test'

const workspaceSlug = 'agencia-teste'
const projectId = '11111111-1111-4111-8111-111111111111'
const materialId = '22222222-2222-4222-8222-222222222222'
const videoId = '33333333-3333-4333-8333-333333333333'
const pdfId = '44444444-4444-4444-8444-444444444444'
const versionId = '55555555-5555-4555-8555-555555555555'
const token = 'token-portal-teste'
const reviewUrl = `/${workspaceSlug}/${projectId}/materiais/${materialId}?t=${token}`
const projectUrl = `/${workspaceSlug}/${projectId}?t=${token}`

type MockComment = {
  id: string
  materialId: string
  versionId: string
  authorId: string
  authorName: string
  text: string
  x: number
  y: number
  status: 'open' | 'resolved'
  createdAt: string
  updatedAt: string
}

async function prepararPortal(
  page: Page,
  comentariosIniciais: MockComment[] = [],
  opcoes: { whiteLabel?: boolean; logoUrl?: string | null; marca?: Record<string, unknown> } = {},
) {
  const marca = {
    corPrincipal: '#7c3aed',
    logoUrl: opcoes.logoUrl ?? null,
    whiteLabel: opcoes.whiteLabel ?? true,
    ...opcoes.marca,
  }
  const estado = {
    aprovado: false,
    comentarios: [...comentariosIniciais],
    aprovacoes: [] as Array<{ confirmarPendencias: boolean }>,
  }

  await page.route('**/api/portal/**', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    const method = request.method()

    if (pathname.endsWith(`/materiais/${materialId}/comentarios`)) {
      if (method === 'GET') {
        await route.fulfill({ json: { dados: estado.comentarios } })
        return
      }
      const body = request.postDataJSON() as {
        texto: string
        posicaoX: number
        posicaoY: number
        nome?: string
        email?: string
      }
      estado.comentarios.push({
        id: `comentario-${estado.comentarios.length + 1}`,
        materialId,
        versionId,
        authorId: 'portal:cliente',
        authorName: body.nome || 'Cliente externo',
        text: body.texto,
        x: body.posicaoX,
        y: body.posicaoY,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      await route.fulfill({ status: 201, json: { dado: { id: 'comentario-novo' } } })
      return
    }

    if (pathname.endsWith(`/materiais/${materialId}/aprovar`) && method === 'POST') {
      const body = request.postDataJSON() as {
        confirmarPendencias?: boolean
        nome?: string
        email?: string
      }
      estado.aprovacoes.push(body)
      const solicitacoes = estado.comentarios.filter(
        (item) => item.status === 'open' && (item as MockComment & { tipo?: string }).tipo === 'solicitacao_alteracao',
      )
      if (solicitacoes.length > 0) {
        await route.fulfill({
          status: 409,
          json: {
            erro: {
              codigo: 'solicitacoes_pendentes',
              mensagem: 'Existem solicitacoes de alteracao pendentes.',
              detalhes: { total: solicitacoes.length },
            },
          },
        })
        return
      }
      estado.aprovado = true
      await route.fulfill({ status: 201, json: { dado: { id: 'aprovacao-1' } } })
      return
    }

    if (pathname.endsWith(`/materiais/${materialId}/solicitar-alteracoes`)) {
      await route.fulfill({ json: { mensagem: 'Alterações solicitadas.' } })
      return
    }

    if (pathname.endsWith(`/materiais/${materialId}`)) {
      await route.fulfill({
        json: {
          dado: {
            projeto: {
              id: projectId,
              nome: 'Campanha de lançamento',
              empresaNome: 'Agência Teste',
              clienteNome: 'Cliente externo',
              workspaceSlug,
            },
            material: {
              id: materialId,
              nome: 'Peça principal',
              status: estado.aprovado ? 'aprovado' : 'aguardando_revisao',
              tipo: 'imagem',
            },
            versao: {
              id: versionId,
              numero: 2,
              nome: 'Versão 2',
              arquivoId: 'arquivo-1',
              aprovada: estado.aprovado,
              imagemUrl: '/demo/review-campaign-v4.svg',
            },
            versoes: [
              {
                id: versionId,
                numero: 2,
                nome: 'Versão 2',
                arquivoId: 'arquivo-1',
                aprovada: estado.aprovado,
                atual: true,
                imagemUrl: '/demo/review-campaign-v4.svg',
              },
            ],
            marca,
          },
        },
      })
      return
    }

    if (pathname.endsWith(`/${projectId}/conteudo`)) {
      await route.fulfill({
        json: {
          dado: {
            projeto: {
              id: projectId,
              nome: 'Campanha de lançamento',
              descricao: 'Materiais da campanha para sua revisão.',
              status: 'aguardando_revisao',
              tipo: 'Campanha',
              prazoEm: null,
              empresaNome: 'Agência Teste',
              clienteNome: 'Cliente externo',
            },
            marca,
            materiais: [
              {
                id: materialId,
                nome: 'Peça principal',
                tipo: 'imagem',
                status: 'aguardando_revisao',
                versaoAtual: 2,
                arquivoId: 'arquivo-1',
                imagemUrl: '/demo/review-campaign-v4.svg',
                atualizadoEm: new Date().toISOString(),
              },
              {
                id: videoId,
                nome: 'Filme da campanha',
                tipo: 'video',
                status: 'aguardando_revisao',
                versaoAtual: 1,
                arquivoId: 'arquivo-2',
                imagemUrl: '/api/portal/arquivo-video',
                atualizadoEm: new Date().toISOString(),
              },
              {
                id: pdfId,
                nome: 'Apresentação comercial',
                tipo: 'pdf',
                status: 'aguardando_revisao',
                versaoAtual: 1,
                arquivoId: 'arquivo-3',
                imagemUrl: '/api/portal/arquivo-pdf',
                atualizadoEm: new Date().toISOString(),
              },
            ],
          },
        },
      })
      return
    }

    if (pathname.endsWith(`/projetos/${projectId}`)) {
      await route.fulfill({
        json: {
          dado: {
            id: projectId,
            nome: 'Campanha de lançamento',
            empresaNome: 'Agência Teste',
            clienteNome: 'Cliente externo',
            workspaceSlug,
            liberado: true,
            marca,
          },
        },
      })
      return
    }

    await route.fulfill({ status: 404, json: { erro: { codigo: 'nao_encontrado' } } })
  })

  return estado
}

function comentarioAberto(): MockComment {
  return {
    id: 'comentario-aberto',
    materialId,
    versionId,
    authorId: 'portal:cliente',
    authorName: 'Cliente externo',
    text: 'Ajustar o destaque do título.',
    x: 0.45,
    y: 0.3,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

async function preencherIdentidadePortal(page: Page) {
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Quem está revisando?' })).toBeVisible()
  await dialog.getByLabel('Nome').fill('Maria Aprovadora')
  await dialog.getByLabel('Email').fill('maria@cliente.test')
  await dialog.getByRole('button', { name: 'Continuar' }).click()
}

test.describe('Portal do cliente', () => {
  test('usa somente a identidade do cliente quando o plano libera white-label', async ({
    page,
  }) => {
    await prepararPortal(page)
    await page.goto(projectUrl)

    await expect(page.getByLabel('Portal de Agência Teste')).toBeVisible()
    await expect(page.getByText('Viztto', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Agência Teste · Portal do cliente')).toBeVisible()
    await expect(page).toHaveTitle('Campanha de lançamento · Agência Teste')
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.querySelector('main')!)
          .getPropertyValue('--brand-primary')
          .trim(),
      ),
    ).toBe('#7c3aed')
    expect(
      await page.evaluate(() =>
        document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href.includes('favicon.png'),
      ),
    ).toBe(false)
  })

  test('mantém a assinatura Viztto quando o plano não inclui white-label', async ({ page }) => {
    await prepararPortal(page, [], { whiteLabel: false })
    await page.goto(projectUrl)

    await expect(page.getByText('Viztto', { exact: true })).toBeVisible()
    await expect(page).toHaveTitle('Campanha de lançamento · Viztto')
  })

  test('aplica tema, conteúdo e regras de visibilidade personalizados', async ({ page }) => {
    await prepararPortal(page, [], {
      marca: {
        tema: 'claro',
        corSecundaria: '#ff3366',
        nomePortal: 'Central da campanha',
        rodapeTexto: 'Atendimento da Agência Teste',
        mostrarStatus: false,
        mostrarTipo: false,
        mostrarVersao: false,
        materiaisAprovados: 'ocultar',
      },
    })
    await page.goto(projectUrl)

    await expect(page.getByText('Central da campanha')).toBeVisible()
    await expect(page.getByText('Atendimento da Agência Teste')).toBeVisible()
    await expect(page.getByText('Em revisão', { exact: true })).toHaveCount(0)
    await expect(page.getByText('v2', { exact: false })).toHaveCount(0)
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.querySelector('main')!).getPropertyValue('--background').trim(),
      ),
    ).toBe('#f4f6f8')
  })

  test('desbloqueia um portal protegido antes de carregar o projeto', async ({ page }) => {
    let desbloqueado = false
    await page.route('**/api/portal/**', async (route) => {
      const request = route.request()
      const pathname = new URL(request.url()).pathname
      if (pathname.endsWith('/desbloquear')) {
        desbloqueado = (request.postDataJSON() as { senha: string }).senha === '1234'
        await route.fulfill({ json: { mensagem: 'Portal desbloqueado.' } })
        return
      }
      if (!desbloqueado) {
        await route.fulfill({
          status: 401,
          json: { erro: { codigo: 'portal_senha_necessaria', mensagem: 'Digite a senha.' } },
        })
        return
      }
      if (pathname.endsWith('/conteudo')) {
        await route.fulfill({
          json: {
            dado: {
              projeto: {
                id: projectId,
                nome: 'Projeto protegido',
                descricao: null,
                status: 'aguardando_revisao',
                tipo: 'Campanha',
                prazoEm: null,
                empresaNome: 'Agência Teste',
                clienteNome: 'Cliente',
              },
              materiais: [],
            },
          },
        })
        return
      }
      await route.fulfill({
        json: {
          dado: {
            id: projectId,
            nome: 'Projeto protegido',
            empresaNome: 'Agência Teste',
            clienteNome: 'Cliente',
            workspaceSlug,
            liberado: true,
            marca: { corPrincipal: '#b8ff4f', logoUrl: null, whiteLabel: true },
          },
        },
      })
    })
    await page.goto(projectUrl)
    await expect(page.getByRole('heading', { name: 'Portal protegido' })).toBeVisible()
    await page.getByLabel('Senha').fill('1234')
    await page.getByRole('button', { name: 'Entrar no portal' }).click()
    await expect(page.getByRole('heading', { name: 'Projeto protegido' })).toBeVisible()
  })

  test('inicia em visualização e exige ativação explícita para comentar no mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await prepararPortal(page)
    await page.goto(reviewUrl)

    await expect(page.getByRole('button', { name: 'Comentar', exact: true })).toBeVisible()
    const material = page.getByRole('group', { name: /material em revisão/i })
    await expect(material).toBeVisible()
    await material.click({ position: { x: 120, y: 160 } })
    await expect(page.getByText('Novo comentário')).toHaveCount(0)

    await page.getByRole('button', { name: 'Comentar', exact: true }).click()
    await page.getByRole('button', { name: /imagem em modo de comentário/i }).press('Enter')
    await page.getByLabel('O que precisa mudar?').fill('Aumentar o contraste do título.')
    await page.getByRole('button', { name: 'Enviar comentário' }).click()
    await preencherIdentidadePortal(page)

    await expect(page.getByText(/comentário enviado/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Comentar', exact: true })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  })

  test('aprova diretamente quando não existem solicitações pendentes', async ({ page }) => {
    const estado = await prepararPortal(page)
    await page.goto(reviewUrl)

    await page.getByRole('button', { name: 'Aprovar', exact: true }).click()
    await preencherIdentidadePortal(page)
    await expect(page.getByRole('status', { name: 'Versão aprovada' })).toBeVisible()
    expect(estado.aprovacoes[0]).toMatchObject({
      nome: 'Maria Aprovadora',
      email: 'maria@cliente.test',
    })
  })

  test('bloqueia aprovação quando há solicitações de alteração abertas', async ({ page }) => {
    const pendente = {
      ...comentarioAberto(),
      tipo: 'solicitacao_alteracao',
    } as MockComment & { tipo: string }
    await prepararPortal(page, [pendente])
    await page.goto(reviewUrl)

    await page.getByRole('button', { name: 'Aprovar', exact: true }).click()
    await preencherIdentidadePortal(page)
    await expect(page.getByText(/solicitações de alteração pendentes/i)).toBeVisible()
    await expect(page.getByRole('status', { name: 'Versão aprovada' })).toHaveCount(0)
  })

  test('permite aprovar com comentários informativos abertos', async ({ page }) => {
    const estado = await prepararPortal(page, [comentarioAberto()])
    await page.goto(reviewUrl)

    await page.getByRole('button', { name: 'Aprovar', exact: true }).click()
    await preencherIdentidadePortal(page)
    await expect(page.getByRole('status', { name: 'Versão aprovada' })).toBeVisible()
    expect(estado.aprovacoes).toHaveLength(1)
  })

  test('diferencia imagem, vídeo e PDF sem carregar mídia pesada na listagem', async ({ page }) => {
    await prepararPortal(page)
    await page.goto(projectUrl)

    await expect(page.getByRole('heading', { name: 'Materiais para revisar' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Filme da campanha.*Vídeo/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Apresentação comercial.*PDF/i })).toBeVisible()
    await expect(page.locator('video')).toHaveCount(0)
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('mostra uma mensagem segura e amigável para link inválido', async ({ page }) => {
    await page.route('**/api/portal/**', (route) =>
      route.fulfill({
        status: 401,
        json: { erro: { codigo: 'portal_token_invalido', mensagem: 'Não autorizado.' } },
      }),
    )
    await page.goto(reviewUrl)

    await expect(page.getByRole('heading', { name: 'Este link não está disponível' })).toBeVisible()
    await expect(page.getByText(/solicite um novo link/i)).toBeVisible()
    await expect(page.getByText(/não autorizado/i)).toHaveCount(0)
  })
})
