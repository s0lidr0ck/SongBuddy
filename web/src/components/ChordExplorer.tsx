'use client';

import React, { useState, useEffect } from 'react';

interface ChordExplorerProps {
  className?: string;
}

interface Chord {
  name: string;
  nashvilleNumber: string;
  notes: string[];
  romanNumeral: string;
}

const ChordExplorer: React.FC<ChordExplorerProps> = ({ className = '' }) => {
  const [selectedKey, setSelectedKey] = useState('C');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [playingChord, setPlayingChord] = useState<string | null>(null);
  const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  const [currentSource, setCurrentSource] = useState<AudioBufferSourceNode | null>(null);
  const [currentOscillators, setCurrentOscillators] = useState<OscillatorNode[]>([]);
  
  // Chord progression state
  const [progression, setProgression] = useState<Chord[]>([]);
  const [isPlayingProgression, setIsPlayingProgression] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(-1);
  const [progressionBPM, setProgressionBPM] = useState(120);
  const [progressionLoop, setProgressionLoop] = useState(true);
  const [progressionTimeoutId, setProgressionTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // All possible keys
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Note intervals for major scale (semitones from root)
  const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];

  // Chord patterns (intervals from root note of chord)
  const chordPatterns = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6]
  };

  useEffect(() => {
    const initAudioContext = async () => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    };
    initAudioContext();
  }, []);

  // Preload all chords for the selected key
  useEffect(() => {
    if (!audioContext) return;

    const preloadChords = async () => {
      const chords = getChordsForKey(selectedKey);
      const newBuffers = new Map(audioBuffers);
      
      // Load all chord files for this key
      for (const chord of chords) {
        const audioKey = `${selectedKey}-${chord.romanNumeral}`;
        
        // Skip if already loaded
        if (newBuffers.has(audioKey)) continue;
        
        const audioBuffer = await loadAudioFile(selectedKey, chord.romanNumeral);
        if (audioBuffer) {
          newBuffers.set(audioKey, audioBuffer);
        }
      }
      
      setAudioBuffers(newBuffers);
    };

    preloadChords();
  }, [selectedKey, audioContext]); // Re-run when key changes or audio context initializes

    // Load audio file for a chord
  const loadAudioFile = async (key: string, chordRoman: string): Promise<AudioBuffer | null> => {
    if (!audioContext) return null;

    const fileName = `${key}-${chordRoman}.mp3`;
    // Use S3 URL with proper encoding for special characters like °
    const url = `https://s-r-m.s3.us-east-1.amazonaws.com/SongBuddy/audio/chords/${encodeURIComponent(fileName)}`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
      }
    } catch (error) {
      console.log(`Could not load audio file: ${fileName}`, error);
    }

    console.log(`No audio file found for ${key}-${chordRoman}`);
    return null;
  };

  // Get note name from semitone offset
  const getNoteFromSemitones = (rootNote: string, semitones: number): string => {
    const noteIndex = keys.indexOf(rootNote);
    const targetIndex = (noteIndex + semitones) % 12;
    return keys[targetIndex];
  };

  // Generate major scale notes for a key
  const getMajorScaleNotes = (key: string): string[] => {
    return majorScaleIntervals.map(interval => getNoteFromSemitones(key, interval));
  };

  // Generate chords for a major key
  const getChordsForKey = (key: string): Chord[] => {
    const scaleNotes = getMajorScaleNotes(key);
    const chords: Chord[] = [];

    // Major key chord progression: I ii iii IV V vi vii°
    const chordTypes = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
    const nashvilleNumbers = ['1', '2m', '3m', '4', '5', '6m', '7°'];
    const romanNumerals = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

    scaleNotes.forEach((note, index) => {
      const chordType = chordTypes[index];
      const pattern = chordPatterns[chordType as keyof typeof chordPatterns];
      const rootNoteIndex = keys.indexOf(note);
      
      const chordNotes = pattern.map(interval => {
        const noteIndex = (rootNoteIndex + interval) % 12;
        return keys[noteIndex];
      });

      chords.push({
        name: `${note}${chordType === 'minor' ? 'm' : chordType === 'diminished' ? '°' : ''}`,
        nashvilleNumber: nashvilleNumbers[index],
        notes: chordNotes,
        romanNumeral: romanNumerals[index]
      });
    });

    return chords;
  };

  // Calculate frequency for a note (4th octave)
  const getFrequency = (note: string): number => {
    const noteFrequencies: { [key: string]: number } = {
      'C': 261.63,
      'C#': 277.18,
      'D': 293.66,
      'D#': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F#': 369.99,
      'G': 392.00,
      'G#': 415.30,
      'A': 440.00,
      'A#': 466.16,
      'B': 493.88
    };
    return noteFrequencies[note];
  };

  // Stop any currently playing audio
  const stopCurrentAudio = () => {
    // Stop current audio file source
    if (currentSource) {
      try {
        currentSource.stop();
      } catch (e) {
        // Source may already be stopped
      }
      setCurrentSource(null);
    }

    // Stop current oscillators
    currentOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
    });
    setCurrentOscillators([]);
    
    setPlayingChord(null);
  };

  // Add chord to progression
  const addChordToProgression = (chord: Chord) => {
    setProgression(prev => [...prev, chord]);
  };

  // Remove chord from progression
  const removeChordFromProgression = (index: number) => {
    setProgression(prev => prev.filter((_, i) => i !== index));
  };

  // Clear progression
  const clearProgression = () => {
    stopProgression();
    setProgression([]);
  };

  // Play chord progression
  const playProgression = () => {
    if (progression.length === 0 || isPlayingProgression) return;
    
    setIsPlayingProgression(true);
    setCurrentChordIndex(0);
    playProgressionChord(0);
  };

  // Stop chord progression
  const stopProgression = () => {
    if (progressionTimeoutId) {
      clearTimeout(progressionTimeoutId);
      setProgressionTimeoutId(null);
    }
    setIsPlayingProgression(false);
    setCurrentChordIndex(-1);
    stopCurrentAudio();
  };

  // Play a specific chord in the progression
  const playProgressionChord = async (index: number) => {
    if (index >= progression.length) {
      if (progressionLoop && progression.length > 0) {
        // Loop back to beginning
        const timeoutId = setTimeout(() => {
          setCurrentChordIndex(0);
          playProgressionChord(0);
        }, 100); // Small gap between loops
        setProgressionTimeoutId(timeoutId);
      } else {
        // End progression
        setIsPlayingProgression(false);
        setCurrentChordIndex(-1);
      }
      return;
    }

    const chord = progression[index];
    setCurrentChordIndex(index);
    await playChordAudio(chord);

    // Calculate time for next chord (quarter note duration)
    const quarterNoteDuration = (60 / progressionBPM) * 1000; // Convert to milliseconds
    
    const timeoutId = setTimeout(() => {
      playProgressionChord(index + 1);
    }, quarterNoteDuration);
    
    setProgressionTimeoutId(timeoutId);
  };

  // Core audio playing function (used by both single chord and progression)
  const playChordAudio = async (chord: Chord) => {
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Stop any currently playing audio
    stopCurrentAudio();

    // Get preloaded audio buffer
    const audioKey = `${selectedKey}-${chord.romanNumeral}`;
    const audioBuffer = audioBuffers.get(audioKey);

    if (audioBuffer) {
      // Play the audio file
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = 0.7;
      
      setCurrentSource(source);
      source.start();
      
      // Clear playing state when audio ends
      source.onended = () => {
        setPlayingChord(null);
        setCurrentSource(null);
      };
    } else {
      // Fallback to generated chord
      const now = audioContext.currentTime;
      const duration = 2; // 2 seconds

      // Create oscillators for each note in the chord
      const oscillators = chord.notes.map((note, index) => {
        const frequency = getFrequency(note);
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.type = 'sine';

        // ADSR envelope with slight stagger for richness
        const startTime = now + (index * 0.02); // Slight delay between notes
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.1); // Attack
        gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + 0.3); // Decay to sustain
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Release

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        return oscillator;
      });

      setCurrentOscillators(oscillators);

      // Clear playing state after duration
      setTimeout(() => {
        setPlayingChord(null);
        setCurrentOscillators([]);
      }, duration * 1000);
    }
  };

  // Play a chord (wrapper for single chord clicks)
  const playChord = async (chord: Chord) => {
    setPlayingChord(chord.name);
    await playChordAudio(chord);
  };

  const chords = getChordsForKey(selectedKey);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Chord Explorer</h2>
      
      <div className="flex items-start gap-6">
        {/* Key Selection Box */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-gray-600 mb-2">Key:</label>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-lg font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {keys.map((key) => (
              <option key={key} value={key}>
                {key.replace('#', '♯')}
              </option>
            ))}
          </select>
        </div>

        {/* Chord Buttons Row */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 mb-2">Chords:</label>
          <div className="flex gap-2 flex-wrap">
            {chords.map((chord, index) => (
              <div key={index} className="flex flex-col gap-1">
                <button
                  onClick={() => playChord(chord)}
                  className={`
                    px-4 py-2 border border-gray-300 rounded-lg font-medium transition-colors
                    ${playingChord === chord.name
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {chord.romanNumeral}
                </button>
                <button
                  onClick={() => addChordToProgression(chord)}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  title="Add to progression"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chord Progression Builder */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Chord Progression</h3>
          <div className="flex items-center gap-4">
            {/* BPM Control */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">BPM:</label>
              <input
                type="number"
                min="60"
                max="200"
                value={progressionBPM}
                onChange={(e) => setProgressionBPM(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              />
            </div>
            
            {/* Loop Toggle */}
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <input
                type="checkbox"
                checked={progressionLoop}
                onChange={(e) => setProgressionLoop(e.target.checked)}
                className="rounded"
              />
              Loop
            </label>
          </div>
        </div>

        {/* Progression Display */}
        <div className="mb-4">
          {progression.length === 0 ? (
            <p className="text-gray-500 italic">Click + buttons above to build your progression</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {progression.map((chord, index) => (
                <div
                  key={`${chord.romanNumeral}-${index}`}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors
                    ${currentChordIndex === index && isPlayingProgression
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-white text-gray-800 border-gray-300'
                    }
                  `}
                >
                  <span className="font-bold">{chord.romanNumeral}</span>
                  <button
                    onClick={() => removeChordFromProgression(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    title="Remove chord"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progression Controls */}
        <div className="flex gap-2">
          <button
            onClick={isPlayingProgression ? stopProgression : playProgression}
            disabled={progression.length === 0}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${isPlayingProgression
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed'
              }
            `}
          >
            {isPlayingProgression ? 'Stop' : 'Play Progression'}
          </button>
          
          <button
            onClick={clearProgression}
            disabled={progression.length === 0}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

    </div>
  );
};

export default ChordExplorer;
