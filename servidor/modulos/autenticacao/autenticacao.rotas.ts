import { Router, type Request } from 'express'
import { rateLimit } from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { banco } from '../../configuracao/banco.js'
import { ambiente } from '../../configuracao/ambiente.js'
import {
  membrosWorkspace,
  sessoes,
  tokensVerificacaoEmail,
  usuarios,
  workspaces,
} from '../../banco/esquema/index.js'
import { autenticar, COOKIE_SESSAO } from '../../middlewares/autenticacao.js'
import { ErroHttp } from '../../middlewares/erros.js'
import { validarCorpo } from '../../middlewares/validacao.js'
import { gerarHash, normalizarEmail, novoId, novoToken } from '../../utilitarios/seguranca.js'

const acesso = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})
const credenciais = z.object({
  email: z.string().email(),
  senha: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-zÀ-ÿ]/, 'A senha precisa conter uma letra.')
    .regex(/[0-9]/, 'A senha precisa conter um número.'),
})
const cadastro = credenciais.extend({ nome: z.string().trim().min(2).max(160) })
const verificacao = z.object({ token: z.string().min(20) })
const onboarding = z.object({
  usuarioId: z.string().uuid(),
  nome: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .min(2)
    .max(120),
})

const opcoesCookie = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: ambiente.COOKIE_SEGURO,
  path: '/',
  maxAge: 30 * 24 * 60 * 60_000,
}

async function criarSessao(usuarioId: string, req: Request) {
  const token = novoToken()
  const agora = new Date()
  const expiraEm = new Date(agora.getTime() + opcoesCookie.maxAge)
  await banco.insert(sessoes).values({
    id: novoId(),
    usuarioId,
    tokenHash: gerarHash(token),
    enderecoIp: req.ip,
    agenteUsuario: req.get('user-agent')?.slice(0, 500),
    expiraEm,
    criadoEm: agora,
  })
  return token
}

export const autenticacaoRotas = Router()

autenticacaoRotas.post('/cadastro', acesso, validarCorpo(cadastro), async (req, res) => {
  const email = normalizarEmail(req.body.email)
  const [existente] = await banco
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1)
  if (existente) throw new ErroHttp(409, 'Ja existe uma conta com este e-mail.', 'email_em_uso')
  const usuarioId = novoId()
  const token = novoToken()
  const agora = new Date()
  await banco.transaction(async (tx) => {
    await tx.insert(usuarios).values({
      id: usuarioId,
      nome: req.body.nome,
      email,
      senhaHash: await bcrypt.hash(req.body.senha, 12),
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    })
    await tx.insert(tokensVerificacaoEmail).values({
      id: novoId(),
      usuarioId,
      tokenHash: gerarHash(token),
      expiraEm: new Date(agora.getTime() + 24 * 60 * 60_000),
      criadoEm: agora,
    })
  })
  res.status(201).json({
    mensagem: 'Conta criada. Verifique seu e-mail para continuar.',
    ...(ambiente.NODE_ENV === 'development' ? { tokenVerificacao: token } : {}),
  })
})

autenticacaoRotas.post('/verificar-email', acesso, validarCorpo(verificacao), async (req, res) => {
  const agora = new Date()
  const [registro] = await banco
    .select()
    .from(tokensVerificacaoEmail)
    .where(
      and(
        eq(tokensVerificacaoEmail.tokenHash, gerarHash(req.body.token)),
        isNull(tokensVerificacaoEmail.utilizadoEm),
      ),
    )
    .limit(1)
  if (!registro || registro.expiraEm <= agora)
    throw new ErroHttp(400, 'Token invalido ou expirado.', 'token_invalido')
  await banco.transaction(async (tx) => {
    await tx
      .update(tokensVerificacaoEmail)
      .set({ utilizadoEm: agora })
      .where(eq(tokensVerificacaoEmail.id, registro.id))
    await tx
      .update(usuarios)
      .set({ emailVerificadoEm: agora, atualizadoEm: agora })
      .where(eq(usuarios.id, registro.usuarioId))
  })
  res.json({ mensagem: 'E-mail verificado.', usuarioId: registro.usuarioId })
})

autenticacaoRotas.post('/onboarding', acesso, validarCorpo(onboarding), async (req, res) => {
  const usuarioId = String(req.body.usuarioId ?? '')
  if (!usuarioId) throw new ErroHttp(422, 'Usuario ausente.', 'dados_invalidos')
  const [usuario] = await banco
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.id, usuarioId), isNull(usuarios.excluidoEm)))
    .limit(1)
  if (!usuario?.emailVerificadoEm)
    throw new ErroHttp(403, 'Verifique o e-mail antes do onboarding.', 'email_nao_verificado')
  const workspaceId = novoId()
  const agora = new Date()
  await banco.transaction(async (tx) => {
    await tx.insert(workspaces).values({
      id: workspaceId,
      nome: req.body.nome,
      slug: req.body.slug,
      criadoPorUsuarioId: usuarioId,
      criadoEm: agora,
      atualizadoEm: agora,
    })
    await tx.insert(membrosWorkspace).values({
      id: novoId(),
      workspaceId,
      usuarioId,
      funcao: 'administrador',
      status: 'ativo',
      entrouEm: agora,
      criadoEm: agora,
      atualizadoEm: agora,
    })
  })
  const token = await criarSessao(usuarioId, req)
  res.cookie(COOKIE_SESSAO, token, opcoesCookie).status(201).json({ workspaceId })
})

autenticacaoRotas.post('/entrar', acesso, validarCorpo(credenciais), async (req, res) => {
  const email = normalizarEmail(req.body.email)
  const [usuario] = await banco
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.email, email), eq(usuarios.ativo, true), isNull(usuarios.excluidoEm)))
    .limit(1)
  if (!usuario || !(await bcrypt.compare(req.body.senha, usuario.senhaHash)))
    throw new ErroHttp(401, 'E-mail ou senha incorretos.', 'credenciais_invalidas')
  if (!usuario.emailVerificadoEm)
    throw new ErroHttp(403, 'Verifique seu e-mail antes de entrar.', 'email_nao_verificado')
  const [membro] = await banco
    .select({ id: membrosWorkspace.id })
    .from(membrosWorkspace)
    .where(and(eq(membrosWorkspace.usuarioId, usuario.id), eq(membrosWorkspace.status, 'ativo')))
    .limit(1)
  if (!membro)
    throw new ErroHttp(403, 'Conclua a configuracao do workspace.', 'onboarding_incompleto')
  const token = await criarSessao(usuario.id, req)
  await banco
    .update(usuarios)
    .set({ ultimoAcessoEm: new Date() })
    .where(eq(usuarios.id, usuario.id))
  res.cookie(COOKIE_SESSAO, token, opcoesCookie).json({ mensagem: 'Sessao iniciada.' })
})

autenticacaoRotas.get('/sessao', autenticar, async (req, res) => res.json({ sessao: req.sessao }))

autenticacaoRotas.post('/sair', autenticar, async (req, res) => {
  await banco
    .update(sessoes)
    .set({ revogadoEm: new Date() })
    .where(eq(sessoes.id, req.sessao!.sessaoId))
  res.clearCookie(COOKIE_SESSAO, { path: '/' }).status(204).end()
})
