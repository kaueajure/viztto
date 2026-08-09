import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import supertest from 'supertest'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { Express } from 'express'
import sharp from 'sharp'

let app: Express
let pool: (typeof import('../configuracao/banco.js'))['pool']
let banco: (typeof import('../configuracao/banco.js'))['banco']
let esquema: typeof import('../banco/esquema/index.js')
let agente: ReturnType<typeof supertest.agent>
let csrf = ''
let versaoId = ''
let comentarioId = ''
const projetoTeste = '56565656-5656-4656-8656-565656565656'
const materialTeste = '78787878-7878-4878-8878-787878787878'

beforeAll(async () => {
  ;({ criarAplicacao: appFactory } = await import('../app.js'))
  ;({ pool, banco } = await import('../configuracao/banco.js'))
  esquema = await import('../banco/esquema/index.js')
  app = appFactory()
  agente = supertest.agent(app)
  const agora = new Date()
  const senhaHash = await bcrypt.hash('Viztto@123', 4)
  await banco
    .insert(esquema.usuarios)
    .values({
      id: '11111111-1111-4111-8111-111111111111',
      nome: 'Marina Costa',
      email: 'marina@viztto.local',
      senhaHash,
      emailVerificadoEm: agora,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    })
    .onDuplicateKeyUpdate({ set: { senhaHash, emailVerificadoEm: agora, ativo: true } })
  await banco
    .insert(esquema.workspaces)
    .values({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      nome: 'Estudio Aurora',
      slug: 'estudio-aurora',
      criadoPorUsuarioId: '11111111-1111-4111-8111-111111111111',
      criadoEm: agora,
      atualizadoEm: agora,
    })
    .onDuplicateKeyUpdate({ set: { atualizadoEm: agora } })
  await banco
    .insert(esquema.membrosWorkspace)
    .values({
      id: 'eeee0001-0000-4000-8000-000000000001',
      workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      usuarioId: '11111111-1111-4111-8111-111111111111',
      funcao: 'administrador',
      status: 'ativo',
      entrouEm: agora,
      criadoEm: agora,
      atualizadoEm: agora,
    })
    .onDuplicateKeyUpdate({ set: { status: 'ativo', atualizadoEm: agora } })
  await banco
    .insert(esquema.clientes)
    .values({
      id: '45454545-4545-4545-8545-454545454545',
      workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      nome: 'Cliente da revisao',
      status: 'ativo',
      criadoPorUsuarioId: '11111111-1111-4111-8111-111111111111',
      criadoEm: agora,
      atualizadoEm: agora,
    })
    .onDuplicateKeyUpdate({ set: { atualizadoEm: agora } })
  await banco
    .insert(esquema.projetos)
    .values({
      id: projetoTeste,
      workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      clienteId: '45454545-4545-4545-8545-454545454545',
      nome: 'Projeto da revisao',
      tipo: 'Imagem',
      status: 'em_revisao',
      criadoPorUsuarioId: '11111111-1111-4111-8111-111111111111',
      criadoEm: agora,
      atualizadoEm: agora,
    })
    .onDuplicateKeyUpdate({ set: { atualizadoEm: agora } })
  await banco
    .insert(esquema.materiais)
    .values({
      id: materialTeste,
      workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      projetoId: projetoTeste,
      nome: 'Imagem para revisar',
      tipo: 'imagem',
      status: 'rascunho',
      criadoPorUsuarioId: '11111111-1111-4111-8111-111111111111',
      criadoEm: agora,
      atualizadoEm: agora,
    })
    .onDuplicateKeyUpdate({ set: { atualizadoEm: agora } })
  const token = await agente.get('/api/autenticacao/csrf').expect(200)
  csrf = token.body.token as string
  await agente
    .post('/api/autenticacao/entrar')
    .set('x-csrf-token', csrf)
    .send({ email: 'marina@viztto.local', senha: 'Viztto@123' })
    .expect(200)
})

let appFactory: () => Express
afterAll(async () => {
  await pool.end()
})

describe('API integrada com MySQL', () => {
  it('publica somente os dados comerciais dos planos ativos sem exigir login', async () => {
    const [plano] = await banco
      .select({ codigo: esquema.planosAssinatura.codigo, ativo: esquema.planosAssinatura.ativo })
      .from(esquema.planosAssinatura)
      .limit(1)
    expect(plano).toBeDefined()

    await banco
      .update(esquema.planosAssinatura)
      .set({ ativo: false })
      .where(eq(esquema.planosAssinatura.codigo, plano!.codigo))
    try {
      const resposta = await supertest(app).get('/api/publico/assinaturas/planos').expect(200)

      expect(resposta.headers['cache-control']).toBe('no-store')
      expect(resposta.body.dados.length).toBeGreaterThan(0)
      expect(
        resposta.body.dados.every((item: { ativo?: boolean }) => item.ativo === undefined),
      ).toBe(true)
      expect(
        resposta.body.dados.some((item: { codigo: string }) => item.codigo === plano!.codigo),
      ).toBe(false)
      expect(resposta.body.dados[0]).toEqual(
        expect.objectContaining({
          codigo: expect.any(String),
          nome: expect.any(String),
          descricao: expect.any(String),
          valorMensal: expect.anything(),
          moeda: expect.any(String),
          beneficios: expect.any(Array),
        }),
      )
      expect(resposta.body.dados[0]).not.toHaveProperty('mercadoPagoPlanoId')
    } finally {
      await banco
        .update(esquema.planosAssinatura)
        .set({ ativo: plano!.ativo })
        .where(eq(esquema.planosAssinatura.codigo, plano!.codigo))
    }
  })

  it('protege escrita contra CSRF', async () => {
    await supertest(app)
      .post('/api/autenticacao/entrar')
      .send({ email: 'x@x.com', senha: '12345678' })
      .expect(403)
  })
  it('retorna sessao segura derivada do workspace', async () => {
    const r = await agente.get('/api/autenticacao/sessao').expect(200)
    expect(r.body.sessao.usuarioEmail).toBe('marina@viztto.local')
    expect(r.body.sessao.workspaceId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    expect(r.body.sessao.admin).toBe(false)
  })
  it('permite admin trocar de workspace e listar todos', async () => {
    const agora = new Date()
    const workspaceExtra = 'acacacac-acac-4cac-8cac-acacacacacac'
    await banco
      .update(esquema.usuarios)
      .set({ admin: true, atualizadoEm: agora })
      .where(eq(esquema.usuarios.id, '11111111-1111-4111-8111-111111111111'))
    await banco
      .insert(esquema.workspaces)
      .values({
        id: workspaceExtra,
        nome: 'Workspace Admin',
        slug: 'workspace-admin',
        criadoPorUsuarioId: '11111111-1111-4111-8111-111111111111',
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .onDuplicateKeyUpdate({ set: { atualizadoEm: agora } })

    const sessaoAdmin = await agente.get('/api/autenticacao/sessao').expect(200)
    expect(sessaoAdmin.body.sessao.admin).toBe(true)

    const lista = await agente.get('/api/workspaces').expect(200)
    expect(lista.body.dados.some((item: { id: string }) => item.id === workspaceExtra)).toBe(true)

    await agente
      .post('/api/autenticacao/trocar-workspace')
      .set('x-csrf-token', csrf)
      .send({ workspaceId: workspaceExtra })
      .expect(200)
    const trocada = await agente.get('/api/autenticacao/sessao').expect(200)
    expect(trocada.body.sessao.workspaceId).toBe(workspaceExtra)
    expect(trocada.body.sessao.admin).toBe(true)

    await agente
      .post('/api/autenticacao/trocar-workspace')
      .set('x-csrf-token', csrf)
      .send({ workspaceId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })
      .expect(200)
    await banco
      .update(esquema.usuarios)
      .set({ admin: false, atualizadoEm: agora })
      .where(eq(esquema.usuarios.id, '11111111-1111-4111-8111-111111111111'))
  })
  it('cria e lista cliente no workspace da sessao', async () => {
    const nome = `Cliente teste ${Date.now()}`
    await agente.post('/api/clientes').set('x-csrf-token', csrf).send({ nome }).expect(201)
    const r = await agente.get('/api/clientes').query({ busca: nome }).expect(200)
    expect(r.body.dados).toHaveLength(1)
    expect(r.body.dados[0].workspaceId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
  })
  it('impede leitura de cliente pertencente a outro workspace', async () => {
    const agora = new Date()
    const usuario = '12121212-1212-4212-8212-121212121212'
    const workspace = 'abababab-abab-4bab-8bab-abababababab'
    const cliente = '34343434-3434-4434-8434-343434343434'
    await banco
      .insert(esquema.usuarios)
      .values({
        id: usuario,
        nome: 'Outro usuario',
        email: 'outro@viztto.local',
        senhaHash: 'nao-utilizado',
        emailVerificadoEm: agora,
        ativo: true,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .onDuplicateKeyUpdate({ set: { atualizadoEm: agora } })
    await banco
      .insert(esquema.workspaces)
      .values({
        id: workspace,
        nome: 'Outro workspace',
        slug: 'outro-workspace',
        criadoPorUsuarioId: usuario,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .onDuplicateKeyUpdate({ set: { atualizadoEm: agora } })
    await banco
      .insert(esquema.clientes)
      .values({
        id: cliente,
        workspaceId: workspace,
        nome: 'Cliente isolado',
        status: 'ativo',
        criadoPorUsuarioId: usuario,
        criadoEm: agora,
        atualizadoEm: agora,
      })
      .onDuplicateKeyUpdate({ set: { atualizadoEm: agora } })
    await agente.get(`/api/clientes/${cliente}`).expect(404)
  })
  it('salva, altera e remove a senha do portal com expiracao opcional', async () => {
    const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const [workspaceOriginal] = await banco
      .select({ plano: esquema.workspaces.plano })
      .from(esquema.workspaces)
      .where(eq(esquema.workspaces.id, workspaceId))
      .limit(1)
    const [projetoOriginal] = await banco
      .select({
        senhaAcessoHash: esquema.projetos.senhaAcessoHash,
        tokenPortal: esquema.projetos.tokenPortal,
        portalExpiraEm: esquema.projetos.portalExpiraEm,
      })
      .from(esquema.projetos)
      .where(eq(esquema.projetos.id, projetoTeste))
      .limit(1)

    expect(workspaceOriginal).toBeDefined()
    expect(projetoOriginal).toBeDefined()

    await banco
      .update(esquema.workspaces)
      .set({ plano: 'agency', atualizadoEm: new Date() })
      .where(eq(esquema.workspaces.id, workspaceId))

    try {
      const primeiraSenha = await agente
        .patch(`/api/portal-configuracoes/projeto/${projetoTeste}`)
        .set('x-csrf-token', csrf)
        .send({ senha: 'Portal@123' })
        .expect(200)
      expect(primeiraSenha.headers['cache-control']).toContain('no-store')
      expect(primeiraSenha.body.dado).toEqual(
        expect.objectContaining({ protegido: true, expiraEm: null, linkAlterado: true }),
      )

      const [protegido] = await banco
        .select({
          senhaAcessoHash: esquema.projetos.senhaAcessoHash,
          tokenPortal: esquema.projetos.tokenPortal,
          portalExpiraEm: esquema.projetos.portalExpiraEm,
        })
        .from(esquema.projetos)
        .where(eq(esquema.projetos.id, projetoTeste))
        .limit(1)
      expect(await bcrypt.compare('Portal@123', protegido!.senhaAcessoHash!)).toBe(true)
      expect(protegido!.portalExpiraEm).toBeNull()

      await agente
        .patch(`/api/portal-configuracoes/projeto/${projetoTeste}`)
        .set('x-csrf-token', csrf)
        .send({ senha: 'NovaSenha@456', expiraEm: null })
        .expect(200)
      const [alterado] = await banco
        .select({
          senhaAcessoHash: esquema.projetos.senhaAcessoHash,
          tokenPortal: esquema.projetos.tokenPortal,
        })
        .from(esquema.projetos)
        .where(eq(esquema.projetos.id, projetoTeste))
        .limit(1)
      expect(await bcrypt.compare('NovaSenha@456', alterado!.senhaAcessoHash!)).toBe(true)
      expect(alterado!.tokenPortal).not.toBe(protegido!.tokenPortal)

      const removida = await agente
        .patch(`/api/portal-configuracoes/projeto/${projetoTeste}`)
        .set('x-csrf-token', csrf)
        .send({ senha: null, expiraEm: null })
        .expect(200)
      expect(removida.body.dado).toEqual(
        expect.objectContaining({ protegido: false, expiraEm: null, linkAlterado: true }),
      )

      const [semSenha] = await banco
        .select({
          senhaAcessoHash: esquema.projetos.senhaAcessoHash,
          tokenPortal: esquema.projetos.tokenPortal,
          portalExpiraEm: esquema.projetos.portalExpiraEm,
        })
        .from(esquema.projetos)
        .where(eq(esquema.projetos.id, projetoTeste))
        .limit(1)
      expect(semSenha!.senhaAcessoHash).toBeNull()
      expect(semSenha!.portalExpiraEm).toBeNull()
      expect(semSenha!.tokenPortal).not.toBe(alterado!.tokenPortal)

      const dataInvalida = await agente
        .patch(`/api/portal-configuracoes/projeto/${projetoTeste}`)
        .set('x-csrf-token', csrf)
        .send({ expiraEm: '2000-01-01T00:00:00.000Z' })
        .expect(422)
      expect(dataInvalida.body.erro.codigo).toBe('portal_expiracao_invalida')
    } finally {
      await banco
        .update(esquema.projetos)
        .set({ ...projetoOriginal, atualizadoEm: new Date() })
        .where(eq(esquema.projetos.id, projetoTeste))
      await banco
        .update(esquema.workspaces)
        .set({ plano: workspaceOriginal!.plano, atualizadoEm: new Date() })
        .where(eq(esquema.workspaces.id, workspaceId))
    }
  })
  it('valida coordenadas normalizadas na API', async () => {
    const r = await agente
      .post('/api/materiais/00000000-0000-4000-8000-000000000000/comentarios')
      .set('x-csrf-token', csrf)
      .send({
        versaoMaterialId: '00000000-0000-4000-8000-000000000000',
        texto: 'Ponto',
        posicaoX: 1.4,
        posicaoY: 0.5,
      })
      .expect(422)
    expect(r.body.erro.codigo).toBe('dados_invalidos')
  })
  it('cria material e primeira versao a partir de multipart', async () => {
    const imagem = await sharp({
      create: { width: 48, height: 32, channels: 4, background: '#b8ff4f' },
    })
      .png()
      .toBuffer()
    const resposta = await agente
      .post('/api/materiais')
      .set('x-csrf-token', csrf)
      .field('projetoId', projetoTeste)
      .field('nome', `Material multipart ${Date.now()}`)
      .field('tipo', 'imagem')
      .attach('imagem', imagem, 'primeiro-envio.png')
      .expect(201)
    const [material] = await banco
      .select()
      .from(esquema.materiais)
      .where(eq(esquema.materiais.id, resposta.body.dado.id as string))
      .limit(1)
    expect(material?.versaoAtualId).toBe(resposta.body.dado.versaoId)
    expect(material?.status).toBe('em_revisao')
  })
  it('rejeita arquivo cuja assinatura nao e uma imagem', async () => {
    await agente
      .post(`/api/materiais/${materialTeste}/versoes`)
      .set('x-csrf-token', csrf)
      .field('nome', 'v2')
      .attach('imagem', Buffer.from('nao e imagem'), 'arquivo.png')
      .expect(415)
  })
  it('publica imagem real e cria versao atual em transacao', async () => {
    const imagem = await sharp({
      create: { width: 32, height: 32, channels: 4, background: '#b8ff4f' },
    })
      .png()
      .toBuffer()
    const r = await agente
      .post(`/api/materiais/${materialTeste}/versoes`)
      .set('x-csrf-token', csrf)
      .field('nome', 'Versao 1')
      .field('copiarPendencias', 'false')
      .attach('imagem', imagem, 'revisao.png')
      .expect(201)
    versaoId = r.body.dado.id as string
    const [material] = await banco
      .select()
      .from(esquema.materiais)
      .where(eq(esquema.materiais.id, materialTeste))
      .limit(1)
    expect(material?.versaoAtualId).toBe(versaoId)
  })
  it('cria, responde e resolve comentario contextualizado', async () => {
    const criado = await agente
      .post(`/api/materiais/${materialTeste}/comentarios`)
      .set('x-csrf-token', csrf)
      .send({
        versaoMaterialId: versaoId,
        texto: 'Ajustar este ponto.',
        posicaoX: 0.25,
        posicaoY: 0.75,
      })
      .expect(201)
    comentarioId = criado.body.dado.id as string
    await agente
      .post(`/api/comentarios/${comentarioId}/respostas`)
      .set('x-csrf-token', csrf)
      .send({ texto: 'Ajuste em andamento.' })
      .expect(201)
    await agente
      .post(`/api/comentarios/${comentarioId}/resolver`)
      .set('x-csrf-token', csrf)
      .expect(200)
    const [comentario] = await banco
      .select()
      .from(esquema.comentarios)
      .where(eq(esquema.comentarios.id, comentarioId))
      .limit(1)
    expect(comentario?.status).toBe('resolvido')
    expect(Number(comentario?.posicaoX)).toBe(0.25)
  })
  it('exige a versao atual explicitamente ao registrar uma aprovacao', async () => {
    const imagem = await sharp({
      create: { width: 32, height: 32, channels: 4, background: '#151b23' },
    })
      .png()
      .toBuffer()
    const publicada = await agente
      .post(`/api/materiais/${materialTeste}/versoes`)
      .set('x-csrf-token', csrf)
      .field('nome', 'Versao 2')
      .field('copiarPendencias', 'false')
      .attach('imagem', imagem, 'revisao-2.png')
      .expect(201)
    const versaoAtualId = publicada.body.dado.id as string

    const antiga = await agente
      .post(`/api/materiais/${materialTeste}/aprovar`)
      .set('x-csrf-token', csrf)
      .send({ versaoMaterialId: versaoId, confirmarPendencias: true })
      .expect(409)
    expect(antiga.body.erro.codigo).toBe('versao_nao_atual')

    await agente
      .post(`/api/materiais/${materialTeste}/aprovar`)
      .set('x-csrf-token', csrf)
      .send({ versaoMaterialId: versaoAtualId, confirmarPendencias: true })
      .expect(201)
  })
  it('nao armazena token de sessao puro', async () => {
    const [s] = await banco
      .select()
      .from(esquema.sessoes)
      .where(eq(esquema.sessoes.usuarioId, '11111111-1111-4111-8111-111111111111'))
      .limit(1)
    expect(s?.revogadoEm ?? null).toBeNull()
    expect(s?.tokenHash).toMatch(/^[a-f0-9]{64}$/)
  })
})
