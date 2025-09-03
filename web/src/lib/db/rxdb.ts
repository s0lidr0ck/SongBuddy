import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import verseSchema from './schemas/verse.schema';
import songSchema from './schemas/song.schema';
import lyricSchema from './schemas/lyric.schema';
import patternSchema from './schemas/pattern.schema';
import recordingSchema from './schemas/recording.schema';

// Add dev mode plugin in development
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

// Add update plugin
addRxPlugin(RxDBUpdatePlugin);

// Polyfill for crypto.subtle.digest if not available
if (typeof window !== 'undefined' && !window.crypto?.subtle?.digest) {
  // Simple polyfill for development
  if (!window.crypto) {
    window.crypto = {} as Crypto;
  }
  if (!window.crypto.subtle) {
    window.crypto.subtle = {} as SubtleCrypto;
  }
  if (!window.crypto.subtle.digest) {
    window.crypto.subtle.digest = async (algorithm: string, data: ArrayBuffer) => {
      // Simple hash function for development
      const encoder = new TextEncoder();
      const str = new TextDecoder().decode(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const hashArray = new Uint8Array(4);
      const view = new DataView(hashArray.buffer);
      view.setInt32(0, hash, false);
      return hashArray.buffer;
    };
  }
}

let dbp: any;
export async function getDB() {
  if (!dbp) {
    // Create storage with schema validation
    const storage = wrappedValidateAjvStorage({
      storage: getRxStorageDexie()
    });

    dbp = createRxDatabase({
      name: 'songbuddy',
      storage: storage,
      multiInstance: true,
      eventReduce: true
    }).then(async (db) => {
      await db.addCollections({
        verses: { schema: verseSchema as any },
        songs: { schema: songSchema as any },
        lyrics: { schema: lyricSchema as any },
        patterns: { schema: patternSchema as any },
        recordings: { schema: recordingSchema as any }
      });
      return db;
    });
  }
  return dbp;
}