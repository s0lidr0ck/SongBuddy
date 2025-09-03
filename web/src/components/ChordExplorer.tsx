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
    // Properly encode the URL to handle special characters like °
    const url = `/audio/chords/${encodeURIComponent(fileName)}`;

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

  // Play a chord (try audio file first, fallback to generated)
  const playChord = async (chord: Chord) => {
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Stop any currently playing audio
    stopCurrentAudio();

    setPlayingChord(chord.name);

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
              <button
                key={index}
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
            ))}
          </div>
        </div>
      </div>


    </div>
  );
};

export default ChordExplorer;
