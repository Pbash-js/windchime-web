import { Track } from "@/hooks/use-youtube-player";

export interface Playlist {
  id: string; // YouTube playlist ID
  title: string;
  video_id: string; // The single YouTube video ID for this playlist
  tracks: Track[];
}
