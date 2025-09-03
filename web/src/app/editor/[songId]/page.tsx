'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getDB } from '@/lib/db/rxdb';
import VoiceRecorder from '@/components/VoiceRecorder';

interface Song {
  id: string;
  title: string;
  key_root?: string;
  key_mode?: string;
  bpm?: number;
  created_at: string;
  updated_at: string;
}

interface LyricLine {
  id: string;
  song_id: string;
  line_index: number;
  text: string;
  syllables?: number;
  updated_at: string;
}

export default function EditorPage() {
  const params = useParams();
  const songId = params.songId as string;
  
  const [song, setSong] = useState<Song | null>(null);
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [wordInfo, setWordInfo] = useState<any>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showWordPanel, setShowWordPanel] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const updateTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSong();
    loadLines();
    checkForInsertedVerse();
  }, [songId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
    };
  }, []);

  const handleTextChange = (newText: string) => {
    setFullText(newText);
    
    // Clear existing timeout
    if (updateTimeout.current) {
      clearTimeout(updateTimeout.current);
    }
    
    // Set new timeout to save after user stops typing
    updateTimeout.current = setTimeout(() => {
      saveFullText(newText);
      updateTimeout.current = null;
    }, 1000); // 1 second debounce for full text
  };

  const handleScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const getRealTimeSyllableCounts = (text: string): Array<{line: string, syllables: number | null, isSectionHeader: boolean, isEmpty: boolean}> => {
    const lines = text.split('\n');
    return lines.map(line => {
      const trimmedLine = line.trim();
      const isEmpty = trimmedLine === '';
      const isSectionHeader = /^\s*\[.*\]\s*$/.test(trimmedLine);
      const syllables = isEmpty || isSectionHeader ? null : countSyllables(trimmedLine);
      return { line, syllables, isSectionHeader, isEmpty };
    });
  };

  const checkForInsertedVerse = () => {
    const insertVerse = localStorage.getItem('insertVerse');
    if (insertVerse) {
      setTimeout(() => {
        const currentText = fullText || '';
        const newText = currentText ? `${currentText}\n${insertVerse}` : insertVerse;
        setFullText(newText);
        handleTextChange(newText);
        localStorage.removeItem('insertVerse');
      }, 500);
    }
  };

  const getDisplayTextWithCounters = (text: string): string => {
    const lines = text.split('\n');
    return lines.map(line => {
      if (line.trim() === '') return line;
      
      // Don't count syllables for section headers (text in square brackets)
      const isSectionHeader = /^\s*\[.*\]\s*$/.test(line.trim());
      if (isSectionHeader) return line;
      
      const syllables = countSyllables(line.trim());
      return `${line} [${syllables}]`;
    }).join('\n');
  };

  const loadSong = async () => {
    try {
      const db = await getDB();
      const doc = await db.songs.findOne({ selector: { id: songId } }).exec();
      
      if (doc) {
        setSong({
          id: doc.get('id'),
          title: doc.get('title'),
          key_root: doc.get('key_root'),
          key_mode: doc.get('key_mode'),
          bpm: doc.get('bpm'),
          created_at: doc.get('created_at'),
          updated_at: doc.get('updated_at')
        });
      }
    } catch (error) {
      console.error('Error loading song:', error);
    }
  };

  const loadLines = async () => {
    try {
      const db = await getDB();
      const docs = await db.lyrics.find({
        selector: { song_id: songId },
        sort: [{ line_index: 'asc' }]
      }).exec();
      
      const lineList = docs.map((doc: any) => ({
        id: doc.get('id'),
        song_id: doc.get('song_id'),
        line_index: doc.get('line_index'),
        text: doc.get('text'),
        syllables: doc.get('syllables'),
        updated_at: doc.get('updated_at')
      }));
      
      setLines(lineList);
      
      // Build full text from lines
      const fullTextContent = lineList.map(line => line.text).join('\n');
      setFullText(fullTextContent);
    } catch (error) {
      console.error('Error loading lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const textToLines = (text: string): string[] => {
    return text.split('\n');
  };

  const saveFullText = async (text: string) => {
    try {
      const db = await getDB();
      const now = new Date().toISOString();
      const textLines = textToLines(text);
      
      // Get current lines to compare
      const currentDocs = await db.lyrics.find({
        selector: { song_id: songId },
        sort: [{ line_index: 'asc' }]
      }).exec();
      
      // Remove all existing lines
      for (const doc of currentDocs) {
        await doc.remove();
      }
      
      // Insert new lines
      for (let i = 0; i < textLines.length; i++) {
        const lineText = textLines[i];
        const lineId = `${songId}:${i}`;
        const syllables = countSyllables(lineText);
        
        await db.lyrics.insert({
          id: lineId,
          song_id: songId,
          line_index: i,
          text: lineText,
          syllables,
          updated_at: now
        });
      }
      
      // Update song's updated_at
      const songDoc = await db.songs.findOne({ selector: { id: songId } }).exec();
      if (songDoc) {
        await songDoc.update({
          $set: { updated_at: now }
        });
      }
      
      // Reload to sync state
      await loadLines();
      await loadSong();
      
    } catch (error) {
      console.error('Error saving full text:', error);
    }
  };

  const updateSongTitle = async (newTitle: string) => {
    if (!song) return;
    
    try {
      const db = await getDB();
      const now = new Date().toISOString();
      
      // Get the current document to ensure we have the latest revision
      const songDoc = await db.songs.findOne({ selector: { id: songId } }).exec();
      if (songDoc) {
        await songDoc.update({
          $set: {
            title: newTitle,
            updated_at: now
          }
        });
      }
      
      setSong({ ...song, title: newTitle, updated_at: now });
    } catch (error) {
      console.error('Error updating title:', error);
      if (error.code === 'CONFLICT') {
        console.log('Title update conflict detected, reloading song...');
        await loadSong();
      }
    }
  };



  const countSyllables = (word: string): number => {
    if (!word) return 0;
    
    const words = word.toLowerCase().split(/\s+/);
    let totalSyllables = 0;
    
    for (const w of words) {
      // Remove punctuation
      const cleanWord = w.replace(/[^a-z]/g, '');
      if (!cleanWord) continue;
      
      // Count vowel groups
      let syllables = cleanWord.match(/[aeiouy]+/g)?.length || 0;
      
      // Subtract silent e
      if (cleanWord.endsWith('e')) syllables--;
      
      // Ensure at least 1 syllable
      totalSyllables += Math.max(1, syllables);
    }
    
    return totalSyllables;
  };

  const handleWordClick = async (word: string) => {
    setSelectedWord(word);
    setShowWordPanel(true);
    
    try {
      // Fetch word info from API
      const [rhymes, synonyms, definition] = await Promise.all([
        fetch(`/api/words/rhyme?q=${encodeURIComponent(word)}`).then(r => r.json()).catch(() => ({ words: [] })),
        fetch(`/api/words/synonyms?q=${encodeURIComponent(word)}`).then(r => r.json()).catch(() => ({ words: [] })),
        fetch(`/api/words/define?q=${encodeURIComponent(word)}`).then(r => r.json()).catch(() => ({ definitions: [] }))
      ]);
      
      setWordInfo({ rhymes, synonyms, definition });
    } catch (error) {
      console.error('Error fetching word info:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-gray-500">Loading song...</div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Song not found</div>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Back to Songs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            ← Back to Songs
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/bible"
              className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
            >
              📖 Insert Verse
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <input
                  type="text"
                  value={song.title}
                  onChange={(e) => updateSongTitle(e.target.value)}
                  className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none w-full focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  placeholder="Song Title"
                />
                
                <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
                  <div>
                    <label className="block text-xs">Key:</label>
                    <select className="border rounded px-2 py-1 text-sm">
                      <option>C</option>
                      <option>D</option>
                      <option>E</option>
                      <option>F</option>
                      <option>G</option>
                      <option>A</option>
                      <option>B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs">Mode:</label>
                    <select className="border rounded px-2 py-1 text-sm">
                      <option>Major</option>
                      <option>Minor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs">BPM:</label>
                    <input
                      type="number"
                      min="40"
                      max="200"
                      className="border rounded px-2 py-1 text-sm w-16"
                      placeholder="72"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={fullText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    onScroll={handleScroll}
                    onDoubleClick={(e) => {
                      const sel = window.getSelection?.();
                      const selected = sel?.toString().trim();
                      if (selected) {
                        handleWordClick(selected);
                      }
                    }}
                    className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-base leading-relaxed text-gray-900 bg-white"
                    placeholder="Start writing your song lyrics...

[Verse 1]
Your first verse lyrics here
Keep writing and syllable counts will appear

[Chorus]
Your chorus lyrics here
Section headers won't be counted

[Bridge]
Bridge lyrics here..."
                    rows={20}
                    style={{ minHeight: '400px' }}
                  />
                  
                  {/* Overlay for syllable counters */}
                  <div 
                    ref={overlayRef}
                    className="absolute inset-0 pointer-events-none px-4 py-4 font-mono text-base leading-relaxed whitespace-pre-wrap overflow-hidden"
                  >
                    {getRealTimeSyllableCounts(fullText).map((lineData, index) => (
                      <div key={index} className="relative" style={{ minHeight: '1.5rem' }}>
                        <span className="invisible">
                          {lineData.isEmpty ? '\u00A0' : lineData.line}
                        </span>
                        {lineData.syllables !== null && (
                          <span className="absolute right-0 top-0 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md text-sm font-semibold border border-blue-200">
                            [{lineData.syllables}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 flex items-center justify-between">
                  <div>
                    Double-click any word to see rhymes, synonyms, and definitions
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>
                      {fullText.split('\n').filter(line => line.trim()).length} lines
                    </span>
                    <span>
                      {fullText.split('\n').reduce((total, line) => {
                        const trimmedLine = line.trim();
                        const isSectionHeader = /^\s*\[.*\]\s*$/.test(trimmedLine);
                        return total + (isSectionHeader ? 0 : countSyllables(trimmedLine));
                      }, 0)} total syllables
                    </span>
                    <span>
                      {fullText.length} characters
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <VoiceRecorder songId={songId} />
            
            {showWordPanel && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    "{selectedWord}"
                  </h3>
                  <button
                    onClick={() => setShowWordPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {wordInfo && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Rhymes</h4>
                      <div className="flex flex-wrap gap-1">
                        {wordInfo.rhymes?.words?.slice(0, 10).map((word: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-200"
                            onClick={() => handleWordClick(word)}
                          >
                            {word}
                          </span>
                        )) || <span className="text-xs text-gray-500">No rhymes found</span>}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Synonyms</h4>
                      <div className="flex flex-wrap gap-1">
                        {wordInfo.synonyms?.words?.slice(0, 10).map((word: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded cursor-pointer hover:bg-green-200"
                            onClick={() => handleWordClick(word)}
                          >
                            {word}
                          </span>
                        )) || <span className="text-xs text-gray-500">No synonyms found</span>}
                      </div>
                    </div>

                    {wordInfo.definition?.definitions?.[0] && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Definition</h4>
                        <p className="text-xs text-gray-600">
                          {wordInfo.definition.definitions[0].meanings?.[0]?.definitions?.[0]?.definition || 'No definition found'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="text-xs text-gray-500">
            Tap any word to see rhymes, synonyms, and definitions
          </div>
        </div>
      </div>
    </div>
  );
}