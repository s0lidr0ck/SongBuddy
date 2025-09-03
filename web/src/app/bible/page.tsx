'use client';

import { useState, useEffect } from 'react';
import { getDB } from '@/lib/db/rxdb';
import { getVerse, getChapter, searchText } from '@/lib/bible/queries';
import { BOOKS, fromBookId } from '@/lib/constants/books';

interface Verse {
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export default function BiblePage() {
  const [translations, setTranslations] = useState<string[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'picker' | 'search'>('picker');

  useEffect(() => {
    loadTranslations();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      loadChapters();
    }
  }, [selectedBook, selectedTranslation]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      loadVerses();
    }
  }, [selectedBook, selectedChapter, selectedTranslation]);

  const loadTranslations = async () => {
    try {
      const db = await getDB();
      const docs = await db.verses.find({
        selector: {},
        limit: 1000
      }).exec();
      
      const translationSet = new Set<string>();
      docs.forEach((doc: any) => translationSet.add(doc.get('translation')));
      const translationList = Array.from(translationSet);
      
      setTranslations(translationList);
      if (translationList.length > 0) {
        setSelectedTranslation(translationList[0]);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const loadChapters = async () => {
    if (!selectedBook || !selectedTranslation) return;
    
    try {
      const db = await getDB();
      const docs = await db.verses.find({
        selector: { translation: selectedTranslation, book: selectedBook }
      }).exec();
      
      const chapterSet = new Set<number>();
      docs.forEach((doc: any) => chapterSet.add(doc.get('chapter')));
      const chapterList = Array.from(chapterSet).sort((a, b) => a - b);
      
      setChapters(chapterList);
      setSelectedChapter(null);
      setVerses([]);
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const loadVerses = async () => {
    if (!selectedBook || !selectedChapter || !selectedTranslation) return;
    
    try {
      setLoading(true);
      const verseData = await getChapter(selectedTranslation, selectedBook, selectedChapter);
      const versesWithMetadata = verseData.map((v: any) => ({
        book: selectedBook,
        chapter: selectedChapter,
        verse: v.verse,
        text: v.text
      }));
      setVerses(versesWithMetadata);
    } catch (error) {
      console.error('Error loading verses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedTranslation) return;
    
    try {
      setLoading(true);
      const results = await searchText(selectedTranslation, searchQuery.trim(), 50);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (verse: Verse, includeReference = false) => {
    const bookName = fromBookId(verse.book);
    const reference = `${bookName} ${verse.chapter}:${verse.verse}`;
    const text = includeReference ? `"${verse.text}" - ${reference}` : verse.text;
    
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const insertToEditor = (verse: Verse, includeReference = false) => {
    const bookName = fromBookId(verse.book);
    const reference = `${bookName} ${verse.chapter}:${verse.verse}`;
    const text = includeReference ? `"${verse.text}" - ${reference}` : verse.text;
    
    // Store in localStorage for editor to pick up
    localStorage.setItem('insertVerse', text);
    
    // Navigate to editor new-page to create song and insert
    window.location.href = '/editor/new';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bible</h1>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {translations.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('picker')}
                className={`px-3 py-1 rounded text-sm ${
                  view === 'picker'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => setView('search')}
                className={`px-3 py-1 rounded text-sm ${
                  view === 'search'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {view === 'picker' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Books</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {BOOKS.map((book, index) => (
                  <button
                    key={book}
                    onClick={() => setSelectedBook(index + 1)}
                    className={`p-2 text-left rounded text-sm ${
                      selectedBook === index + 1
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } border`}
                  >
                    {book}
                  </button>
                ))}
              </div>
            </div>

            {selectedBook && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {fromBookId(selectedBook)} - Chapters
                </h2>
                <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
                  {chapters.map(chapter => (
                    <button
                      key={chapter}
                      onClick={() => setSelectedChapter(chapter)}
                      className={`p-2 text-center rounded text-sm ${
                        selectedChapter === chapter
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      } border`}
                    >
                      {chapter}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedBook && selectedChapter && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {fromBookId(selectedBook)} {selectedChapter}
                </h2>
                {loading ? (
                  <div className="text-center py-8">Loading verses...</div>
                ) : (
                  <div className="space-y-4">
                    {verses.map(verse => (
                      <div key={`${verse.verse}`} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="inline-block w-8 text-sm font-semibold text-blue-600">
                              {verse.verse}
                            </span>
                            <span className="text-gray-800">{verse.text}</span>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => copyToClipboard(verse)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Copy verse"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => copyToClipboard(verse, true)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Copy with reference"
                            >
                              📑
                            </button>
                            <button
                              onClick={() => insertToEditor(verse, true)}
                              className="p-1 text-blue-600 hover:text-blue-700"
                              title="Insert to editor"
                            >
                              ➕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Verses</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter keywords to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Search Results ({searchResults.length})
                </h2>
                <div className="space-y-4">
                  {searchResults.map((verse, index) => (
                    <div key={index} className="border-l-4 border-green-200 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-green-600 mb-1">
                            {fromBookId(verse.book)} {verse.chapter}:{verse.verse}
                          </div>
                          <div className="text-gray-800">{verse.text}</div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => copyToClipboard(verse)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copy verse"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => copyToClipboard(verse, true)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copy with reference"
                          >
                            📑
                          </button>
                          <button
                            onClick={() => insertToEditor(verse, true)}
                            className="p-1 text-blue-600 hover:text-blue-700"
                            title="Insert to editor"
                          >
                            ➕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {translations.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600 mb-4">
              No Bible translations installed yet.
            </div>
            <a
              href="/settings"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Install Translations
            </a>
          </div>
        )}
      </div>
    </div>
  );
}