import { Playlist } from "@/types/playlist";
import { Track } from "@/hooks/use-youtube-player";

export const defaultVideoId = 'lTRiuFIWV54';

export const defaultTracks: Track[] = [
    { id: '1', videoId: defaultVideoId, startTime: 15, endTime: 205, title: 'Snowman', artist: 'WYS' },
    { id: '2', videoId: defaultVideoId, startTime: 205, endTime: 328, title: 'Cotton Cloud', artist: 'Fatb' },
    { id: '3', videoId: defaultVideoId, startTime: 328, endTime: 464, title: 'the places we used to walk', artist: 'rook1e x tender spring' },
    { id: '4', videoId: defaultVideoId, startTime: 464, endTime: 628, title: 'wool gloves', artist: 'imagiro' },
    { id: '5', videoId: defaultVideoId, startTime: 628, endTime: 763, title: 'I\'m sorry', artist: 'Glimlip x Yasper' },
    { id: '6', videoId: defaultVideoId, startTime: 763, endTime: 864, title: 'Nova', artist: 'mell-ø' },
    { id: '7', videoId: defaultVideoId, startTime: 864, endTime: 980, title: 'carried away', artist: 'goosetaf x the fields tape x francis' },
    { id: '8', videoId: defaultVideoId, startTime: 980, endTime: 1142, title: 'snow & sand', artist: 'j\'san x epektase' },
    { id: '9', videoId: defaultVideoId, startTime: 1142, endTime: 1246, title: 'Single Phial', artist: 'HM Surf' },
    { id: '10', videoId: defaultVideoId, startTime: 1246, endTime: 1363, title: 'Drops', artist: 'cocabona x Glimlip' },
    { id: '11', videoId: defaultVideoId, startTime: 1363, endTime: 1510, title: 'espresso', artist: 'Aso' },
    { id: '12', videoId: defaultVideoId, startTime: 1510, endTime: 1610, title: 'Luminescence', artist: 'Ambulo x mell-ø' },
    { id: '13', videoId: defaultVideoId, startTime: 1610, endTime: 1728, title: 'Explorers', artist: 'DLJ x BIDØ' },
    { id: '14', videoId: defaultVideoId, startTime: 1728, endTime: 1851, title: 'Wish You Were Mine', artist: 'Sarcastic Sounds' },
    { id: '15', videoId: defaultVideoId, startTime: 1851, endTime: 1968, title: 'Reflections', artist: 'BluntOne' },
    { id: '16', videoId: defaultVideoId, startTime: 1968, endTime: 2168, title: 'Alone Time', artist: 'Purrple Cat' },
    { id: '17', videoId: defaultVideoId, startTime: 2168, endTime: 2308, title: 'Owls of the Night', artist: 'Kupla' },
    { id: '18', videoId: defaultVideoId, startTime: 2308, endTime: 2454, title: 'Steps', artist: 'dryhope' },
    { id: '19', videoId: defaultVideoId, startTime: 2454, endTime: 2540, title: 'amber', artist: 'ENRA' },
    { id: '20', videoId: defaultVideoId, startTime: 2540, endTime: 2691, title: 'fever', artist: 'Psalm Trees' },
    { id: '21', videoId: defaultVideoId, startTime: 2691, endTime: 2801, title: 'Circle', artist: 'H.1' },
    { id: '22', videoId: defaultVideoId, startTime: 2801, endTime: 2972, title: 'Cuddlin', artist: 'Pandrezz' },
    { id: '23', videoId: defaultVideoId, startTime: 2972, endTime: 3104, title: 'Late Night Call', artist: 'Jordy Chandra' },
    { id: '24', videoId: defaultVideoId, startTime: 3104, endTime: 3222, title: 'Gyoza', artist: 'less.people' },
    { id: '25', videoId: defaultVideoId, startTime: 3222, endTime: 3392, title: 'Keyframe', artist: 'G Mills' },
    { id: '26', videoId: defaultVideoId, startTime: 3392, endTime: 3486, title: 'breeze', artist: 'mvdb' },
    { id: '27', videoId: defaultVideoId, startTime: 3486, endTime: 3600, title: 'Lunar Drive', artist: 'Mondo Loops' },
];

export const defaultPlaylist: Playlist = {
    id: 'default-lofi',
    title: 'Lofi Hip Hop Radio 📚',
    video_id: defaultVideoId,
    tracks: defaultTracks,
};
