import { getDB } from '../db/rxdb';

type FlatVerse = { 
  translation: string; 
  book: number; 
  chapter: number; 
  verse: number; 
  text: string 
};

export async function importBollsFlat(translation: string, fileOrUrl: File | string) {
  const db = await getDB();
  const text = typeof fileOrUrl === 'string'
    ? await (await fetch(fileOrUrl)).text()
    : await fileOrUrl.text();
  
  const arr: FlatVerse[] = JSON.parse(text);
  const BATCH = 2000;
  
  for (let i = 0; i < arr.length; i += BATCH) {
    const slice = arr.slice(i, i + BATCH).map(v => ({ 
      id: `${v.translation}:${v.book}:${v.chapter}:${v.verse}`, 
      ...v 
    }));
    await db.verses.bulkInsert(slice);
  }
}