"use client"

import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { defaultPlaylist, defaultTracks } from '@/lib/default-playlist';

export interface Track {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  title: string;
  artist: string;
}

interface PlayerState {
  player: any;
  isReady: boolean;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isShuffleEnabled: boolean;
  playlistId: string | null;
  tracks: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  currentTime: number;
  duration: number;
  actions: PlayerActions;
}

interface PlayerActions {
  init: (player: any) => void;
  play: () => void;
  pause: () => void;
  playNext: () => void;
  playPrev: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  loadPlaylist: (playlistId: string, tracks: Track[], trackToPlayId?: string) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  playTrack: (trackIndex: number) => void;
}

export const useYouTubePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  isReady: false,
  isPlaying: false,
  volume: 0.7, // Initial volume
  isMuted: false,
  isShuffleEnabled: false,
  playlistId: defaultPlaylist.id,
  tracks: defaultTracks,
  currentTrack: defaultTracks[0] || null,
  currentTrackIndex: 0,
  currentTime: 0,
  duration: 0,
  actions: {
    init: (player: any) => {
      if (!player) return;
      
      // Set initial volume and mute state
      player.setVolume(get().volume * 100);
      if (get().isMuted) {
        player.mute();
      } else {
        player.unMute();
      }
      
      // Set player reference and mark as ready
      set({ 
        player, 
        isReady: true,
        // Reset current track if needed
        currentTrack: get().tracks[get().currentTrackIndex] || null
      });
      
      // Start playing the current track if there is one
      if (get().tracks.length > 0) {
        get().actions.playTrack(get().currentTrackIndex);
      }
    },
    play: () => get().player?.playVideo(),
    pause: () => get().player?.pauseVideo(),
    playNext: () => {
      const { tracks, currentTrackIndex, isShuffleEnabled } = get();
      if (tracks.length === 0) return;
      const nextIndex = isShuffleEnabled
        ? Math.floor(Math.random() * tracks.length)
        : (currentTrackIndex + 1) % tracks.length;
      get().actions.playTrack(nextIndex);
    },
    playPrev: () => {
      const { tracks, currentTrackIndex } = get();
      if (tracks.length === 0) return;
      const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      get().actions.playTrack(prevIndex);
    },
    playTrack: (trackIndex: number) => {
      const { tracks, player, isPlaying, isReady } = get();
      const track = tracks[trackIndex];
      
      if (!track) {
        console.error('No track found at index:', trackIndex);
        return;
      }
      
      if (!player || !isReady) {
        console.error('YouTube player is not ready');
        // Queue the track to be played once player is ready
        set({ 
          currentTrack: track, 
          currentTrackIndex: trackIndex,
          currentTime: track.startTime || 0,
          isPlaying: true // Set to play once ready
        });
        return;
      }
      
      try {
        // Update track info in state first
        set({ 
          currentTrack: track, 
          currentTrackIndex: trackIndex,
          currentTime: track.startTime || 0
        });
        
        // Check if player is ready and has the getVideoData method
        if (typeof player.getVideoData === 'function') {
          const videoData = player.getVideoData();
          
          // If no video is loaded or different video is loaded
          if (!videoData || !videoData.video_id || videoData.video_id !== track.videoId) {
            console.log('Loading new video:', track.videoId);
            player.loadVideoById({
              videoId: track.videoId,
              startSeconds: track.startTime
            });
          } else {
            console.log('Seeking to start time:', track.startTime);
            player.seekTo(track.startTime, true);
          }
          
          // Resume playback if it was playing
          if (isPlaying && typeof player.playVideo === 'function') {
            player.playVideo();
          }
        } else {
          console.error('Player does not have getVideoData method');
        }
      } catch (error) {
        console.error('Error in playTrack:', error);
      }
    },
    seekTo: (time: number) => get().player?.seekTo(time, true),
    setVolume: (volume: number) => {
      const newVolume = Math.max(0, Math.min(1, volume));
      get().player?.setVolume(newVolume * 100);
      set({ volume: newVolume, isMuted: newVolume === 0 });
    },
    toggleMute: () => {
      const { player, isMuted } = get();
      if (player) {
        if (isMuted) {
          player.unMute();
          set({ isMuted: false });
        } else {
          player.mute();
          set({ isMuted: true });
        }
      }
    },
    toggleShuffle: () => set((state) => ({ isShuffleEnabled: !state.isShuffleEnabled })),
    loadPlaylist: (playlistId: string, tracks: Track[], trackToPlayId?: string) => {
      if (!tracks || tracks.length === 0) {
        console.warn('Attempted to load an empty playlist');
        return;
      }
      
      const trackIndex = trackToPlayId ? Math.max(0, tracks.findIndex(t => t.id === trackToPlayId)) : 0;
      const currentTrack = tracks[trackIndex] || tracks[0];
      
      set({ 
        playlistId, 
        tracks, 
        currentTrack,
        currentTrackIndex: trackIndex,
        isPlaying: false // Reset playing state on playlist change
      });
      
      // Only auto-play if we have a valid track and player is ready
      const { player, isReady } = get();
      if (isReady && player) {
        get().actions.playTrack(trackIndex);
        get().actions.playTrack(get().currentTrackIndex);
      }
    },
    setCurrentTime: (currentTime: number) => set({ currentTime }),
    setDuration: (duration: number) => set({ duration }),
    setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
  },
}));

export const usePlayerActions = () => useYouTubePlayerStore((state) => state.actions);

export const useYouTubePlayerHandler = () => {
  const player = useYouTubePlayerStore((state) => state.player);
  const currentTrack = useYouTubePlayerStore((state) => state.currentTrack);
  const isPlaying = useYouTubePlayerStore((state) => state.isPlaying);
  const actions = useYouTubePlayerStore((state) => state.actions);
  const [playerState, setPlayerState] = useState(-1);

  // Handle player state changes
  useEffect(() => {
    if (!player) return;

    const onStateChange = (event: any) => {
      const state = event.data;
      setPlayerState(state);
      
      // Handle different player states
      switch (state) {
        case window.YT.PlayerState.ENDED:
          actions.playNext();
          break;
        case window.YT.PlayerState.PLAYING:
          actions.setIsPlaying(true);
          break;
        case window.YT.PlayerState.PAUSED:
          actions.setIsPlaying(false);
          break;
        case window.YT.PlayerState.BUFFERING:
          // Handle buffering state if needed
          break;
        case window.YT.PlayerState.CUED:
          // Handle video cued state if needed
          break;
      }
    };

    // Add event listener for state changes
    player.addEventListener('onStateChange', onStateChange);

    // Cleanup
    return () => {
      if (player && player.removeEventListener) {
        player.removeEventListener('onStateChange', onStateChange);
      }
    };
  }, [player, actions]);

  // Update current time periodically when playing
  useEffect(() => {
    if (!player || !isPlaying) return;

    const interval = setInterval(() => {
      if (player && typeof player.getCurrentTime === 'function') {
        const currentTime = player.getCurrentTime();
        actions.setCurrentTime(currentTime);

        // Check if we've reached the end of the track
        if (currentTrack && currentTime >= currentTrack.endTime) {
          actions.playNext();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player, currentTrack, isPlaying, actions]);
};
