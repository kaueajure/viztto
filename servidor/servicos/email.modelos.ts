type ConteudoVerificacao = { nome: string; link: string }

export function montarEmailRecuperacaoSenha({ nome, link }: ConteudoVerificacao) {
  const primeiroNome = nome.trim().split(/\s+/)[0] || 'ola'
  const assunto = 'Redefina sua senha do Viztto'
  const texto = [
    `Ola, ${primeiroNome}.`,
    '',
    'Recebemos uma solicitacao para redefinir sua senha do Viztto.',
    link,
    '',
    'Este link expira em 1 hora e so pode ser usado uma vez.',
    'Se voce nao solicitou a alteracao, ignore este e-mail.',
  ].join('\n')
  const html = envelopeEmail({
    assunto,
    titulo: 'Redefina sua senha',
    corpo: `Ola, ${escaparHtml(primeiroNome)}. Recebemos uma solicitacao para redefinir sua senha do Viztto.`,
    extra:
      '<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#7f8998;">Este link expira em 1 hora e so pode ser usado uma vez. Se voce nao solicitou a alteracao, ignore esta mensagem.</p>',
    cta: 'Criar nova senha',
    link,
  })
  return { assunto, texto, html }
}

export function montarEmailConviteWorkspace(entrada: {
  nomeConvidador: string
  workspaceNome: string
  funcao: string
  link: string
}) {
  const assunto = `Convite para ${entrada.workspaceNome} no Viztto`
  const texto = [
    `${entrada.nomeConvidador} convidou voce para participar de ${entrada.workspaceNome} no Viztto.`,
    `Funcao: ${entrada.funcao}`,
    '',
    'Aceite o convite pelo link abaixo:',
    entrada.link,
    '',
    'Este convite expira em 7 dias.',
  ].join('\n')
  const html = envelopeEmail({
    assunto,
    titulo: 'Voce recebeu um convite',
    corpo: `<strong>${escaparHtml(entrada.nomeConvidador)}</strong> convidou voce para participar de <strong>${escaparHtml(entrada.workspaceNome)}</strong> no Viztto como <strong>${escaparHtml(entrada.funcao)}</strong>.`,
    extra:
      '<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#7f8998;">Este convite expira em 7 dias.</p>',
    cta: 'Aceitar convite',
    link: entrada.link,
  })
  return { assunto, texto, html }
}

export function montarEmailVerificacao({ nome, link }: ConteudoVerificacao) {
  const primeiroNome = nome.trim().split(/\s+/)[0] || 'ola'
  const assunto = 'Confirme seu e-mail no Viztto'
  const texto = [
    `Ola, ${primeiroNome}.`,
    '',
    'Para ativar sua conta no Viztto, abra o link abaixo:',
    link,
    '',
    'Este link expira em 24 horas. Se voce nao criou esta conta, ignore este e-mail.',
    '',
    'Equipe Viztto',
  ].join('\n')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${assunto}</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;color:#f5f7fa;font-family:'Instrument Sans',Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d1117;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#151b23;border:1px solid #2a3442;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px 28px;">
              <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#1e2a12;color:#b8ff4f;font-size:12px;font-weight:600;letter-spacing:0.04em;">
                Viztto
              </div>
              <h1 style="margin:20px 0 0 0;font-size:28px;line-height:1.2;font-weight:700;color:#f5f7fa;">
                Confirme seu e-mail
              </h1>
              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#a7b0be;">
                Ola, ${escaparHtml(primeiroNome)}. Falta so um passo para liberar seu workspace.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;">
              <a href="${escaparAtributo(link)}" style="display:inline-block;background:#b8ff4f;color:#10150b;text-decoration:none;font-weight:700;font-size:15px;padding:14px 22px;border-radius:10px;">
                Verificar e-mail
              </a>
              <p style="margin:22px 0 0 0;font-size:13px;line-height:1.6;color:#7f8998;">
                Ou copie e cole este link no navegador:
              </p>
              <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;word-break:break-all;color:#a7b0be;">
                ${escaparHtml(link)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px 28px;border-top:1px solid #2a3442;">
              <p style="margin:20px 0 0 0;font-size:12px;line-height:1.6;color:#7f8998;">
                Este link expira em 24 horas. Se voce nao criou uma conta no Viztto, pode ignorar este e-mail.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { assunto, texto, html }
}

type ConteudoProjetoCriado = {
  clienteNome: string
  projetoNome: string
  criadorNome: string
  empresaNome: string
  link: string
  senhaAcesso?: string
}

type ConteudoProjetoAlterado = {
  clienteNome: string
  projetoNome: string
  empresaNome: string
  resumo: string
  link: string
}

export function montarEmailProjetoCriado({
  clienteNome,
  projetoNome,
  criadorNome,
  empresaNome,
  link,
}: ConteudoProjetoCriado) {
  const primeiroNome = clienteNome.trim().split(/\s+/)[0] || 'ola'
  const assunto = `Novo projeto: ${projetoNome}`
  const texto = [
    `Ola, ${primeiroNome}.`,
    '',
    `${criadorNome} (${empresaNome}) criou o projeto "${projetoNome}" para voce no Viztto.`,
    '',
    'Abra o link abaixo para revisar o projeto (acesso exclusivo deste link):',
    link,
    '',
    'Equipe Viztto',
  ].join('\n')

  const html = envelopeEmail({
    assunto,
    titulo: 'Novo projeto para voce',
    corpo: `Ola, ${escaparHtml(primeiroNome)}. <strong>${escaparHtml(criadorNome)}</strong> da empresa <strong>${escaparHtml(empresaNome)}</strong> criou o projeto <strong>${escaparHtml(projetoNome)}</strong> no Viztto.`,
    extra: `<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#7f8998;">Abra o link exclusivo para revisar. Nao compartilhe com terceiros.</p>`,
    cta: 'Abrir projeto',
    link,
  })

  return { assunto, texto, html }
}

export function montarEmailProjetoAlterado({
  clienteNome,
  projetoNome,
  empresaNome,
  resumo,
  link,
}: ConteudoProjetoAlterado) {
  const primeiroNome = clienteNome.trim().split(/\s+/)[0] || 'ola'
  const assunto = `Atualizacao no projeto ${projetoNome}`
  const texto = [
    `Ola, ${primeiroNome}.`,
    '',
    `Ha uma nova alteracao no projeto "${projetoNome}" (${empresaNome}).`,
    '',
    resumo,
    '',
    'Abra o link abaixo para revisar (acesso exclusivo deste link):',
    link,
    '',
    'Equipe Viztto',
  ].join('\n')

  const html = envelopeEmail({
    assunto,
    titulo: 'Alteracao no projeto',
    corpo: `Ola, ${escaparHtml(primeiroNome)}. O projeto <strong>${escaparHtml(projetoNome)}</strong> de <strong>${escaparHtml(empresaNome)}</strong> foi atualizado: ${escaparHtml(resumo)}`,
    extra: `<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#7f8998;">Abra o link exclusivo para revisar. Nao compartilhe com terceiros.</p>`,
    cta: 'Ver projeto',
    link,
  })

  return { assunto, texto, html }
}

function envelopeEmail({
  assunto,
  titulo,
  corpo,
  extra,
  cta,
  link,
}: {
  assunto: string
  titulo: string
  corpo: string
  extra?: string
  cta: string
  link: string
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escaparHtml(assunto)}</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;color:#f5f7fa;font-family:'Instrument Sans',Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d1117;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#151b23;border:1px solid #2a3442;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px 28px;">
              <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#1e2a12;color:#b8ff4f;font-size:12px;font-weight:600;letter-spacing:0.04em;">
                Viztto
              </div>
              <h1 style="margin:20px 0 0 0;font-size:28px;line-height:1.2;font-weight:700;color:#f5f7fa;">
                ${escaparHtml(titulo)}
              </h1>
              <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#a7b0be;">
                ${corpo}
              </p>
              ${extra ?? ''}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;">
              <a href="${escaparAtributo(link)}" style="display:inline-block;background:#b8ff4f;color:#10150b;text-decoration:none;font-weight:700;font-size:15px;padding:14px 22px;border-radius:10px;">
                ${escaparHtml(cta)}
              </a>
              <p style="margin:22px 0 0 0;font-size:13px;line-height:1.6;color:#7f8998;">
                Ou copie e cole este link no navegador:
              </p>
              <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;word-break:break-all;color:#a7b0be;">
                ${escaparHtml(link)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escaparHtml(valor: string) {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escaparAtributo(valor: string) {
  return escaparHtml(valor).replaceAll('`', '&#96;')
}
