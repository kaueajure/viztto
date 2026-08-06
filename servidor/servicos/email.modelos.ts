type ConteudoVerificacao = { nome: string; link: string }

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
