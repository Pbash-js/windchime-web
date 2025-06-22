"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Chrome } from "lucide-react"

interface SignInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const { signInWithGoogle, loading } = useAuth()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in to sync your data across devices and unlock cloud features.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Button
            className="w-full"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
