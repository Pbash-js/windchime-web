import { NextResponse } from 'next/server';

// This is a placeholder. In a real application, you would use the YouTube Data API
// to fetch playlist items. This requires an API key, which should be stored securely
// in environment variables.

const MOCK_PLAYLIST_DATA = {
  'PL4o29bINVT4EG_y-k5jGoOu3-Am8Nvi10': [
    { id: '1', title: 'Ambient Gold', artist: 'Windchime', startTime: 0, endTime: 180 },
    { id: '2', title: 'Forest Fantasia', artist: 'Windchime', startTime: 181, endTime: 360 },
  ],
  'PLRBp0Fe2Gpglq-J-t_hN-nrybCGqJ1e7G': [
    { id: '3', title: 'Lofi Chill', artist: 'Lofi Girl', startTime: 0, endTime: 200 },
    { id: '4', title: 'Study Beats', artist: 'Lofi Girl', startTime: 201, endTime: 400 },
  ]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get('playlistId');

  if (!playlistId) {
    return NextResponse.json({ error: 'Missing playlistId parameter' }, { status: 400 });
  }

  // In a real implementation, you would use the playlistId to make a request to the YouTube API.
  // For now, we'll use our mock data.
  // @ts-ignore
  const playlistItems = MOCK_PLAYLIST_DATA[playlistId] || [];

  if (playlistItems.length === 0) {
    return NextResponse.json({ error: 'Playlist not found or is empty' }, { status: 404 });
  }

  return NextResponse.json(playlistItems);
}
