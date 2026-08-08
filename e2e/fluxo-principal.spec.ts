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

    // --- Aprovação no app ---
    await page.getByRole('button', { name: /^aprovar$/i }).click()
    await expect(page.getByRole('heading', { name: /aprovar esta versão/i })).toBeVisible()
    await page.getByLabel(/entendo que os comentários/i).check()
    await page.getByRole('button', { name: /aprovar versão/i }).click()
    await expect(page.getByRole('button', { name: /reabrir revisão/i })).toBeVisible()

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
    // Já aprovado no app: o portal mostra o status, sem botão de aprovar de novo.
    await expect(page.getByText(/aprovado/i).first()).toBeVisible()
  })
})
