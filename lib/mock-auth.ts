// Mock authentication system for demo purposes
export interface MockUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

class MockAuthService {
  private currentUser: MockUser | null = null
  private listeners: ((user: MockUser | null) => void)[] = []

  constructor() {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem("mock-auth-user")
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser)
    }
  }

  onAuthStateChanged(callback: (user: MockUser | null) => void) {
    this.listeners.push(callback)
    // Immediately call with current user
    callback(this.currentUser)

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentUser))
  }

  async signInWithGoogle(): Promise<MockUser> {
    const mockUser: MockUser = {
      uid: "mock-google-user-" + Date.now(),
      email: "user@example.com",
      displayName: "Demo User",
      photoURL: "https://via.placeholder.com/40x40/4285f4/ffffff?text=DU",
      emailVerified: true,
    }

    this.currentUser = mockUser
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
    this.notifyListeners()

    return mockUser
  }

  async signInWithEmail(email: string, password: string): Promise<MockUser> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser: MockUser = {
      uid: "mock-email-user-" + Date.now(),
      email,
      displayName: email.split("@")[0],
      photoURL: null,
      emailVerified: true,
    }

    this.currentUser = mockUser
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
    this.notifyListeners()

    return mockUser
  }

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<MockUser> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser: MockUser = {
      uid: "mock-signup-user-" + Date.now(),
      email,
      displayName: displayName || email.split("@")[0],
      photoURL: null,
      emailVerified: false,
    }

    this.currentUser = mockUser
    localStorage.setItem("mock-auth-user", JSON.stringify(mockUser))
    this.notifyListeners()

    return mockUser
  }

  async signOut(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem("mock-auth-user")
    this.notifyListeners()
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log("Password reset email sent to:", email)
  }

  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    if (!this.currentUser) throw new Error("No user logged in")

    this.currentUser = {
      ...this.currentUser,
      ...updates,
    }

    localStorage.setItem("mock-auth-user", JSON.stringify(this.currentUser))
    this.notifyListeners()
  }

  getCurrentUser(): MockUser | null {
    return this.currentUser
  }
}

export const mockAuth = new MockAuthService()
