# SongBuddy - Offline Christian Songwriting Companion

SongBuddy is a mobile-first Progressive Web App (PWA) built with Next.js and React that helps amateur Christian songwriters write better songs. The app works 100% offline and includes Bible tools, lyric editing, music production features, and voice recording capabilities.

## 🎵 Features

### Bible Tools (Offline)
- **Verse Picker**: Browse Bible books, chapters, and verses
- **Search**: Keyword search across installed translations (naive scan)
- **Multiple Translations**: Support for KJV, ESV, NIV, NASB, NLT, CSB, NKJV, AMP
- **Import System**: Upload Bolls flat JSON Bible files
- **Offline First**: Works completely offline after translations are installed

### Lyric Editor
- **Line-Level Editing**: Create and edit song lyrics line by line
- **Syllable Counter**: Automatic syllable counting for each line
- **Word Tools**: Tap any word to see rhymes, synonyms, and definitions
- **Bible Integration**: Insert verses directly from the Bible browser
- **Auto-Save**: Changes are automatically saved to local database

### Music Lab
- **Metronome**: 
  - Adjustable BPM (40-200)
  - Tap tempo functionality
  - Visual beat indicators
  - Quick preset tempos
- **808 Step Sequencer**:
  - 4-track drum machine (Kick, Snare, Hi-Hat, Ride)
  - 8-step patterns (2 bars of 4/4)
  - Volume control per track
  - Pattern saving and loading
  - Syncs with metronome tempo

### Voice Recorder
- **Local Recording**: Record voice memos linked to songs
- **Download Support**: Save recordings to device
- **No Auto-Upload**: Privacy-first - recordings stay on device
- **Playback Controls**: Play recordings directly in the app
- **Per-Song Organization**: Recordings are organized by song

### Offline-First Architecture
- **IndexedDB Storage**: Uses RxDB with Dexie storage adapter
- **PWA Capabilities**: Installable on mobile devices
- **Service Worker**: Caches app shell and handles offline functionality
- **Persistent Storage**: Request persistent storage quota

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SongBuddy
```

2. Navigate to the web app:
```bash
cd web
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your API configurations
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 📱 PWA Installation

1. Open the app in a mobile browser
2. Look for the "Add to Home Screen" prompt
3. Follow your browser's installation process
4. The app will now work offline once installed

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: RxDB with Dexie (IndexedDB)
- **Audio**: Web Audio API
- **PWA**: Custom service worker, Web App Manifest
- **APIs**: 
  - Datamuse API (rhymes/synonyms)
  - Free Dictionary API (definitions)
  - Bolls Bible API format

## 📖 Bible Data

The app uses the Bolls flat JSON format for Bible data:

```json
[
  {
    "translation": "KJV",
    "book": 1,
    "chapter": 1,
    "verse": 1,
    "text": "In the beginning God created the heaven and the earth."
  }
]
```

### Supported Translations

- King James Version (KJV)
- English Standard Version (ESV)
- New International Version (NIV)
- New American Standard Bible (NASB)
- New Living Translation (NLT)
- Christian Standard Bible (CSB)
- New King James Version (NKJV)
- Amplified Bible (AMP)

## 🎼 Usage

### Creating Your First Song

1. Click "New Song" on the home page
2. Enter a title for your song
3. Start adding lyrics line by line
4. Use the Bible browser to find inspiration
5. Record voice memos as you work
6. Use the Music Lab to establish tempo and rhythm

### Installing Bible Translations

1. Go to Settings
2. Find a translation you want to install
3. Click "Upload JSON" 
4. Select a Bolls-format JSON file
5. The translation will be imported and available offline

### Using the Music Lab

1. Set your desired BPM with the metronome
2. Create drum patterns with the 808 sequencer
3. Save patterns for reuse across songs
4. Both tools sync together for consistent timing

## 🔄 Offline Capabilities

SongBuddy is designed to work completely offline:

- ✅ Create and edit songs
- ✅ Browse installed Bible translations
- ✅ Search Bible text
- ✅ Record voice memos
- ✅ Use metronome and sequencer
- ❌ Get new rhymes/synonyms/definitions (requires internet)
- ❌ Install new Bible translations (requires internet)

## 🚧 Future Enhancements (Phase 2)

- Cloud sync with self-hosted API + PostgreSQL
- FlexSearch full-text Bible search
- React Native mobile app
- Chord progression tools
- Nashville number system
- ChordPro export
- Collaborative songwriting

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines before submitting PRs.

## 📞 Support

For issues and feature requests, please use the GitHub issue tracker.