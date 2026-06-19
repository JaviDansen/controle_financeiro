import { OAuth2Client } from 'google-auth-library'

let client: OAuth2Client | null = null

function getClient(): OAuth2Client {
  if (!client) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) throw new Error('Variável GOOGLE_CLIENT_ID é obrigatória')
    client = new OAuth2Client(clientId)
  }
  return client
}

export interface GoogleTokenPayload {
  googleId: string
  email: string
  name: string
}

export async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload || !payload.sub || !payload.email || !payload.name) {
    throw new Error('Token Google inválido ou incompleto')
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
  }
}
