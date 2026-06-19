/**
 * Roda uma vez para gerar o GMAIL_REFRESH_TOKEN.
 * Execute: npx ts-node -e "require('dotenv').config()" src/scripts/authorize-gmail.ts
 * Ou: npx ts-node src/scripts/authorize-gmail.ts
 */
import { google } from 'googleapis'
import * as http from 'http'
import * as url from 'url'

const CLIENT_ID = '143135229242-oogo3a9bitgvkudht1rdlcuednt8loqm.apps.googleusercontent.com'
const CLIENT_SECRET = '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'
const REDIRECT_URI = 'http://localhost:3001'
const SCOPES = ['https://www.googleapis.com/auth/gmail.send']

async function main() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })

  console.log('\n Abrindo navegador para autorização...')
  console.log('\nSe não abrir automaticamente, acesse:\n')
  console.log(authUrl)
  console.log('\nAguardando callback em http://localhost:3001 ...\n')

  // Tenta abrir o browser automaticamente
  const { exec } = await import('child_process')
  exec(`start "" "${authUrl}"`)

  await new Promise<void>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const parsed = url.parse(req.url ?? '', true)
      const code = parsed.query.code as string

      if (!code) {
        res.end('Código não encontrado. Tente novamente.')
        server.close()
        reject(new Error('Código de autorização não recebido'))
        return
      }

      try {
        const { tokens } = await oauth2Client.getToken(code)

        if (!tokens.refresh_token) {
          res.end('Nenhum refresh_token retornado. Tente novamente.')
          server.close()
          reject(new Error('refresh_token não retornado'))
          return
        }

        res.end('<h2>✓ Autorizado com sucesso! Pode fechar esta aba.</h2>')
        server.close()

        console.log('\n✓ Adicione esta linha ao seu .env:\n')
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`)
        console.log()
        resolve()
      } catch (err) {
        res.end('Erro ao trocar o código. Veja o terminal.')
        server.close()
        reject(err)
      }
    })

    server.listen(3001)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
