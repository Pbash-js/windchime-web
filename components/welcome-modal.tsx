"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Mail, Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface WelcomeModalProps {
  onClose: () => void
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, loading } = useAuth()
  const { toast } = useToast()

  // Sign In State
  const [signInEmail, setSignInEmail] = useState("")
  const [signInPassword, setSignInPassword] = useState("")
  const [showSignInPassword, setShowSignInPassword] = useState(false)

  // Sign Up State
  const [signUpEmail, setSignUpEmail] = useState("")
  const [signUpPassword, setSignUpPassword] = useState("")
  const [signUpName, setSignUpName] = useState("")
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)

  // Reset Password State
  const [resetEmail, setResetEmail] = useState("")
  const [showResetForm, setShowResetForm] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      toast({
        title: "Welcome to Lofizen!",
        description: "Successfully signed in with Google",
      })
      onClose()
    } catch (error: any) {
      toast({
        title: "Sign-in failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInEmail || !signInPassword) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    try {
      await signInWithEmail(signInEmail, signInPassword)
      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      })
      onClose()
    } catch (error: any) {
      toast({
        title: "Sign-in failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpEmail || !signUpPassword || !signUpName) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      await signUpWithEmail(signUpEmail, signUpPassword, signUpName)
      toast({
        title: "Account created!",
        description: "Welcome to Lofizen",
      })
      onClose()
    } catch (error: any) {
      toast({
        title: "Sign-up failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    try {
      await resetPassword(resetEmail)
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions",
      })
      setShowResetForm(false)
      setResetEmail("")
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white/95 backdrop-blur border-0 shadow-2xl animate-in zoom-in-95 duration-300">
        <CardContent className="p-0">
          <div className="flex min-h-[500px]">
            {/* Left side with gradient */}
            <div className="w-2/5 bg-gradient-to-br from-pink-200 via-purple-200 to-cyan-200 p-8 flex flex-col justify-center relative rounded-l-lg">
              <div className="text-gray-800 text-2xl font-medium leading-tight mb-8">
                Ready for
                <br />a more{" "}
                <span className="bg-black text-white px-3 py-1 rounded-lg inline-block transform -rotate-1">
                  focused
                </span>
                <br />
                experience?
              </div>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  </div>
                  <span>
                    Press <kbd className="px-2 py-1 bg-white/50 rounded text-xs font-mono">⏸</kbd> from the control bar
                    to enjoy LoFi beats for Focus
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center mt-0.5">
                    <div className="flex gap-0.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                      <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                    </div>
                  </div>
                  <span>
                    Press <kbd className="px-2 py-1 bg-white/50 rounded text-xs font-mono">⏸⏸</kbd> to change genre and
                    add ambient sounds
                  </span>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 text-xs text-gray-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Improving focus for 10,000+ people monthly
              </div>
            </div>

            {/* Right side with authentication */}
            <div className="flex-1 p-8 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 hover:bg-gray-100"
                onClick={onClose}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to</h2>
                  <h2 className="text-2xl font-semibold text-green-600 mb-4">lofizen!</h2>
                  <p className="text-gray-600">Create an account to unlock more productivity features</p>
                </div>

                {showResetForm ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <Label htmlFor="reset-email">Email Address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="mt-1"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Email
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowResetForm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Tabs defaultValue="signin" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="signin">Sign In</TabsTrigger>
                      <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    <TabsContent value="signin" className="space-y-4">
                      <form onSubmit={handleEmailSignIn} className="space-y-4">
                        <div>
                          <Label htmlFor="signin-email">Email</Label>
                          <Input
                            id="signin-email"
                            type="email"
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="signin-password">Password</Label>
                          <div className="relative mt-1">
                            <Input
                              id="signin-password"
                              type={showSignInPassword ? "text" : "password"}
                              value={signInPassword}
                              onChange={(e) => setSignInPassword(e.target.value)}
                              placeholder="Enter your password"
                              className="pr-10"
                              disabled={loading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowSignInPassword(!showSignInPassword)}
                              disabled={loading}
                            >
                              {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Mail className="mr-2 h-4 w-4" />
                          Sign In with Email
                        </Button>
                      </form>

                      <Button
                        type="button"
                        variant="link"
                        className="w-full text-sm"
                        onClick={() => setShowResetForm(true)}
                        disabled={loading}
                      >
                        Forgot your password?
                      </Button>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4">
                      <form onSubmit={handleEmailSignUp} className="space-y-4">
                        <div>
                          <Label htmlFor="signup-name">Full Name</Label>
                          <Input
                            id="signup-name"
                            type="text"
                            value={signUpName}
                            onChange={(e) => setSignUpName(e.target.value)}
                            placeholder="Enter your full name"
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="mt-1"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="signup-password">Password</Label>
                          <div className="relative mt-1">
                            <Input
                              id="signup-password"
                              type={showSignUpPassword ? "text" : "password"}
                              value={signUpPassword}
                              onChange={(e) => setSignUpPassword(e.target.value)}
                              placeholder="Create a password (min. 6 characters)"
                              className="pr-10"
                              disabled={loading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                              disabled={loading}
                            >
                              {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Mail className="mr-2 h-4 w-4" />
                          Create Account
                        </Button>
                      </form>
                    </TabsContent>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <Button variant="outline" onClick={handleGoogleSignIn} className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </Tabs>
                )}

                <p className="text-xs text-gray-500 mt-6 text-center">
                  By signing up, you agree to our{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
