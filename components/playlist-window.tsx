"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { ListMusic, Plus } from "lucide-react"
import { useYouTubePlayerStore, type Track } from "@/hooks/use-youtube-player"
import { defaultTracks, defaultPlaylist } from "@/lib/default-playlist"
import { useFirestore } from "@/hooks/use-firestore"
import { useAuth } from "@/contexts/auth-context"
import { Playlist } from "@/types/playlist"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Track component with memoization to prevent unnecessary re-renders
const TrackItem = React.memo(({ track, isCurrent, onPlay }: { 
  track: Track; 
  isCurrent: boolean; 
  onPlay: (id: string) => void 
}) => {
  const handleClick = React.useCallback(() => {
    onPlay(track.id);
  }, [onPlay, track.id]);

  return (
  <div 
    className={`flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer ${
      isCurrent ? 'bg-blue-50 dark:bg-blue-900/30' : ''
    }`}
    onClick={handleClick}
  >
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{track.title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{track.artist}</p>
    </div>
    {isCurrent && (
      <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"></div>
    )}
  </div>
  );
});

TrackItem.displayName = 'TrackItem';

export function PlaylistWindow() {
  const { toast } = useToast()
  const { user } = useAuth() // Assuming useAuth returns { user, loading }
  const firestore = useFirestore(user ? `users/${user.uid}` : 'temp')
  
  // Local state
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('default-lofi')
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPlaylistUrl, setNewPlaylistUrl] = useState("")
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [authChecked, setAuthChecked] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Get player state from store using separate selectors to avoid infinite loops
  const storePlaylistId = useYouTubePlayerStore((state) => state.playlistId)
  const storeTracks = useYouTubePlayerStore((state) => state.tracks)
  const storeCurrentTrack = useYouTubePlayerStore((state) => state.currentTrack)
  const loadPlaylist = useYouTubePlayerStore((state) => state.actions.loadPlaylist)
  const playTrackInStore = useYouTubePlayerStore((state) => state.actions.playTrack)

  // Check authentication and fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (!user) {
          setPlaylists([])
          setFavorites({})
          setSelectedPlaylistId('default-lofi')
          setAuthChecked(true)
          setIsLoading(false)
          return
        }
        
        const [fetchedPlaylists, fetchedFavoritesDoc] = await Promise.all([
          firestore.getCollection<Playlist>('playlists'),
          firestore.getDocument<{ trackIds: Record<string, boolean> }>('preferences/favorites'),
        ])

        setPlaylists(fetchedPlaylists || [])
        setFavorites(fetchedFavoritesDoc?.trackIds || {})
      } catch (error) {
        console.error("Failed to fetch initial data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your playlists or favorites.",
        })
      } finally {
        setIsLoading(false)
        setAuthChecked(true)
      }
    }
    
    fetchData()
  }, [user]) // Only depend on user, not on selectedPlaylistId or other reactive values

  // Get the selected playlist
  const selectedPlaylist = useMemo(() => {
    if (selectedPlaylistId === 'default-lofi') return defaultPlaylist
    return playlists.find(p => p.id === selectedPlaylistId) || defaultPlaylist
  }, [selectedPlaylistId, playlists])
  
  // Get tracks from the selected playlist, prioritizing store tracks for consistency
  const tracks = useMemo(() => {
    // If we're viewing the currently loaded playlist in the store, use store tracks
    if (selectedPlaylistId === storePlaylistId && storeTracks.length > 0) {
      return storeTracks
    }
    
    // Otherwise use tracks from the selected playlist
    if (!selectedPlaylist) return defaultTracks
    
    if (!Array.isArray(selectedPlaylist.tracks) || selectedPlaylist.tracks.length === 0) {
      return defaultTracks
    }
    
    return selectedPlaylist.tracks
  }, [selectedPlaylistId, storePlaylistId, storeTracks, selectedPlaylist])

  // Combined playlists (default + user playlists)
  const allPlaylists = useMemo(() => {
    return [defaultPlaylist, ...playlists]
  }, [playlists])
  
  // Initialize with store state on mount - run only once
  useEffect(() => {
    let mounted = true
    
    console.log('[PlaylistWindow] Component mounted, checking store state:', {
      storePlaylistId,
      storeTracksCount: storeTracks.length,
      storeCurrentTrack: storeCurrentTrack?.title || 'none'
    })
    
    const initializePlaylist = () => {
      if (!mounted) return
      
      // If store already has the default playlist loaded, sync our state
      if (storePlaylistId && storeTracks.length > 0) {
        setSelectedPlaylistId(storePlaylistId)
      } else {
        // Store doesn't have tracks yet, load default playlist
        console.log('[PlaylistWindow] Loading default playlist into store')
        loadPlaylist('default-lofi', defaultTracks)
      }
      
      setIsLoading(false)
      setAuthChecked(true)
      setIsInitialLoad(false)
    }
    
    initializePlaylist()
    
    return () => {
      mounted = false
    }
  }, []) // Empty dependency array - run only once

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    (trackId: string) => {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please sign in to save favorites.",
        })
        return
      }

      setFavorites(currentFavorites => {
        const newFavorites = { ...currentFavorites }
        if (newFavorites[trackId]) {
          delete newFavorites[trackId]
        } else {
          newFavorites[trackId] = true
        }
        // Persist changes to Firestore
        firestore.setDocument('preferences/favorites', { trackIds: newFavorites })
        return newFavorites
      })
    },
    [firestore, user, toast]
  )
  
  // Handle track play
  const handlePlayTrack = useCallback((trackId: string) => {
    const trackIndex = tracks.findIndex(t => t.id === trackId)
    if (trackIndex >= 0) {
      playTrackInStore(trackIndex)
    }
  }, [tracks, playTrackInStore])
  
  // Handle playlist selection
  const handlePlaylistSelect = useCallback((playlistId: string) => {
    setSelectedPlaylistId(playlistId)
    
    if (playlistId === 'default-lofi') {
      loadPlaylist('default-lofi', defaultTracks)
    } else {
      const playlist = playlists.find(p => p.id === playlistId)
      if (playlist) {
        loadPlaylist(playlist.id, playlist.tracks)
      }
    }
  }, [loadPlaylist, playlists])
  
  // Handle adding a new playlist
  const handleAddPlaylist = useCallback(async () => {
    if (!newPlaylistUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
      return
    }
    
    // TODO: Implement playlist addition logic
    console.log('Adding playlist:', newPlaylistUrl)
    
    setIsAddDialogOpen(false)
    setNewPlaylistUrl('')
  }, [newPlaylistUrl, toast])

  // Log state changes for debugging (throttled to prevent spam)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[PlaylistWindow] State snapshot:', {
        selectedPlaylistId,
        storePlaylistId,
        storeTracksCount: storeTracks.length,
        tracksCount: tracks.length,
        currentTrack: storeCurrentTrack ? `${storeCurrentTrack.title} (${storeCurrentTrack.id})` : 'none',
        isLoading,
        authChecked
      })
    }, 500) // Throttle logging
    
    return () => clearTimeout(timer)
  }, [selectedPlaylistId, storePlaylistId, storeTracks.length, tracks.length, storeCurrentTrack?.id, isLoading, authChecked])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center">
          <ListMusic className="h-8 w-8 text-gray-400 mb-2 mx-auto" />
          <p className="text-gray-500">Loading playlists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <ListMusic className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Playlist</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Playlist
        </Button>
      </div>

      {/* Playlist Selector */}
      <div className="p-4 border-b">
        <Select
          value={selectedPlaylistId}
          onValueChange={handlePlaylistSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a playlist" />
          </SelectTrigger>
          <SelectContent>
            {allPlaylists.map((playlist) => (
              <SelectItem key={playlist.id} value={playlist.id}>
                {playlist.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tracks List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-2">
            {tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                <ListMusic className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-500">No tracks in this playlist</p>
                <p className="text-sm text-gray-400">Add a playlist to get started</p>
              </div>
            ) : (
              <div className="space-y-1">
                {tracks.map((track) => (
                  <TrackItem
                    key={track.id}
                    track={track}
                    isCurrent={storeCurrentTrack?.id === track.id}
                    onPlay={handlePlayTrack}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Add Playlist Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Add Playlist</h3>
            <div className="space-y-4">
              <Input
                placeholder="Enter YouTube playlist URL"
                value={newPlaylistUrl}
                onChange={(e) => setNewPlaylistUrl(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddPlaylist}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaylistWindow