jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}))

import { useAuthStore } from "../store/auth.store"

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
})

describe("useAuthStore — setToken", () => {
  it("quando setToken recebe um token valido, isAuthenticated fica true", () => {
    useAuthStore.getState().setToken("eyJhbGci.payload.sig")
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().token).toBe("eyJhbGci.payload.sig")
  })

  it("quando setToken recebe null, isAuthenticated fica false", () => {
    useAuthStore.getState().setToken("eyJhbGci.payload.sig")
    useAuthStore.getState().setToken(null)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })
})

describe("useAuthStore — logout", () => {
  it("logout limpa user, token e isAuthenticated", () => {
    useAuthStore.setState({
      user: { id: "uuid-1", name: "Joao", email: "joao@teste.com" },
      token: "eyJhbGci.payload.sig",
      isAuthenticated: true,
    })

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe("useAuthStore — setUser", () => {
  it("setUser armazena os dados do usuario corretamente", () => {
    const user = { id: "uuid-1", name: "Joao", email: "joao@teste.com" }
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
  })
})
