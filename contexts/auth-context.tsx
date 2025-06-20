"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"

interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        }
        setUser(authUser)

        // Store user preferences locally since Firestore isn't set up
        createLocalUserDocument(authUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const createLocalUserDocument = (user: AuthUser) => {
    const userPrefsKey = `user-preferences-${user.uid}`
    const existingPrefs = localStorage.getItem(userPrefsKey)

    if (!existingPrefs) {
      const defaultPrefs = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: "dark",
          pomodoroSettings: {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLongBreak: 4,
          },
        },
      }
      localStorage.setItem(userPrefsKey, JSON.stringify(defaultPrefs))
    } else {
      // Update last login time
      const prefs = JSON.parse(existingPrefs)
      prefs.lastLoginAt = new Date().toISOString()
      localStorage.setItem(userPrefsKey, JSON.stringify(prefs))
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)
      console.log("Google sign-in successful:", result.user.displayName)
    } catch (error: any) {
      console.error("Google sign-in error:", error)
      throw new Error(error.message || "Failed to sign in with Google")
    } finally {
      setLoading(false)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log("Email sign-in successful:", result.user.email)
    } catch (error: any) {
      console.error("Email sign-in error:", error)
      throw new Error(getAuthErrorMessage(error.code))
    } finally {
      setLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true)
      const result = await createUserWithEmailAndPassword(auth, email, password)

      if (displayName) {
        await updateProfile(result.user, { displayName })
      }

      console.log("Email sign-up successful:", result.user.email)
    } catch (error: any) {
      console.error("Email sign-up error:", error)
      throw new Error(getAuthErrorMessage(error.code))
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      console.log("Sign-out successful")
    } catch (error: any) {
      console.error("Sign-out error:", error)
      throw new Error("Failed to sign out")
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      console.log("Password reset email sent")
    } catch (error: any) {
      console.error("Password reset error:", error)
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!auth.currentUser) throw new Error("No user logged in")

    try {
      await updateProfile(auth.currentUser, {
        displayName,
        ...(photoURL && { photoURL }),
      })

      // Update local state
      setUser((prev) =>
        prev
          ? {
              ...prev,
              displayName,
              ...(photoURL && { photoURL }),
            }
          : null,
      )

      // Update local storage
      if (user) {
        const userPrefsKey = `user-preferences-${user.uid}`
        const stored = localStorage.getItem(userPrefsKey)
        if (stored) {
          const prefs = JSON.parse(stored)
          prefs.displayName = displayName
          if (photoURL) prefs.photoURL = photoURL
          localStorage.setItem(userPrefsKey, JSON.stringify(prefs))
        }
      }
    } catch (error: any) {
      console.error("Profile update error:", error)
      throw new Error("Failed to update profile")
    }
  }

  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email address"
      case "auth/wrong-password":
        return "Incorrect password"
      case "auth/email-already-in-use":
        return "An account with this email already exists"
      case "auth/weak-password":
        return "Password should be at least 6 characters"
      case "auth/invalid-email":
        return "Invalid email address"
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later"
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed"
      case "auth/cancelled-popup-request":
        return "Sign-in was cancelled"
      default:
        return "An error occurred during authentication"
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut: handleSignOut,
    resetPassword,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
