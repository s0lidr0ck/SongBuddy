'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTransport } from '@/lib/audio/transport';
import { AudioScheduler } from '@/lib/audio/scheduler';

interface MultitrackMixerProps {
  className?: string;
}

interface ChordTrack {
  name: string;
  chords: string[]; // Array of chord symbols for each step
  volume: number;
  enabled: boolean;
}

const MultitrackMixer: React.FC<MultitrackMixerProps> = ({ className = '' }) => {
  const { bpm, timeSignature, isPlaying, setIsPlaying } = useTransport();
  const [scheduler, setScheduler] = useState<AudioScheduler | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLooping, setIsLooping] = useState(true);

  // Calculate steps based on time signature (1 chord per beat)
  const getStepsPerBar = () => timeSignature.numerator;
  const [totalBars, setTotalBars] = useState(4);
  const totalSteps = getStepsPerBar() * totalBars;

  // Available chords for the current key (C major for now)
  const availableChords = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', ''];

  // Initialize chord tracks
  const [chordTracks, setChordTracks] = useState<ChordTrack[]>([
    {
      name: 'Chord Track 1',
      chords: Array(totalSteps).fill(''),
      volume: 0.8,
      enabled: true
    },
    {
      name: 'Chord Track 2', 
      chords: Array(totalSteps).fill(''),
      volume: 0.7,
      enabled: true
    }
  ]);

  // Initialize scheduler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (async () => {
        const newScheduler = new AudioScheduler();
        await newScheduler.init();
        setScheduler(newScheduler);
      })();
    }
  }, []);

  // Update scheduler settings
  useEffect(() => {
    if (scheduler) {
      scheduler.setBPM(bpm);
      scheduler.setTotalSteps(totalSteps);
    }
  }, [bpm, totalSteps, scheduler]);

  // Update tracks when time signature or bar count changes
  useEffect(() => {
    const newTotalSteps = getStepsPerBar() * totalBars;
    setChordTracks(prev => prev.map(track => ({
      ...track,
      chords: track.chords.length === newTotalSteps 
        ? track.chords 
        : [...track.chords, ...Array(Math.max(0, newTotalSteps - track.chords.length)).fill('')].slice(0, newTotalSteps)
    })));
  }, [timeSignature, totalBars]);

  // Chord playback callback
  const chordCallback = useCallback((time: number, stepIndex: number) => {
    setCurrentStep(stepIndex);
    
    // Play chords from all enabled tracks
    chordTracks.forEach(track => {
      if (track.enabled && track.chords[stepIndex] && track.chords[stepIndex] !== '') {
        // TODO: Play chord audio - for now just log
        console.log(`Playing ${track.chords[stepIndex]} at step ${stepIndex}`);
      }
    });
  }, [chordTracks]);

  // Start/stop playback
  useEffect(() => {
    if (!scheduler) return;
    
    if (isPlaying) {
      setCurrentStep(0);
      scheduler.callbacks = [];
      scheduler.addCallback(chordCallback);
      scheduler.start();
    } else {
      scheduler.stop();
      setCurrentStep(0);
    }
  }, [isPlaying, scheduler, chordCallback]);

  const addBars = () => {
    setTotalBars(prev => prev + 4);
  };

  const removeBars = () => {
    if (totalBars > 4) {
      setTotalBars(prev => prev - 4);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const setChordAtStep = (trackIndex: number, stepIndex: number, chord: string) => {
    setChordTracks(prev => prev.map((track, i) => 
      i === trackIndex 
        ? { ...track, chords: track.chords.map((c, j) => j === stepIndex ? chord : c) }
        : track
    ));
  };

  const toggleTrack = (trackIndex: number) => {
    setChordTracks(prev => prev.map((track, i) => 
      i === trackIndex ? { ...track, enabled: !track.enabled } : track
    ));
  };

  const setTrackVolume = (trackIndex: number, volume: number) => {
    setChordTracks(prev => prev.map((track, i) => 
      i === trackIndex ? { ...track, volume } : track
    ));
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🎛️</span>
          Multitrack Chord Sequencer
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalBars} bars</span> • 
            <span className="font-medium ml-1">{totalSteps} steps</span> • 
            <span className="font-medium ml-1">{timeSignature.numerator}/{timeSignature.denominator}</span>
          </div>
          
          <button
            onClick={togglePlayback}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${isPlaying
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
              }
            `}
          >
            {isPlaying ? '⏸ Stop' : '▶ Play'}
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={removeBars}
              disabled={totalBars <= 4}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm font-medium transition-colors"
            >
              -4 Bars
            </button>
            <button
              onClick={addBars}
              className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm font-medium transition-colors"
            >
              +4 Bars
            </button>
          </div>
        </div>
      </div>

      {/* Available Chords Palette */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Available Chords (C Major):</h3>
        <div className="flex flex-wrap gap-2">
          {availableChords.slice(0, -1).map((chord) => (
            <div
              key={chord}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium cursor-grab"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', chord)}
            >
              {chord}
            </div>
          ))}
          <div
            className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium cursor-grab"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', '')}
          >
            Clear
          </div>
        </div>
      </div>

      {/* Chord Tracks */}
      <div className="space-y-6">
        {chordTracks.map((track, trackIndex) => (
          <div key={trackIndex} className="space-y-2">
            {/* Track controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={track.enabled}
                    onChange={() => toggleTrack(trackIndex)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[8rem]">
                    🎸 {track.name}
                  </span>
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Vol:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={track.volume}
                    onChange={(e) => setTrackVolume(trackIndex, parseFloat(e.target.value))}
                    className="w-20 h-2"
                  />
                  <span className="text-xs text-gray-500 w-10 text-right">
                    {Math.round(track.volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Step buttons row */}
            <div className={`grid gap-1 ${getStepsPerBar() === 3 ? 'grid-cols-12' : 'grid-cols-16'}`}>
              {track.chords.map((chord, stepIndex) => (
                <div
                  key={stepIndex}
                  className={`relative w-12 h-12 rounded border-2 transition-transform ${
                    chord
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                  } ${
                    isPlaying && currentStep === stepIndex
                      ? 'ring-2 ring-blue-400 scale-105'
                      : ''
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedChord = e.dataTransfer.getData('text/plain');
                    setChordAtStep(trackIndex, stepIndex, droppedChord);
                  }}
                  onClick={() => setChordAtStep(trackIndex, stepIndex, '')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs font-bold text-center">
                      {chord || (stepIndex + 1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar markers */}
            <div className={`grid gap-1 ${getStepsPerBar() === 3 ? 'grid-cols-12' : 'grid-cols-16'} mt-1`}>
              {Array.from({ length: totalSteps }, (_, stepIndex) => (
                <div key={stepIndex} className="text-center">
                  {stepIndex % getStepsPerBar() === 0 && (
                    <div className="text-xs text-gray-400 font-medium">
                      Bar {Math.floor(stepIndex / getStepsPerBar()) + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How to Use:</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Drag chords from the palette above onto the step buttons</li>
          <li>• Each step represents one beat in your progression</li>
          <li>• Click a step to clear it, or drag "Clear" to remove chords</li>
          <li>• Use multiple tracks to layer different chord progressions</li>
          <li>• Press Play to hear your progression loop</li>
        </ul>
      </div>
    </div>
  );
};

export default MultitrackMixer;
