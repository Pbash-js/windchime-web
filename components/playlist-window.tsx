"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  GripVertical,
  Heart,
  ListMusic,
  Plus,
  Trash2,
  Youtube,
} from "lucide-react"
import { useYouTubePlayerStore, Track } from "@/hooks/use-youtube-player"
import { defaultTracks, defaultPlaylist } from "@/lib/default-playlist"
import { useFirestore } from "@/hooks/use-firestore"
import { useAuth } from "@/contexts/auth-context"
import { Playlist } from "@/types/playlist"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Window } from "@/components/window"

export function PlaylistWindow() {
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const firestore = useFirestore(user ? `users/${user.uid}` : 'temp')
  
  // Track if we've checked auth state
  const [authChecked, setAuthChecked] = useState(false)

  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  )
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPlaylistUrl, setNewPlaylistUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication and fetch data
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (!user) {
          setPlaylists([])
          setFavorites({})
          setSelectedPlaylistId(null)
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

        if (fetchedPlaylists?.length > 0 && !selectedPlaylistId) {
          setSelectedPlaylistId(fetchedPlaylists[0].id)
        }
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
  }, [user, authLoading, firestore, toast, selectedPlaylistId])

  const selectedPlaylist = useMemo(() => {
    if (selectedPlaylistId === 'default-lofi') {
      return defaultPlaylist;
    }
    return playlists.find(p => p.id === selectedPlaylistId);
  }, [playlists, selectedPlaylistId])

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
        firestore.setDocument(`users/${user.uid}/preferences/favorites`, { trackIds: newFavorites })
        return newFavorites
      })
    },
    [firestore, user, toast]
  )

  // Get player state and actions from the Zustand store
  const { currentTrack, isPlaying, playlistId, actions } = useYouTubePlayerStore()
  const { playTrack, loadPlaylist } = actions
  
  // If the player has a playlist loaded but we don't have it selected, update the selection
  useEffect(() => {
    if (playlistId && playlistId !== selectedPlaylistId) {
      setSelectedPlaylistId(playlistId);
    }
  }, [playlistId, selectedPlaylistId]);
  
  // Effect to load the selected playlist
  useEffect(() => {
    if (!authChecked) return;
    
    if (selectedPlaylistId === 'default-lofi') {
      loadPlaylist('default-lofi', defaultTracks);
    } else if (selectedPlaylist) {
      loadPlaylist(selectedPlaylist.id, selectedPlaylist.tracks);
    } else if (playlists.length > 0) {
      // If we have playlists but none selected, select the first one
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [selectedPlaylistId, selectedPlaylist, playlists, loadPlaylist, authChecked]);

  // Effect to load the selected playlist into the player
  useEffect(() => {
    if (!authChecked) return;
    
    if (selectedPlaylist) {
      loadPlaylist(selectedPlaylist.id, selectedPlaylist.tracks);
    } else if (playlists.length === 0) {
      // Fallback to default playlist if no playlists exist
      const defaultPlaylistId = 'default-lofi';
      loadPlaylist(defaultPlaylistId, defaultTracks);
      setSelectedPlaylistId(defaultPlaylistId);
    }
  }, [selectedPlaylist, loadPlaylist, authChecked, playlists.length]);

  const parseYoutubeUrl = (url: string) => {
    const playlistIdMatch = url.match(/[?&]list=([^&]+)/)
    return {
      playlistId: playlistIdMatch ? playlistIdMatch[1] : null,
    }
  }

  const handleAddPlaylist = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to add playlists.",
      })
      return
    }

    if (!newPlaylistUrl) return
    const { playlistId } = parseYoutubeUrl(newPlaylistUrl)

    if (!playlistId) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "The URL must contain a valid YouTube playlist ID.",
      })
      return
    }

    if (playlists.some(p => p.id === playlistId)) {
      toast({
        variant: "destructive",
        title: "Playlist Exists",
        description: "This playlist has already been added.",
      })
      return
    }

    try {
      const response = await fetch(`/api/youtube?playlistId=${playlistId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch playlist from YouTube.")
      }
      const playlistData: Omit<Playlist, "id"> = await response.json()

      const newPlaylist: Playlist = {
        id: playlistId, // Use the YouTube playlist ID as our document ID
        ...playlistData,
      }

      // Save to Firestore under user's playlists
      await firestore.setDocument(`users/${user.uid}/playlists/${playlistId}`, newPlaylist)

      setPlaylists(prev => [...prev, newPlaylist])
      setSelectedPlaylistId(newPlaylist.id)
      toast({
        title: "Success",
        description: `Playlist "${newPlaylist.title}" added.`,
      })
      setIsAddDialogOpen(false)
      setNewPlaylistUrl("")
    } catch (error) {
      console.error("Error adding playlist:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Could not add the playlist. Please check the URL and try again.",
      })
    }
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to delete playlists.",
      })
      return
    }

    try {
      await firestore.deleteDocument(`users/${user.uid}/playlists`, playlistId)
      const newPlaylists = playlists.filter(p => p.id !== playlistId)
      setPlaylists(newPlaylists)
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(newPlaylists[0]?.id || null)
      }
      toast({
        title: "Playlist Deleted",
        description: "The playlist has been removed.",
      })
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the playlist. Please try again.",
      })
    }
  }

  const TrackItem = ({
    track,
    index,
  }: {
    track: Track
    index: number
  }) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    
    return (
      <div
        className={cn(
          "group flex items-center justify-between p-3 transition-colors",
          "hover:bg-accent/50 cursor-pointer",
          isCurrentTrack && "bg-accent"
        )}
        onClick={() => playTrack(index)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          <div className="min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              isCurrentTrack && "text-primary"
            )}>
              {track.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {track.artist}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 text-muted-foreground hover:text-foreground",
            "opacity-0 group-hover:opacity-100 focus:opacity-100",
            favorites[track.id] && "text-red-500 hover:text-red-600"
          )}
          onClick={e => {
            e.stopPropagation();
            handleToggleFavorite(track.id);
          }}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-transform",
              favorites[track.id] && "fill-current"
            )}
          />
        </Button>
      </div>
    );
  };


  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <ListMusic className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Playlist</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Playlist</span>
          </Button>
        </div>

        <div className="p-4 space-y-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Select
              value={selectedPlaylistId ?? ""}
              onValueChange={setSelectedPlaylistId}
              disabled={isLoading || playlists.length === 0}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a playlist..." />
              </SelectTrigger>
              <SelectContent>
                {playlists.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <ListMusic className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{p.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlaylistId && (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => handleDeletePlaylist(selectedPlaylistId)}
                title="Delete current playlist"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-12">
              <p className="text-muted-foreground">Loading playlists...</p>
            </div>
          ) : selectedPlaylist ? (
            <div className="divide-y divide-border/50">
              {useYouTubePlayerStore.getState().tracks.map((track, index) => (
                <TrackItem key={track.id} track={track} index={index} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Youtube className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No Playlist Selected</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Add a new playlist using the + button above
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add YouTube Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input
              id="youtube-url"
              placeholder="https://www.youtube.com/playlist?list=..."
              value={newPlaylistUrl}
              onChange={e => setNewPlaylistUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Paste the URL of the YouTube playlist.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPlaylist}>
              Add Playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaylistWindow;
