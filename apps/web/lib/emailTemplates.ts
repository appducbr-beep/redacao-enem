const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reda1000.app.br'

export function renderBaseEmailTemplate(params: {
  title: string
  preheader: string
  body: string
}): string {
  const { title, preheader, body } = params
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#2563eb;border-radius:12px 12px 0 0;padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:#1d4ed8;border-radius:8px;width:34px;height:34px;text-align:center;line-height:34px;font-size:15px;font-weight:bold;color:#ffffff;vertical-align:middle;">R</span>
                    <span style="vertical-align:middle;margin-left:10px;font-size:17px;font-weight:bold;color:#ffffff;">Reda<span style="color:#93c5fd;">1000</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0 8px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">© 2026 Reda1000 · Correção de redação ENEM</p>
              <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">Você recebeu este e-mail porque realizou uma ação em sua conta Reda1000.</p>
              <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;"><a href="${APP_URL}" style="color:#94a3b8;text-decoration:none;">reda1000.app.br</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
