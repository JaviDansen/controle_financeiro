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

function buildResetEmailRaw(to: string, code: string): string {
  const from = process.env.GMAIL_FROM ?? 'noreply@finapp.com'
  const subject = 'Redefinição de senha — FinApp'
  const body = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;text-align:center;">
      <h2 style="color:#15151A;margin-bottom:16px;">Seu código de recuperação de senha</h2>
      <p style="color:#3B3B43;font-size:15px;margin-bottom:24px;">Use o código de 6 dígitos abaixo no aplicativo para criar uma nova senha:</p>
      <div style="background:#f4f4f5;padding:16px;border-radius:12px;font-size:32px;font-weight:bold;letter-spacing:6px;margin:24px 0;color:#15151A;display:inline-block;min-width:180px;">
        ${code}
      </div>
      <p style="color:#999;font-size:12px;margin-top:24px;">Este código expira em 15 minutos.</p>
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

export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const gmail = createGmailClient()

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: buildResetEmailRaw(to, code) },
  })
}
