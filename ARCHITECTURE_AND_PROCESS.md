# Pulse Music Studio — Architecture & Process Guide

## 1. Project Overview & Tech Stack

**Pulse Music Studio** is a high-performance web music player delivering uncompressed audio streaming, synchronized lyrics, responsive discography browsing, and cloud-synced playlist curation without reliance on third-party SaaS subscriptions.

### Technology Stack
- **Framework & Runtime**: React 18 / 19 with Vite 8 development server & build toolchain.
- **Audio & Media API Engine**: YouTube Music InnerTube (`youtubei.js` with `WEB_REMIX` client protocol) running via local Vite middleware gateway.
- **Metadata & Enrichment Engine**: Spotify Web API client integration (`/api/spotify/credits`) for rich performer, songwriter, composer, and producer credits.
- **Cloud Database & Authentication**: Supabase (`@supabase/supabase-js`) providing Google OAuth 1-click authentication and PostgreSQL database synchronization with Row Level Security (RLS).
- **State & Flow Management**: React Context (`PlayerContext`, `AuthContext`, `LibraryContext`) combined with custom hooks (`useMusicSearch`, `useLrcSync`, `useDebounce`).
- **Styling Architecture**: Tailwind CSS + custom Vanilla CSS design tokens.
- **Aesthetic Direction**: Strict Black & White Monochrome (`#000000` deep background, `#FFFFFF` high-contrast interactive elements, `#888888` secondary text, `#222222` structural borders). Album artwork is the sole element of color across the interface.

---

## 2. Stream Extraction & Bitrate Parity

Audio playback is backed by YouTube Music's content delivery network through a dual-redundant pipeline:

### Audio Format & Itag Mapping
The app provides a real-time bitrate selector (`audioQuality`: `max` | `high` | `medium`):

| Quality Preset | YouTube Itag | Codec | Audio Bitrate | Sample Rate | Container |
|---|---|---|---|---|---|
| **Max (Hi-Fi)** | `251` | Opus | ~160–256 kbps (320k MP3 parity) | 48.0 kHz | `audio/webm; codecs="opus"` |
| **High** | `140` | AAC (mp4a.40.2) | 128–160 kbps | 44.1 kHz | `audio/mp4` |
| **Medium (Data Saver)** | `249` / `250` | Opus | 50–70 kbps | 48.0 kHz | `audio/webm; codecs="opus"` |

### Proxy & Delivery Engine
1. **Server Route (`GET /api/stream/:id`)**:
   - Resolves direct audio stream URLs using `innertube.resolveAudioStream(videoId, quality)`.
   - Piped with HTTP Range headers (`Range: bytes=...`, `Accept-Ranges: bytes`, `206 Partial Content`), allowing smooth scrubbing and seek bar interactions.
2. **Embedded YouTube Audio Engine Fallback**:
   - A hidden, headless YouTube IFrame API instance (`#youtube-player-container`) acts as zero-CORS failover for geographic/licensing constraints, ensuring full-length uninterrupted playback without 30-second preview restrictions.

---

## 3. Queue & Recommendation Logic

Pulse Music replaces traditional static search queues with YouTube Music's dynamic **Watch Next** recommendation engine.

### Recommendation Pipeline
1. **Trigger**: When a user selects a track from search results, hero cards, or live home shelves, `playTrackNow(track)` loads the selected song.
2. **Watch Next Fetch (`GET /api/next/:id`)**:
   - The server calls `yt.music.getUpNext(videoId)`.
   - Up to 50 curated and related songs from the YouTube Music recommendation algorithm are parsed and appended into the queue:
   $$\text{Queue} = [\text{currentTrack}, \text{recommendation}_1, \text{recommendation}_2, \dots, \text{recommendation}_n]$$
3. **Infinite Auto-Advance**:
   - When playback finishes (`YT.PlayerState.ENDED`), `skipToNext()` advances to `queueIndex + 1`.
   - When the user reaches the last 2 songs in the queue, background prefetching automatically retrieves the next batch using `getWatchNext(lastTrack.videoId)` and appends them to maintain an infinite radio stream.

### Queue State & Methods (`PlayerContext`)
- `queue: Track[]`: Ordered list of upcoming songs.
- `queueIndex: number`: Current active index.
- `history: Track[]`: Chronological record of previously played tracks.
- **Actions**:
  - `playTrackNow(track, customQueue?)`: Immediately plays track; triggers Watch Next recommendations if playing a standalone track.
  - `playNextTrack(track)`: Inserts `track` immediately after `queueIndex` (`queue.splice(queueIndex + 1, 0, track)`).
  - `addToQueue(track)`: Appends `track` to the end of `queue`.
  - `skipToNext()`: Advances pointer, records history, and handles infinite prefetching.
  - `skipToPrev()`: Rewinds current song if $> 3\text{s}$; otherwise steps to preceding track.

### Three-Dot Track Context Menu (`TrackContextMenu`)
Every song row across Search, Home, and Albums includes a floating dropdown (`...`):
- **Play Next**: Queues track to play immediately after the current song.
- **Add to Queue**: Queues track at the bottom of the playlist.
- **Go to Album**: Navigates to `/album/[albumId]` (or `/single/[videoId]` if standalone).
- **Go to Artist**: Navigates to `/artist/[artistId]`.
- **Add to Playlist**: Opens playlist selection modal.

---

## 4. Search Results Hierarchy & Ranking Normalization

### The Literal Match Problem & Ranking Resolution
In YouTube Music's raw search results, obscure literal titles (e.g. Mad Dog's obscure album titled `"Oh Yeah"`) can produce false 100% exact text matches over world-famous tracks with punctuation (e.g. Steve Lacy's hit `"oh yeah?"`).

Pulse implements a **punctuation-normalized search ranking algorithm**:
```javascript
const clean = (str) =>
  (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
```

### Hierarchy Rules (All Tab)
1. **Exact Artist Match**: If `clean(artist.name) === clean(q)`, artist is promoted to Top Result hero.
2. **Exact Song Match**: If `clean(song.title) === clean(q)`, song is promoted to Top Result hero. This guarantees Steve Lacy's `"oh yeah?"` wins over obscure albums!
3. **Exact Album Match**: If `clean(album.title) === clean(q)`, album is promoted to Top Result hero.
4. **Prefix Artist Match**: `clean(artist.name).startsWith(cleanQ)`.
5. **Prefix Song Match**: `clean(song.title).startsWith(cleanQ)`.
6. **Fallback**: Songs shelf $\to$ Albums shelf $\to$ Artists shelf.

---

## 5. Live YouTube Music Home Feed

All legacy static "Featured Stations" have been completely removed from the homepage and replaced with a real-time, live-synced YouTube Music feed (`GET /api/home/feed`):

1. **Quick Picks**:
   - 16 hot, chart-topping tracks from YouTube Music rendered in a responsive grid.
   - 1-click play starts instant radio and loads full recommendations into the queue.
   - Includes "Play All" trigger and `TrackContextMenu` support.
2. **Daily Mixes & Radio**:
   - Curated radio mixes directly from YouTube Music's live homepage.
   - Clicking any station searches and plays the curated track selection.
3. **Trending Albums**:
   - Official full-length album releases presented in a responsive 5-column grid.
   - Clicking an album navigates to the dedicated `AlbumView` with complete tracklist.
4. **Listen Again / Jump Back In**:
   - Dynamically generated from the user's `history` store in `PlayerContext` and synced via Supabase.
5. **Dynamic Shelves**:
   - Any personalized or mood-based shelves returned by YouTube Music are dynamically parsed and rendered.

---

## 6. Supabase Google OAuth & Cloud Synchronization

Pulse Music Studio replaces confusing manual SAPISID/Cookie settings with **1-Click Google OAuth** and automated PostgreSQL cloud synchronization.

### Architecture
- **Client**: Initialized in `src/services/supabase.js` using `@supabase/supabase-js`.
- **State Management**: Wrapped in `AuthProvider` (`src/context/AuthContext.jsx`).
- **Database Schema**: Managed in `supabase_schema.sql` with full Row Level Security (RLS).

### Database Tables & Security:
1. `profiles`: Linked to `auth.users(id)` with auto-trigger for Google name & avatar.
2. `liked_songs`: `(user_id, song_id, song_data jsonb, created_at)`.
3. `user_playlists`: `(id, user_id, name, songs jsonb, created_at, updated_at)`.
4. `playback_history`: `(id, user_id, song_data jsonb, played_at)`.

### Settings & Cloud Sync Modal (`SettingsModal.jsx`)
- **1-Click Google Login**: Clean Google OAuth CTA redirecting securely via Supabase.
- **Sync Status**: Displays user avatar, email, connection status, and one-click manual sync trigger.
- **Custom Supabase Configuration**: Advanced accordion allowing users to connect their own self-hosted or managed Supabase instance.
- **Audio Fidelity**: 256kbps OPUS / 160kbps OPUS / 128kbps AAC bitrate toggle and audio volume normalization.

---

## 7. Spotify Metadata Enrichment & Clean Player Experience

### Spotify API Integration (`/api/spotify/credits`)
- Connects to Spotify Web API Client Credentials (`POST https://accounts.spotify.com/api/token`).
- Searches tracks via `/v1/search?q=track:... artist:...`.
- Returns structured metadata:
  - `performers`: Array of recording artists.
  - `songwriters`: Lyricists and composers.
  - `producers`: Production credits and engineers.
  - `releaseDate`, `album`, and `isrc`.

### Sleek Monochrome Credits Modal (`CreditsModal.jsx`)
- Opened via the "Credits" button in the synchronized lyrics footer (`LyricsView.jsx`).
- Presents performers, songwriters, and producers in high-contrast monochrome pills.
- **Clutter Elimination**: Fake branding text (e.g. `"Dolby Atmos · Mastered for Pulse"`) and non-functional dummy buttons have been excised from the player interface.

---

## 8. Complete File & Directory Map

```
PULSE MUSIC/
├── ARCHITECTURE_AND_PROCESS.md      # Comprehensive architecture & process documentation
├── supabase_schema.sql              # Supabase tables (profiles, liked_songs, user_playlists, history) & RLS
├── package.json                     # Project dependencies & scripts (React, Vite, InnerTube, Supabase)
├── vite.config.js                   # Vite config & API Gateway (/api/search, /api/next, /api/stream, /api/home/feed, /api/spotify/credits)
├── index.html                       # Application HTML shell with font & icon stylesheets
│
├── src/
│   ├── main.jsx                     # Application entry point mounting React root
│   ├── App.jsx                      # App root container, AuthProvider & PlayerProvider mounting
│   ├── index.css                    # Tailwind tokens, monochrome scrollbars, CSS variables
│   │
│   ├── context/
│   │   ├── AuthContext.jsx          # Supabase Google OAuth state & cloud sync methods
│   │   ├── PlayerContext.jsx        # Global player state, queue store, YouTube IFrame bindings, Watch Next
│   │   └── LibraryContext.jsx       # Saved tracks (liked), custom playlists, user albums
│   │
│   ├── services/
│   │   ├── innertube.js             # Singleton InnerTube client: searchMusic, getWatchNext, getAlbumDetails, getHomeFeedData
│   │   └── supabase.js              # Supabase client, Google OAuth flow, cloud sync methods
│   │
│   ├── hooks/
│   │   ├── useMusicSearch.js        # Debounced multi-category search hook querying /api/search
│   │   ├── useDebounce.js           # Reusable timing hook for search inputs
│   │   └── useLrcSync.js            # Synchronized lyric line matching hook for active playback time
│   │
│   ├── utils/
│   │   ├── imageUtils.js            # getHighResImage: normalizes thumbnail URLs to =s800 / hq720
│   │   ├── lrcParser.js             # Parses LRC synchronized lyrics timestamps
│   │   └── timeFormat.js            # Formats audio duration and time remaining (mm:ss)
│   │
│   └── components/
│       ├── Sidebar.jsx              # Seamless monochrome navigation bar with P logo & view triggers
│       ├── Search.jsx               # Dedicated modal / slide-over search experience with category pills
│       │
│       ├── HomeView/
│       │   ├── HomeView.jsx         # Live home feed (Quick Picks, Daily Mixes, Trending Albums) & Top Result hero
│       │   ├── SearchBar.jsx        # Unified header search input box with clear button
│       │   ├── TopResultHero.jsx    # Hero card promoting exact Artist / Song / Album match
│       │   ├── SongRow.jsx          # Individual track row with visualizer, hover actions, and TrackContextMenu
│       │   ├── AlbumCard.jsx        # 1px outline album card with artwork & release year
│       │   ├── ArtistCard.jsx       # Normalized circular artist card with hover play indicator
│       │   └── QuickReplayRow.jsx   # Horizontal quick-access row for recently played items
│       │
│       ├── PlayerDock/
│       │   ├── PlayerDock.jsx       # Persistent bottom playback dock with metadata, play controls, bitrate badge
│       │   ├── SeekBar.jsx          # High-precision monochrome scrubber with elapsed/remaining timers
│       │   └── VolumeSlider.jsx     # Minimalist volume slider with mute toggle
│       │
│       ├── AlbumView/
│       │   └── AlbumView.jsx        # Album detail page: cover art, release year, tracklist, and play all
│       │
│       ├── ArtistView/
│       │   ├── ArtistView.jsx       # Full artist page: high-res hero avatar, bio, discography, top releases
│       │   └── ArtistModal.jsx      # Quick-view modal dialog for inspecting artist discographies
│       │
│       ├── SingleView/
│       │   └── SingleView.jsx       # Standalone single / music video detail view for non-album entities
│       │
│       ├── LyricsView/
│       │   ├── LyricsView.jsx       # Immersive 2-column full-screen view for synchronized lyrics
│       │   ├── AlbumArtPanel.jsx    # Left panel: spinning art, metadata, bitrate badge, playback controls
│       │   ├── LyricsPanel.jsx      # Right panel: auto-scrolling synchronized lyrics with active glow
│       │   └── CreditsModal.jsx     # High-contrast monochrome modal for Spotify songwriter & producer credits
│       │
│       ├── LibraryView/
│       │   └── LibraryView.jsx      # User playlists, liked songs collection, and custom album curator
│       │
│       └── shared/
│           ├── TrackContextMenu.jsx # Floating dropdown for tracks: Play Next, Add to Queue, Entity Navigation
│           ├── ImageWithFallback.jsx# High-res image wrapper with graceful placeholder fallback
│           ├── AddToPlaylistMenu.jsx# Modal to append tracks into custom playlists
│           ├── BackButton.jsx       # Navigation history back button
│           └── SettingsModal.jsx    # Google OAuth 1-click login, Supabase sync status, and audio fidelity settings
```
