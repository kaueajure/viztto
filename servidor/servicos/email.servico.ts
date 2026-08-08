import nodemailer from 'nodemailer'
import { ambiente, emProducao } from '../configuracao/ambiente.js'
import { ErroHttp } from '../middlewares/erros.js'
import {
  montarEmailConviteWorkspace,
  montarEmailProjetoAlterado,
  montarEmailProjetoCriado,
  montarEmailRecuperacaoSenha,
  montarEmailVerificacao,
} from './email.modelos.js'

function transporteConfigurado() {
  return Boolean(ambiente.EMAIL_HOST && ambiente.EMAIL_USUARIO && ambiente.EMAIL_SENHA)
}

function criarTransporte() {
  if (!transporteConfigurado()) return null
  return nodemailer.createTransport({
    host: ambiente.EMAIL_HOST,
    port: ambiente.EMAIL_PORTA,
    secure: ambiente.EMAIL_PORTA === 465,
    auth: {
      user: ambiente.EMAIL_USUARIO,
      pass: ambiente.EMAIL_SENHA,
    },
  })
}

async function enviarComTransporte(destino: string, assunto: string, texto: string, html: string) {
  const transporte = criarTransporte()
  if (!transporte) return { enviado: false as const, transporte: false as const }
  await transporte.sendMail({
    from: `"${ambiente.EMAIL_NOME}" <${ambiente.EMAIL_REMETENTE}>`,
    to: destino,
    subject: assunto,
    text: texto,
    html,
  })
  return { enviado: true as const, transporte: true as const }
}

/** Envio critico (ex.: verificacao). Em producao exige SMTP. */
export async function enviarEmailVerificacao(destino: string, nome: string, token: string) {
  const link = `${ambiente.URL_APLICACAO.replace(/\/$/, '')}/verificar-email?token=${encodeURIComponent(token)}`
  const { assunto, texto, html } = montarEmailVerificacao({ nome, link })

  if (!transporteConfigurado()) {
    if (emProducao) {
      throw new ErroHttp(
        503,
        'Envio de e-mail indisponivel. Configure o SMTP do Viztto.',
        'email_indisponivel',
      )
    }
    console.info(`[viztto] Verificacao para ${destino}: ${link}`)
    return { enviado: false as const, link }
  }

  try {
    await enviarComTransporte(destino, assunto, texto, html)
  } catch (erro) {
    console.error(
      'Falha ao enviar e-mail de verificacao.',
      erro instanceof Error ? erro.message : erro,
    )
    throw new ErroHttp(
      503,
      'Nao foi possivel enviar o e-mail de verificacao. Tente novamente em instantes.',
      'email_falhou',
    )
  }
  return { enviado: true as const, link }
}

async function enviarEmailCritico(
  destino: string,
  assunto: string,
  texto: string,
  html: string,
  contexto: string,
) {
  if (!transporteConfigurado()) {
    if (emProducao) throw new ErroHttp(503, 'Envio de e-mail indisponivel.', 'email_indisponivel')
    console.info(`[viztto] ${contexto} para ${destino}: ${texto}`)
    return false
  }
  try {
    await enviarComTransporte(destino, assunto, texto, html)
    return true
  } catch (erro) {
    console.error(`Falha ao enviar ${contexto}.`, erro instanceof Error ? erro.message : erro)
    throw new ErroHttp(503, 'Nao foi possivel enviar o e-mail. Tente novamente.', 'email_falhou')
  }
}

export async function enviarEmailRecuperacaoSenha(destino: string, nome: string, token: string) {
  const link = `${ambiente.URL_APLICACAO.replace(/\/$/, '')}/redefinir-senha?token=${encodeURIComponent(token)}`
  const conteudo = montarEmailRecuperacaoSenha({ nome, link })
  const enviado = await enviarEmailCritico(
    destino,
    conteudo.assunto,
    conteudo.texto,
    conteudo.html,
    'recuperacao de senha',
  )
  return { enviado, link }
}

export async function enviarEmailConviteWorkspace(entrada: {
  destino: string
  nomeConvidador: string
  workspaceNome: string
  funcao: string
  token: string
}) {
  const link = `${ambiente.URL_APLICACAO.replace(/\/$/, '')}/aceitar-convite?token=${encodeURIComponent(entrada.token)}&email=${encodeURIComponent(entrada.destino)}`
  const conteudo = montarEmailConviteWorkspace({ ...entrada, link })
  const enviado = await enviarEmailCritico(
    entrada.destino,
    conteudo.assunto,
    conteudo.texto,
    conteudo.html,
    'convite de equipe',
  )
  return { enviado, link }
}

/** Notificacoes de projeto: nunca interrompem a operacao principal. */
async function tentarEnviarNotificacao(
  destino: string,
  assunto: string,
  texto: string,
  html: string,
  contexto: string,
) {
  try {
    const resultado = await enviarComTransporte(destino, assunto, texto, html)
    if (!resultado.enviado) {
      console.info(`[viztto] ${contexto} (SMTP ausente) para ${destino}: ${assunto}`)
      return false
    }
    return true
  } catch (erro) {
    console.error(
      `Falha ao enviar ${contexto} para ${destino}.`,
      erro instanceof Error ? erro.message : erro,
    )
    return false
  }
}

export async function enviarEmailProjetoCriado(entrada: {
  destino: string
  clienteNome: string
  projetoNome: string
  criadorNome: string
  empresaNome: string
  link: string
  senhaAcesso?: string
}) {
  const { assunto, texto, html } = montarEmailProjetoCriado(entrada)
  return tentarEnviarNotificacao(entrada.destino, assunto, texto, html, 'e-mail de projeto criado')
}

export async function enviarEmailProjetoAlterado(entrada: {
  destino: string
  clienteNome: string
  projetoNome: string
  empresaNome: string
  resumo: string
  link: string
}) {
  const { assunto, texto, html } = montarEmailProjetoAlterado(entrada)
  return tentarEnviarNotificacao(
    entrada.destino,
    assunto,
    texto,
    html,
    'e-mail de alteracao de projeto',
  )
}
