import nodemailer from 'nodemailer'
import { ambiente, emProducao } from '../configuracao/ambiente.js'
import { ErroHttp } from '../middlewares/erros.js'
import { montarEmailVerificacao } from './email.modelos.js'

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

export async function enviarEmailVerificacao(destino: string, nome: string, token: string) {
  const link = `${ambiente.URL_APLICACAO.replace(/\/$/, '')}/verificar-email?token=${encodeURIComponent(token)}`
  const { assunto, texto, html } = montarEmailVerificacao({ nome, link })
  const transporte = criarTransporte()

  if (!transporte) {
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
    await transporte.sendMail({
      from: `"${ambiente.EMAIL_NOME}" <${ambiente.EMAIL_REMETENTE}>`,
      to: destino,
      subject: assunto,
      text: texto,
      html,
    })
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
