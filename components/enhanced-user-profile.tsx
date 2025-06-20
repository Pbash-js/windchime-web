"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Settings, LogOut, Crown, CreditCard, Shield, Star } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface EnhancedUserProfileProps {
  onOpenSettings?: () => void
}

export function EnhancedUserProfile({ onOpenSettings }: EnhancedUserProfileProps) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Mock subscription status - in real app, this would come from your backend
  const subscriptionStatus = "regular" // or "premium"
  const isPremium = subscriptionStatus === "premium"

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      })
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleUpgrade = () => {
    toast({
      title: "Upgrade to Premium",
      description: "Premium features coming soon! Stay tuned for updates.",
    })
  }

  const handleProfileSettings = () => {
    toast({
      title: "Profile Settings",
      description: "Profile settings panel coming soon!",
    })
  }

  const handleBilling = () => {
    toast({
      title: "Billing & Subscription",
      description: "Billing management coming soon!",
    })
  }

  const handlePrivacy = () => {
    toast({
      title: "Privacy & Security",
      description: "Privacy settings coming soon!",
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/10 transition-all duration-200"
        onClick={() => {
          toast({
            title: "Sign in required",
            description: "Please sign in to access your profile",
          })
        }}
      >
        <User className="h-4 w-4 mr-2" />
        Sign In
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          {isPremium && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-black/90 backdrop-blur-xl border-gray-700" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium leading-none text-white">{user.displayName || "User"}</p>
                <p className="text-xs leading-none text-gray-400 mt-1">{user.email}</p>
              </div>
              <Badge
                variant={isPremium ? "default" : "secondary"}
                className={`text-xs ${
                  isPremium ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white" : "bg-gray-700 text-gray-300"
                }`}
              >
                {isPremium ? (
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Premium
                  </div>
                ) : (
                  "Regular"
                )}
              </Badge>
            </div>
            {isPremium && (
              <div className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="h-3 w-3 fill-current" />
                <span>Premium member since Jan 2024</span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer" onClick={handleProfileSettings}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer" onClick={onOpenSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>App Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer" onClick={handleBilling}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing & Subscription</span>
        </DropdownMenuItem>

        {!isPremium && (
          <DropdownMenuItem className="text-orange-400 hover:bg-orange-500/10 cursor-pointer" onClick={handleUpgrade}>
            <Crown className="mr-2 h-4 w-4" />
            <span>Upgrade to Premium</span>
            <Badge className="ml-auto bg-orange-500 text-white text-xs">50% OFF</Badge>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer" onClick={handlePrivacy}>
          <Shield className="mr-2 h-4 w-4" />
          <span>Privacy & Security</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem
          className="text-red-400 hover:bg-red-500/10 cursor-pointer"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
