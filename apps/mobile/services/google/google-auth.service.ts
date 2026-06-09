import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export interface GoogleLoginResponse {
  token: string
  user: { id: string; name: string; email: string }
}

export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  })
}

export async function signInWithGoogle(): Promise<GoogleLoginResponse> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

  await GoogleSignin.signOut()
  const userInfo = await GoogleSignin.signIn()
  const idToken = userInfo.data?.idToken
  if (!idToken) throw new Error('Não foi possível obter idToken do Google')

  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao autenticar com Google')
  return json.data
}

export function isGoogleSignInCancelledError(error: unknown): boolean {
  return (error as { code?: string })?.code === statusCodes.SIGN_IN_CANCELLED
}
