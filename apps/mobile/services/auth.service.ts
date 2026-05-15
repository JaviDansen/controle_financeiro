const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

type LoginPayload = { email: string; password: string }
type LoginResponse = { token: string; user: { id: string; name: string; email: string } }

type RegisterPayload = { name: string; email: string; password: string }
type RegisterResponse = { id: string; name: string; email: string; createdAt: string }

type ForgotPasswordResponse = { message: string }

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Erro na requisição')
  return json.data as T
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', payload)
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return request<RegisterResponse>('/auth/register', payload)
}

export async function forgotPassword(payload: { email: string }): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>('/auth/forgot-password', payload)
}
