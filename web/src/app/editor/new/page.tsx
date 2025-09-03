'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDB } from '@/lib/db/rxdb';

export default function NewEditorRedirect() {
  const router = useRouter();

  useEffect(() => {
    const createSong = async () => {
      try {
        const db = await getDB();
        const now = new Date().toISOString();
        const songId = `song_${Date.now()}`;
        await db.songs.insert({
          id: songId,
          title: 'Untitled Song',
          created_at: now,
          updated_at: now
        });
        router.replace(`/editor/${songId}`);
      } catch (err) {
        console.error('Failed to create song', err);
        router.replace('/');
      }
    };
    createSong();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-gray-600">Creating a new song…</div>
    </div>
  );
}


