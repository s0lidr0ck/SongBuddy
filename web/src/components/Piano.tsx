'use client';

import React, { useState, useEffect, useRef } from 'react';

interface PianoProps {
  className?: string;
}

const Piano: React.FC<PianoProps> = ({ className = '' }) => {
  const [octave, setOctave] = useState(4);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());

  // Piano keys layout (one octave)
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeys = ['C#', 'D#', '', 'F#', 'G#', 'A#', '']; // Empty strings for positions without black keys

  useEffect(() => {
    const initAudioContext = async () => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    };
    initAudioContext();

    return () => {
      // Cleanup oscillators on unmount
      oscillatorsRef.current.forEach(osc => osc.stop());
      oscillatorsRef.current.clear();
      gainNodesRef.current.clear();
    };
  }, []);

  // Calculate frequency for a note
  const getFrequency = (note: string, octave: number): number => {
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

    const baseFreq = noteFrequencies[note];
    return baseFreq * Math.pow(2, octave - 4); // Adjust for octave (4 is the base octave)
  };

  const playNote = async (note: string) => {
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const noteKey = `${note}${octave}`;
    if (activeKeys.has(noteKey)) return; // Already playing

    const frequency = getFrequency(note, octave);
    
    // Create oscillator and gain node
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Set up ADSR envelope
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.3); // Decay to sustain
    
    oscillator.start(now);
    
    // Store references
    oscillatorsRef.current.set(noteKey, oscillator);
    gainNodesRef.current.set(noteKey, gainNode);
    setActiveKeys(prev => new Set([...prev, noteKey]));
  };

  const stopNote = (note: string) => {
    const noteKey = `${note}${octave}`;
    const oscillator = oscillatorsRef.current.get(noteKey);
    const gainNode = gainNodesRef.current.get(noteKey);
    
    if (oscillator && gainNode && audioContext) {
      const now = audioContext.currentTime;
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1); // Release
      oscillator.stop(now + 0.1);
      
      oscillatorsRef.current.delete(noteKey);
      gainNodesRef.current.delete(noteKey);
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteKey);
        return newSet;
      });
    }
  };

  const handleKeyDown = (note: string) => {
    playNote(note);
  };

  const handleKeyUp = (note: string) => {
    stopNote(note);
  };

  const changeOctave = (direction: 'up' | 'down') => {
    setOctave(prev => {
      if (direction === 'up' && prev < 8) return prev + 1;
      if (direction === 'down' && prev > 0) return prev - 1;
      return prev;
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Piano</h2>
        
        {/* Octave Controls */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm font-medium text-gray-600">Octave:</span>
          <button
            onClick={() => changeOctave('down')}
            disabled={octave <= 0}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm font-medium transition-colors"
          >
            -
          </button>
          <span className="text-lg font-bold text-gray-800 w-8 text-center">{octave}</span>
          <button
            onClick={() => changeOctave('up')}
            disabled={octave >= 8}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm font-medium transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Piano Keys */}
      <div className="space-y-2">
        {/* Black Keys Row - Above White Keys, centered on gaps */}
        <div className="flex" style={{ marginLeft: '34px' }}>
          {blackKeys.map((note, index) => {
            if (!note) {
              // Empty space where there's no black key (between E-F and B-C)
              return <div key={index} className="w-16 mr-1" />;
            }

            const noteKey = `${note}${octave}`;
            const isActive = activeKeys.has(noteKey);
            
            return (
              <button
                key={note}
                onMouseDown={() => handleKeyDown(note)}
                onMouseUp={() => handleKeyUp(note)}
                onMouseLeave={() => handleKeyUp(note)}
                onTouchStart={() => handleKeyDown(note)}
                onTouchEnd={() => handleKeyUp(note)}
                className={`
                  w-16 h-16 bg-gray-800 border border-gray-600 rounded mr-1
                  hover:bg-gray-700 transition-colors
                  flex items-center justify-center text-sm font-medium text-white
                  select-none touch-manipulation
                  ${isActive ? 'bg-blue-700 border-blue-500' : ''}
                `}
                style={{ userSelect: 'none' }}
              >
                {note.replace('#', '♯')}
              </button>
            );
          })}
        </div>

        {/* White Keys Row */}
        <div className="flex gap-1">
          {whiteKeys.map((note) => {
            const noteKey = `${note}${octave}`;
            const isActive = activeKeys.has(noteKey);
            
            return (
              <button
                key={note}
                onMouseDown={() => handleKeyDown(note)}
                onMouseUp={() => handleKeyUp(note)}
                onMouseLeave={() => handleKeyUp(note)}
                onTouchStart={() => handleKeyDown(note)}
                onTouchEnd={() => handleKeyUp(note)}
                className={`
                  w-16 h-16 bg-white border border-gray-300 rounded
                  hover:bg-gray-50 transition-colors
                  flex items-center justify-center text-sm font-medium text-gray-700
                  select-none touch-manipulation
                  ${isActive ? 'bg-blue-100 border-blue-400' : ''}
                `}
                style={{ userSelect: 'none' }}
              >
                {note}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-500">
        <p>• Use octave +/- buttons to change pitch range</p>
        <p>• Click and hold piano keys to play notes</p>
        <p>• Current octave: {octave} (Range: 0-8)</p>
      </div>
    </div>
  );
};

export default Piano;
