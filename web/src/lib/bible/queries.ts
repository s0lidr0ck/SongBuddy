import { getDB } from '../db/rxdb';

export async function getVerse(translation: string, book: number, chapter: number, verse: number) {
  const db = await getDB();
  const doc = await db.verses.findOne({ 
    selector: { translation, book, chapter, verse } 
  }).exec();
  return doc?.get('text') ?? '';
}

export async function getChapter(translation: string, book: number, chapter: number) {
  const db = await getDB();
  const docs = await db.verses.find({ 
    selector: { translation, book, chapter } 
  }).sort({ verse: 'asc' }).exec();
  
  return docs.map((d: any) => ({ 
    verse: d.get('verse'), 
    text: d.get('text') 
  }));
}

export async function searchText(translation: string, query: string, limit = 50) {
  const db = await getDB();
  const docs = await db.verses.find({
    selector: { 
      translation,
      text: { $regex: new RegExp(query, 'i') }
    }
  }).limit(limit).exec();
  
  return docs.map((d: any) => ({
    book: d.get('book'),
    chapter: d.get('chapter'),
    verse: d.get('verse'),
    text: d.get('text')
  }));
}