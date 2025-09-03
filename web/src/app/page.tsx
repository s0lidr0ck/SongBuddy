'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDB } from '@/lib/db/rxdb';

interface Song {
  id: string;
  title: string;
  key_root?: string;
  key_mode?: string;
  bpm?: number;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const db = await getDB();
      const docs = await db.songs.find({
        sort: [{ updated_at: 'desc' }]
      }).exec();
      
      const songList = docs.map((doc: any) => ({
        id: doc.get('id'),
        title: doc.get('title'),
        key_root: doc.get('key_root'),
        key_mode: doc.get('key_mode'),
        bpm: doc.get('bpm'),
        created_at: doc.get('created_at'),
        updated_at: doc.get('updated_at')
      }));
      
      setSongs(songList);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewSong = async () => {
    try {
      const db = await getDB();
      const now = new Date().toISOString();
      const songId = `song_${Date.now()}`;
      
      const newSong = {
        id: songId,
        title: 'Untitled Song',
        created_at: now,
        updated_at: now
      };
      
      await db.songs.insert(newSong);
      await loadSongs();
      
      // Navigate to editor
      window.location.href = `/editor/${songId}`;
    } catch (error) {
      console.error('Error creating song:', error);
    }
  };

  const deleteSong = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
      const db = await getDB();
      
      // Delete song and its lyrics
      await db.songs.findOne({ selector: { id: songId } }).remove();
      await db.lyrics.find({ selector: { song_id: songId } }).remove();
      
      await loadSongs();
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Songs</h1>
          <button
            onClick={createNewSong}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ✏️ New Song
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading songs...</div>
          </div>
        ) : songs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600 mb-4">
              You haven't written any songs yet.
            </div>
            <button
              onClick={createNewSong}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Write Your First Song
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {songs.map((song) => (
              <div
                key={song.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/editor/${song.id}`}
                      className="block hover:text-blue-600"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {song.title}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        Updated {formatDate(song.updated_at)} at {formatTime(song.updated_at)}
                      </span>
                      {song.key_root && (
                        <span>
                          Key: {song.key_root}{song.key_mode ? ` ${song.key_mode}` : ''}
                        </span>
                      )}
                      {song.bpm && (
                        <span>BPM: {song.bpm}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/editor/${song.id}`}
                      className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteSong(song.id)}
                      className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/bible"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">📖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bible</h3>
            <p className="text-gray-600 text-sm">
              Browse verses, search Scripture, and find inspiration for your songs.
            </p>
          </Link>

          <Link
            href="/lab"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">🎛️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Music Lab</h3>
            <p className="text-gray-600 text-sm">
              Use the metronome and 808 step sequencer to create beats.
            </p>
          </Link>

          <Link
            href="/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600 text-sm">
              Manage Bible translations and configure app preferences.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}