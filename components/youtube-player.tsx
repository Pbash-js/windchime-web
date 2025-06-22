"use client";

import { useEffect, useRef, useCallback, useState } from 'react';
import { useYouTubePlayerStore } from '@/hooks/use-youtube-player';

// Define YouTube Player types
type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getAvailableQualityLevels: () => string[];
  setPlaybackQuality: (suggestedQuality: string) => void;
  getPlaybackRate: () => number;
  setPlaybackRate: (suggestedRate: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  destroy: () => void;
  cueVideoById: (videoId: string, startSeconds?: number, suggestedQuality?: string) => void;
  loadVideoById: (videoId: string, startSeconds?: number, suggestedQuality?: string) => void;
  cuePlaylist: (playlist: string | string[], index?: number, startSeconds?: number, suggestedQuality?: string) => void;
  loadPlaylist: (playlist: string | string[], index?: number, startSeconds?: number, suggestedQuality?: string) => void;
};

type YTPlayerConfig = {
  height?: string;
  width?: string;
  videoId?: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    fs?: 0 | 1;
    iv_load_policy?: 1 | 3;
    rel?: 0 | 1;
    showinfo?: 0 | 1;
    modestbranding?: 0 | 1;
    origin?: string;
    playsinline?: 0 | 1;
    widget_referrer?: string;
    host?: string;
    html5?: 0 | 1;
    wmode?: string;
    version?: number;
  };
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number; target: YTPlayer }) => void;
    onError?: (event: { data: number; target: YTPlayer }) => void;
    onPlaybackQualityChange?: (event: { data: string; target: YTPlayer }) => void;
    onPlaybackRateChange?: (event: { data: number; target: YTPlayer }) => void;
  };
};

type YT = {
  Player: new (element: HTMLElement | string, config: YTPlayerConfig) => YTPlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
    UNSTARTED: number;
    ERROR: number;
  };
  loaded: boolean;
};

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: YT;
  }
}

export function YouTubePlayer() {
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<YTPlayer | null>(null);
  const progressRef = useRef<number>(0);
  const { init, setCurrentTime, setDuration, setIsPlaying } = useYouTubePlayerStore((state) => state.actions);
  const [initialized, setInitialized] = useState(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const retryDelay = 1000;
  const isInitializing = useRef(false)

  // Update progress bar
  const updateProgress = useCallback(() => {
    if (!playerInstance.current) return;

    const update = () => {
      try {
        const currentTime = playerInstance.current?.getCurrentTime() || 0;
        const duration = playerInstance.current?.getDuration() || 0;
        
        setCurrentTime(currentTime);
        setDuration(duration);
        
        progressRef.current = requestAnimationFrame(update);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    };
    
    progressRef.current = requestAnimationFrame(update);
  }, [setCurrentTime, setDuration]);

  // Initialize the player in the store
  const initializePlayer = useCallback((player: YTPlayer) => {
    try {
      if (typeof init === 'function') {
        init(player);
        console.log('Player initialized in store');
        retryCount.current = 0;
        setInitialized(true);
        isInitializing.current = false;
        
        // After initialization, check if there's a track queued to play
        const state = useYouTubePlayerStore.getState();
        if (state.currentTrack && state.isPlaying) {
          const { currentTrackIndex } = state;
          useYouTubePlayerStore.getState().actions.playTrack(currentTrackIndex);
        }
      } else {
        console.error('Init function is not available');
        isInitializing.current = false;
      }
    } catch (error) {
      console.error('Error initializing player in store:', error);
      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        console.log(`Retrying player initialization (${retryCount.current}/${maxRetries})...`);
        setTimeout(() => initializePlayer(player), retryDelay * retryCount.current);
      }
    }
  }, [init]);

  // Load the YouTube IFrame API
  const loadYouTubeAPI = useCallback(() => {
    if (document.getElementById('youtube-iframe-api-script')) {
      console.log('YouTube API script already exists');
      return;
    }

    console.log('Loading YouTube API...');
    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // Create the YouTube player instance
  const createPlayer = useCallback(() => {
    if (!playerRef.current || playerInstance.current) return () => {};
    
    const playerConfig: YTPlayerConfig = {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
        playsinline: 1,
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        widget_referrer: typeof window !== 'undefined' ? window.location.href : '',
        host: 'https://www.youtube.com',
        html5: 1,
        wmode: 'transparent',
      },
      events: {
        onReady: (event: { target: YTPlayer }) => {
          console.log('YouTube Player Ready');
          playerInstance.current = event.target;
          initializePlayer(event.target);
        },
        onStateChange: (event: { data: number; target: YTPlayer }) => {
          switch (event.data) {
            case 1: // Playing
              setIsPlaying(true);
              updateProgress();
              break;
            case 2: // Paused
              setIsPlaying(false);
              cancelAnimationFrame(progressRef.current);
              break;
            case 0: // Ended
              useYouTubePlayerStore.getState().actions.playNext();
              break;
            case -1: // Unstarted
            case 5: // Video cued
              const { currentTrack } = useYouTubePlayerStore.getState();
              if (currentTrack) {
                event.target.seekTo(currentTrack.startTime, true);
              }
              break;
            default:
              break;
          }
        },
        onError: (event: { data: number }) => {
          console.error('YouTube Player Error:', event);
          useYouTubePlayerStore.getState().actions.playNext();
        },
      },
    };

    try {
      if (window.YT && window.YT.Player) {
        playerInstance.current = new window.YT.Player(playerRef.current, playerConfig);
        setInitialized(true);
      }
    } catch (error) {
      console.error('Failed to create YouTube player:', error);
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(`Retrying player initialization (${retryCount.current}/${maxRetries})...`);
        setTimeout(() => createPlayer(), retryDelay * retryCount.current);
      }
    }

    return () => {
      if (playerInstance.current) {
        try {
          playerInstance.current.destroy();
        } catch (e) {
          console.error('Error cleaning up YouTube player:', e);
        }
        playerInstance.current = null;
      }
    };
  }, [initializePlayer, updateProgress, setIsPlaying]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined' || initialized) return;

    // Check if YT is already loaded
    if (window.YT && window.YT.Player) {
      createPlayer();
      return;
    }

    // Set up the global callback
    window.onYouTubeIframeAPIReady = createPlayer;

    // Load the YouTube IFrame API script if not already loaded
    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    return () => {
      if (window.onYouTubeIframeAPIReady === createPlayer) {
        window.onYouTubeIframeAPIReady = undefined;
      }
    };
  }, [createPlayer, initialized]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(progressRef.current);
      if (playerInstance.current) {
        try {
          playerInstance.current.destroy();
        } catch (error) {
          console.error('Error destroying YouTube player:', error);
        }
        playerInstance.current = null;
      }
      isInitializing.current = false;
      if (typeof window !== 'undefined') {
        window.onYouTubeIframeAPIReady = undefined;
      }
    };
  }, []);

  // Return an invisible div for the YouTube player
  return <div ref={playerRef} style={{ display: 'none' }} />;
}
