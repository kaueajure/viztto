import { expect, test, type Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.dirname(fileURLToPath(import.meta.url))
const imagemAmostra = path.join(raiz, 'fixtures', 'amostra.png')

function idUnico() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

async function preencherCampo(page: Page, label: string | RegExp, valor: string) {
  await page.getByLabel(label, { exact: typeof label === 'string' }).fill(valor)
}

test.describe('Fluxo principal (P0)', () => {
  test('cadastro → empresa → cliente → projeto → material → comentário → aprovação → portal', async ({
    page,
  }) => {
    const sufixo = idUnico()
    const email = `e2e.${sufixo}@viztto.local`
    const senha = 'VizttoE2e1'
    const slug = `e2e-${sufixo}`.slice(0, 40)
    const nomeCliente = `Cliente E2E ${sufixo}`
    const nomeProjeto = `Projeto E2E ${sufixo}`
    const nomeMaterial = `Material E2E ${sufixo}`

    // --- Cadastro ---
    await page.goto('/criar-conta')
    await preencherCampo(page, 'Nome', 'Usuário E2E')
    await preencherCampo(page, 'E-mail', email)
    await preencherCampo(page, 'Senha', senha)
    await preencherCampo(page, 'Confirmar senha', senha)
    await page.getByLabel(/concordo com os termos/i).check()
    await page.getByRole('button', { name: /criar conta/i }).click()
    await expect(page).toHaveURL(/\/verificar-email/)

    // Token de verificação só existe em NODE_ENV=development (servidor E2E).
    await page.getByRole('button', { name: /usar token de desenvolvimento/i }).click()
    await expect(page.getByRole('heading', { name: /crie sua empresa/i })).toBeVisible()

    // --- Onboarding / empresa ---
    await preencherCampo(page, /nome da empresa/i, `Empresa E2E ${sufixo}`)
    await preencherCampo(page, /url da empresa/i, slug)
    await expect(page.getByText(/url disponível/i)).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /continuar para o viztto/i }).click()
    await expect(page).toHaveURL(/\/app\/inicio/)

    // --- Cliente ---
    await page.goto('/app/clientes/novo')
    await expect(page.getByRole('heading', { name: /novo cliente/i })).toBeVisible()
    await expect(page.getByText(/carregando limites/i)).toHaveCount(0, { timeout: 30_000 })
    await preencherCampo(page, /^Nome$/, nomeCliente)
    await preencherCampo(page, /^Empresa$/, 'Empresa do cliente')
    const [respostaCliente] = await Promise.all([
      page.waitForResponse(
        (resposta) =>
          resposta.url().includes('/api/clientes') &&
          resposta.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /salvar cliente/i }).click(),
    ])
    expect(respostaCliente.ok(), await respostaCliente.text()).toBeTruthy()
    await expect(page).toHaveURL(/\/app\/clientes\/[0-9a-f-]+/i)
    await expect(page.getByRole('heading', { name: nomeCliente })).toBeVisible()
    const clienteId = page.url().split('/').pop()!

    // Contato externo do Cliente 2 (aprovador do portal)
    const csrf = await page.evaluate(async () => {
      const r = await fetch('/api/autenticacao/csrf', { credentials: 'include' })
      const j = (await r.json()) as { token?: string; csrfToken?: string }
      return j.token ?? j.csrfToken ?? ''
    })
    const contatoRes = await page.request.post(`/api/clientes/${clienteId}/contatos`, {
      data: {
        nome: 'Maria Cliente',
        email: `maria.${sufixo}@cliente.local`,
        podeComentar: true,
        podeSolicitarAlteracoes: true,
        podeAprovar: true,
      },
      headers: { 'x-csrf-token': csrf, 'Content-Type': 'application/json' },
    })
    expect(contatoRes.ok(), await contatoRes.text()).toBeTruthy()

    // --- Projeto ---
    await page.goto(`/app/projetos/novo?client=${clienteId}`)
    await preencherCampo(page, /^Nome$/, nomeProjeto)
    await expect(page.getByRole('combobox', { name: /^Cliente$/ })).toHaveValue(clienteId)
    const [respostaProjeto] = await Promise.all([
      page.waitForResponse(
        (resposta) =>
          resposta.url().includes('/api/projetos') &&
          resposta.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /criar projeto/i }).click(),
    ])
    expect(respostaProjeto.ok(), await respostaProjeto.text()).toBeTruthy()
    await expect(page).toHaveURL(/\/app\/projetos\/[0-9a-f-]+/i)
    await expect(page.getByRole('heading', { name: nomeProjeto })).toBeVisible()
    const urlProjeto = page.url()

    // --- Material ---
    await page.getByRole('button', { name: /adicionar material/i }).click()
    const modalMaterial = page.getByRole('dialog')
    await expect(modalMaterial).toBeVisible()
    await modalMaterial.getByLabel(/nome do material/i).fill(nomeMaterial)
    await modalMaterial.locator('input[type="file"]').setInputFiles(imagemAmostra)
    const [respostaMaterial] = await Promise.all([
      page.waitForResponse(
        (resposta) =>
          resposta.url().includes('/api/materiais') &&
          resposta.request().method() === 'POST',
      ),
      modalMaterial.getByRole('button', { name: /^adicionar material$/i }).click(),
    ])
    expect(respostaMaterial.ok(), await respostaMaterial.text()).toBeTruthy()
    await page.getByRole('tab', { name: /^materiais$/i }).click()
    await expect(page.getByRole('link', { name: new RegExp(nomeMaterial, 'i') })).toBeVisible()

    // --- Comentário na revisão ---
    await page.getByRole('link', { name: new RegExp(nomeMaterial, 'i') }).click()
    await page.getByRole('link', { name: /abrir revisão/i }).click()
    await expect(page).toHaveURL(/\/revisao/)

    await page.getByRole('button', { name: /adicionar comentário/i }).click()
    await page.getByRole('button', { name: /imagem em modo de comentário/i }).press('Enter')
    await preencherCampo(page, /novo comentário/i, 'Ajuste a tipografia do título.')
    const [respostaComentario] = await Promise.all([
      page.waitForResponse(
        (resposta) =>
          resposta.url().includes('/comentarios') &&
          resposta.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /salvar comentário/i }).click(),
    ])
    expect(respostaComentario.ok(), await respostaComentario.text()).toBeTruthy()
    await expect(page.getByText(/comentário adicionado/i)).toBeVisible()

    // --- Envio para aprovação do cliente (não finaliza) ---
    await page.getByRole('button', { name: /enviar para aprovação/i }).click()
    await expect(
      page.getByRole('heading', { name: /enviar esta versão para aprovação do cliente/i }),
    ).toBeVisible()
    await page.getByLabel(/enviar mesmo com comentários abertos/i).check()
    await page.getByRole('button', { name: /^enviar para aprovação$/i }).click()
    await expect(page.getByText(/enviada para aprovação/i)).toBeVisible()

    // --- Portal público com token ---
    await page.goto(urlProjeto)
    await expect(page.getByRole('heading', { name: nomeProjeto })).toBeVisible()

    const [respostaLink] = await Promise.all([
      page.waitForResponse(
        (resposta) =>
          resposta.url().includes('/link-portal') &&
          resposta.request().method() === 'GET' &&
          resposta.ok(),
      ),
      page.getByRole('button', { name: /compartilhar link/i }).first().click(),
    ])
    const corpo = (await respostaLink.json()) as { dado?: { link?: string } }
    const linkPortal = corpo.dado?.link
    expect(linkPortal).toBeTruthy()
    expect(linkPortal).toMatch(/[?&]t=/)

    await page.goto(linkPortal!)
    await expect(page.getByRole('heading', { name: nomeProjeto })).toBeVisible()
    await page.getByRole('link', { name: new RegExp(nomeMaterial, 'i') }).click()
    await expect(page).toHaveURL(new RegExp(`/materiais/[0-9a-f-]+`, 'i'))
    await expect(page.getByRole('heading', { name: /revisão indisponível/i })).toHaveCount(0)
    await expect(page.getByText(nomeMaterial).first()).toBeVisible({ timeout: 30_000 })

    // Cliente 2 dá a aprovação final no portal.
    await page.getByRole('button', { name: /^aprovar$/i }).click()
    const dialogIdentidade = page.getByRole('dialog')
    await expect(dialogIdentidade.getByRole('heading', { name: 'Quem está revisando?' })).toBeVisible()
    await dialogIdentidade.getByLabel('Nome').fill('Maria Cliente')
    await dialogIdentidade.getByLabel('Email').fill(`maria.${sufixo}@cliente.local`)
    await dialogIdentidade.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByText(/aprovado/i).first()).toBeVisible({ timeout: 15_000 })
  })
})
