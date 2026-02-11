"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { getUser, setUser as storeUser, removeUser, generateId } from "./store"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = getUser()
    setUserState(storedUser)
    setIsLoading(false)
  }, [])

  const login = async (email: string, _password: string) => {
    // Simulate auth - in production would validate against backend
    const existingUsers = JSON.parse(localStorage.getItem("exam-sos-all-users") || "[]")
    const found = existingUsers.find((u: User & { password: string }) => u.email === email)
    if (!found) {
      throw new Error("No account found with this email. Please sign up first.")
    }
    const userData: User = {
      id: found.id,
      username: found.username,
      email: found.email,
      createdAt: found.createdAt,
    }
    storeUser(userData)
    setUserState(userData)
  }

  const signup = async (username: string, email: string, password: string) => {
    const existingUsers = JSON.parse(localStorage.getItem("exam-sos-all-users") || "[]")
    const exists = existingUsers.find((u: User) => u.email === email)
    if (exists) {
      throw new Error("An account with this email already exists.")
    }
    const userData: User = {
      id: generateId(),
      username,
      email,
      createdAt: new Date().toISOString(),
    }
    existingUsers.push({ ...userData, password })
    localStorage.setItem("exam-sos-all-users", JSON.stringify(existingUsers))
    storeUser(userData)
    setUserState(userData)
  }

  const logout = () => {
    removeUser()
    setUserState(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
