"use client"

import { useNetworkStatus } from "@/hooks/use-network-status"
import { Cloud, CloudOff } from "lucide-react"

export function NetworkStatus() {
  const { isOnline, wasOffline } = useNetworkStatus()

  if (isOnline && !wasOffline) return null

  return (
    <div
      className={`fixed top-16 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        isOnline
          ? "bg-green-500/10 text-green-400 border border-green-500/20"
          : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
      }`}
    >
      {isOnline ? (
        <>
          <Cloud className="h-4 w-4" />
          <span>Back online - syncing...</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4" />
          <span>Working offline</span>
        </>
      )}
    </div>
  )
}
