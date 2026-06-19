import { google } from 'googleapis'

function createGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Variáveis GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET e GMAIL_REFRESH_TOKEN são obrigatórias')
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

function buildResetEmailRaw(to: string, resetLink: string): string {
  const from = process.env.GMAIL_FROM ?? 'noreply@finapp.com'
  const subject = 'Redefinição de senha — FinApp'
  const body = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#111">Redefinir sua senha</h2>
      <p style="color:#555">Recebemos uma solicitação para redefinir a senha da sua conta FinApp.</p>
      <p style="color:#555">Clique no botão abaixo para criar uma nova senha. O link expira em <strong>15 minutos</strong>.</p>
      <a href="${resetLink}"
         style="display:inline-block;margin:24px 0;padding:12px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
        Redefinir senha
      </a>
      <p style="color:#999;font-size:12px">Se você não solicitou a redefinição, ignore este e-mail.</p>
    </div>
  `

  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`

  const message = [
    `From: FinApp <${from}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    body,
  ].join('\n')

  return Buffer.from(message).toString('base64url')
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  const gmail = createGmailClient()

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: buildResetEmailRaw(to, resetLink) },
  })
}
