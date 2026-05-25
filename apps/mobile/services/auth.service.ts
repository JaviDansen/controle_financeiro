const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export interface LoginResponse {
  token: string
  user: { id: string; name: string; email: string }
}

export interface RegisterResponse {
  id: string
  name: string
  email: string
  createdAt: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao fazer login')
  return json.data
}

export async function register(name: string, email: string, password: string): Promise<RegisterResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao criar conta')
  return json.data
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao solicitar recuperacao')
}

export async function logout(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao sair da conta')
}

export async function validateStoredToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/cards`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return res.ok
  } catch {
    return false
  }
}
