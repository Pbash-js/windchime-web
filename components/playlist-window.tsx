"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Pause, Music, Search, Heart, Clock } from "lucide-react"
import { useYouTubePlayer } from "@/hooks/use-youtube-player"

export function PlaylistWindow() {
  const [searchQuery, setSearchQuery] = useState("")
  const { tracks, currentTrackIndex, isPlaying, seekToTrack, togglePlay, toggleFavorite, isFavorite, isPlayerReady } =
    useYouTubePlayer()

  const filteredTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleTrackClick = (trackIndex: number) => {
    const actualIndex = tracks.findIndex((track) => track.id === filteredTracks[trackIndex].id)
    seekToTrack(actualIndex)
  }

  return (
    <div className="h-full flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold">LoFi Hip Hop Playlist</h2>
        </div>
        <div className="text-xs text-gray-400">{tracks.length} tracks</div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracks..."
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Track List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredTracks.map((track, index) => {
            const actualIndex = tracks.findIndex((t) => t.id === track.id)
            const isCurrentTrack = actualIndex === currentTrackIndex
            const isCurrentlyPlaying = isCurrentTrack && isPlaying

            return (
              <div
                key={track.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-800/50 cursor-pointer group ${
                  isCurrentTrack ? "bg-blue-600/20 border border-blue-600/30" : ""
                }`}
                onClick={() => handleTrackClick(index)}
              >
                {/* Play/Pause Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isCurrentTrack) {
                      togglePlay()
                    } else {
                      handleTrackClick(index)
                    }
                  }}
                  disabled={!isPlayerReady}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="h-4 w-4 text-white" />
                  ) : (
                    <Play className="h-4 w-4 text-white" />
                  )}
                </Button>

                {/* Track Number */}
                <div
                  className={`w-8 text-center text-sm ${
                    isCurrentTrack ? "text-blue-400 font-semibold" : "text-gray-400"
                  } group-hover:opacity-0 transition-opacity duration-200`}
                >
                  {actualIndex + 1}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isCurrentTrack ? "text-blue-400" : "text-white"}`}>
                    {track.title}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{track.artist}</div>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite()
                    }}
                  >
                    <Heart
                      className={`h-3 w-3 ${isFavorite && isCurrentTrack ? "fill-red-400 text-red-400" : "text-gray-400"}`}
                    />
                  </Button>
                  <div className="text-xs text-gray-400 w-12 text-right">
                    {formatDuration(track.startTime, track.endTime)}
                  </div>
                </div>

                {/* Playing Indicator */}
                {isCurrentlyPlaying && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-blue-400 rounded-full animate-pulse" />
                    <div
                      className="w-1 h-2 bg-blue-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            {filteredTracks.length} of {tracks.length} tracks
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              Total: {Math.floor(tracks.reduce((acc, track) => acc + (track.endTime - track.startTime), 0) / 60)} min
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
