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

interface DrumTrack {
  name: string;
  pattern: number[]; // Array of 0s and 1s for each step
  volume: number;
  enabled: boolean;
  color: string;
}

const MultitrackMixer: React.FC<MultitrackMixerProps> = ({ className = '' }) => {
  const { bpm, setBpm, timeSignature, setTimeSignature, isPlaying, setIsPlaying } = useTransport();
  const [scheduler, setScheduler] = useState<AudioScheduler | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioBuffers, setAudioBuffers] = useState<Map<string, AudioBuffer>>(new Map());
  
  // Local controls
  const [selectedKey, setSelectedKey] = useState('C');
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Chord selection modal state
  const [showChordSelector, setShowChordSelector] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(-1);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(-1);

  // Bar management
  const [totalBars, setTotalBars] = useState(timeSignature.numerator === 3 ? 4 : 2);
  
  // Calculate steps based on time signature and total bars
  const totalBeats = timeSignature.numerator * totalBars;
  const chordSteps = totalBeats; // 1 chord per beat
  const drumSteps = totalBeats; // 1 drum step per beat (no subdivisions)
  
  const addBars = () => {
    const barsToAdd = timeSignature.numerator === 3 ? 3 : 2; // Add complete patterns
    setTotalBars(prev => prev + barsToAdd);
  };

  const removeBars = () => {
    const barsToRemove = timeSignature.numerator === 3 ? 3 : 2;
    const minBars = timeSignature.numerator === 3 ? 3 : 2;
    if (totalBars > minBars) {
      setTotalBars(prev => Math.max(minBars, prev - barsToRemove));
    }
  };

  // Available chords for the selected key
  const availableChords = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', ''];

  // Initialize drum tracks (like in Step808)
  const [drumTracks, setDrumTracks] = useState<DrumTrack[]>([
    {
      name: 'K', // Kick
      pattern: Array(drumSteps).fill(0).map((_, i) => i % 8 === 0 || i % 8 === 4 ? 1 : 0),
      volume: 0.8,
      enabled: true,
      color: 'bg-red-500'
    },
    {
      name: 'S', // Snare
      pattern: Array(drumSteps).fill(0).map((_, i) => i % 8 === 2 || i % 8 === 6 ? 1 : 0),
      volume: 0.7,
      enabled: true,
      color: 'bg-blue-500'
    },
    {
      name: 'HH', // Hat
      pattern: Array(drumSteps).fill(1),
      volume: 0.5,
      enabled: true,
      color: 'bg-yellow-500'
    },
    {
      name: 'R', // Ride
      pattern: Array(drumSteps).fill(0),
      volume: 0.6,
      enabled: true,
      color: 'bg-green-500'
    }
  ]);

  // Initialize chord tracks (only one track now)
  const [chordTracks, setChordTracks] = useState<ChordTrack[]>([
    {
      name: 'P', // Piano/Chords
      chords: Array(chordSteps).fill(''),
      volume: 0.8,
      enabled: true
    }
  ]);

  // Initialize scheduler and audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (async () => {
        const newScheduler = new AudioScheduler();
        await newScheduler.init();
        setScheduler(newScheduler);
        setAudioContext(newScheduler.audioContext);
        
        // Load drum samples
        await loadDrumSamples(newScheduler);
        // Load chord samples  
        await loadChordSamples(newScheduler);
      })();
    }
  }, []);

  // Load drum samples from S3
  const loadDrumSamples = async (schedulerInstance: AudioScheduler) => {
    try {
      console.log('Loading drum samples...');
      const [kick, snare, hat, ride] = await Promise.all([
        schedulerInstance.loadSample('https://s-r-m.s3.us-east-1.amazonaws.com/SongBuddy/audio/808/kick.mp3'),
        schedulerInstance.loadSample('https://s-r-m.s3.us-east-1.amazonaws.com/SongBuddy/audio/808/snare.mp3'),
        schedulerInstance.loadSample('https://s-r-m.s3.us-east-1.amazonaws.com/SongBuddy/audio/808/hat.mp3'),
        schedulerInstance.loadSample('https://s-r-m.s3.us-east-1.amazonaws.com/SongBuddy/audio/808/ride.mp3')
      ]);
      
      console.log('Drum samples loaded:', { kick: !!kick, snare: !!snare, hat: !!hat, ride: !!ride });
      
      setAudioBuffers(prev => {
        const newBuffers = new Map(prev);
        if (kick) newBuffers.set('kick', kick);
        if (snare) newBuffers.set('snare', snare);
        if (hat) newBuffers.set('hat', hat);
        if (ride) newBuffers.set('ride', ride);
        return newBuffers;
      });
    } catch (error) {
      console.error('Error loading drum samples:', error);
    }
  };

  // Load chord samples from S3
  const loadChordSamples = async (schedulerInstance: AudioScheduler) => {
    try {
      console.log('Loading chord samples...');
      const chordNames = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
      
      for (const chord of chordNames) {
        const fileName = `C-${chord}.mp3`;
        const url = `https://s-r-m.s3.us-east-1.amazonaws.com/SongBuddy/audio/chords/${encodeURIComponent(fileName)}`;
        
        try {
          const response = await fetch(url);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await schedulerInstance.audioContext.decodeAudioData(arrayBuffer);
            
            setAudioBuffers(prev => {
              const newBuffers = new Map(prev);
              newBuffers.set(chord, audioBuffer);
              console.log(`Loaded chord: ${chord}`);
              return newBuffers;
            });
          }
        } catch (error) {
          console.log(`Could not load chord: ${chord}`, error);
        }
      }
    } catch (error) {
      console.error('Error loading chord samples:', error);
    }
  };

  // Update scheduler settings (use drum steps for timing)
  useEffect(() => {
    if (scheduler) {
      scheduler.setBPM(bpm);
      scheduler.setTotalSteps(drumSteps);
    }
  }, [bpm, drumSteps, scheduler]);

  // Update tracks when time signature or bar count changes
  useEffect(() => {
    // Update drum tracks
    setDrumTracks(prev => prev.map(track => ({
      ...track,
      pattern: track.pattern.length === drumSteps 
        ? track.pattern 
        : [...track.pattern, ...Array(Math.max(0, drumSteps - track.pattern.length)).fill(0)].slice(0, drumSteps)
    })));
    
    // Update chord tracks
    setChordTracks(prev => prev.map(track => ({
      ...track,
      chords: track.chords.length === chordSteps 
        ? track.chords 
        : [...track.chords, ...Array(Math.max(0, chordSteps - track.chords.length)).fill('')].slice(0, chordSteps)
    })));
  }, [timeSignature, totalBars, drumSteps, chordSteps]);

  // Combined playback callback for drums and chords
  const playbackCallback = useCallback((time: number, stepIndex: number) => {
    console.log(`Playback callback: step ${stepIndex}, time ${time}`);
    setCurrentStep(stepIndex);
    
    // Play drums at every step (1 step per beat)
    drumTracks.forEach(track => {
      if (track.enabled && track.pattern[stepIndex] && scheduler) {
        console.log(`Trying to play ${track.name} at step ${stepIndex}`);
        const drumKey = track.name === 'K' ? 'kick' : 
                       track.name === 'S' ? 'snare' :
                       track.name === 'HH' ? 'hat' : 
                       track.name === 'R' ? 'ride' : track.name.toLowerCase();
        const drumBuffer = audioBuffers.get(drumKey);
        if (drumBuffer) {
          console.log(`Playing ${drumKey} sample`);
          scheduler.playSample(drumBuffer, time, track.volume);
        } else {
          console.log(`No buffer found for ${drumKey}`, Array.from(audioBuffers.keys()));
        }
      }
    });
    
    // Play chords at every step (1 step per beat, same as drums)
    chordTracks.forEach(track => {
      if (track.enabled && track.chords[stepIndex] && track.chords[stepIndex] !== '') {
        console.log(`Trying to play chord ${track.chords[stepIndex]} at step ${stepIndex}`);
        const chordBuffer = audioBuffers.get(track.chords[stepIndex]);
        if (chordBuffer && scheduler) {
          console.log(`Playing ${track.chords[stepIndex]} chord`);
          scheduler.playSample(chordBuffer, time, track.volume);
        } else {
          console.log(`No buffer found for chord ${track.chords[stepIndex]}`, Array.from(audioBuffers.keys()));
        }
      }
    });
  }, [drumTracks, chordTracks, scheduler, audioBuffers]);

  // Start/stop playback
  useEffect(() => {
    if (!scheduler) return;
    
    if (isPlaying) {
      console.log('Starting MultitrackMixer playback');
      setCurrentStep(0);
      scheduler.callbacks = [];
      scheduler.addCallback(playbackCallback);
      scheduler.start();
    } else {
      console.log('Stopping MultitrackMixer playback');
      scheduler.stop();
      setCurrentStep(0);
    }
  }, [isPlaying, scheduler, playbackCallback]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Drum track functions
  const toggleDrumStep = (trackIndex: number, stepIndex: number) => {
    setDrumTracks(prev => prev.map((track, i) => 
      i === trackIndex 
        ? { ...track, pattern: track.pattern.map((value, j) => j === stepIndex ? (value ? 0 : 1) : value) }
        : track
    ));
  };

  const toggleDrumTrack = (trackIndex: number) => {
    setDrumTracks(prev => prev.map((track, i) => 
      i === trackIndex ? { ...track, enabled: !track.enabled } : track
    ));
  };

  const setDrumTrackVolume = (trackIndex: number, volume: number) => {
    setDrumTracks(prev => prev.map((track, i) => 
      i === trackIndex ? { ...track, volume } : track
    ));
  };

  // Chord track functions
  const setChordAtStep = (trackIndex: number, stepIndex: number, chord: string) => {
    setChordTracks(prev => prev.map((track, i) => 
      i === trackIndex 
        ? { ...track, chords: track.chords.map((c, j) => j === stepIndex ? chord : c) }
        : track
    ));
  };

  // Open chord selector
  const openChordSelector = (trackIndex: number, stepIndex: number) => {
    setSelectedTrackIndex(trackIndex);
    setSelectedStepIndex(stepIndex);
    setShowChordSelector(true);
  };

  // Select chord from modal
  const selectChord = (chord: string) => {
    if (selectedTrackIndex >= 0 && selectedStepIndex >= 0) {
      setChordAtStep(selectedTrackIndex, selectedStepIndex, chord);
    }
    setShowChordSelector(false);
    setSelectedTrackIndex(-1);
    setSelectedStepIndex(-1);
  };

  const toggleChordTrack = (trackIndex: number) => {
    setChordTracks(prev => prev.map((track, i) => 
      i === trackIndex ? { ...track, enabled: !track.enabled } : track
    ));
  };

  const setChordTrackVolume = (trackIndex: number, volume: number) => {
    setChordTracks(prev => prev.map((track, i) => 
      i === trackIndex ? { ...track, volume } : track
    ));
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🎛️</span>
          Multitrack Sequencer
        </h2>
        
        <button
          onClick={togglePlayback}
          className={`
            px-6 py-3 rounded-lg font-medium transition-colors text-lg
            ${isPlaying
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
            }
          `}
        >
          {isPlaying ? '⏸ Stop' : '▶ Play'}
        </button>
      </div>

      {/* Controls Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Key Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Key:</label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {keys.map((key) => (
                <option key={key} value={key}>
                  {key.replace('#', '♯')}
                </option>
              ))}
            </select>
          </div>

          {/* BPM Control */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Tempo:</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBpm(Math.max(60, bpm - 5))}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded font-bold text-sm"
              >
                −
              </button>
              <input
                type="number"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="flex-1 px-2 py-2 border border-gray-300 rounded text-center"
              />
              <button
                onClick={() => setBpm(Math.min(200, bpm + 5))}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Time Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Time Signature:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeSignature({ numerator: 4, denominator: 4 })}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  timeSignature.numerator === 4
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                4/4
              </button>
              <button
                onClick={() => setTimeSignature({ numerator: 3, denominator: 4 })}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  timeSignature.numerator === 3
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                3/4
              </button>
            </div>
          </div>

          {/* Pattern Info & Bar Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Pattern:</label>
            <div className="text-sm text-gray-600 mb-2">
              <div>{totalBars} bars • {drumSteps} steps</div>
              <div className="text-xs text-gray-500">{selectedKey.replace('#', '♯')} Major</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={removeBars}
                disabled={totalBars <= (timeSignature.numerator === 3 ? 3 : 2)}
                className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 rounded text-xs font-medium transition-colors"
              >
                Remove
              </button>
              <button
                onClick={addBars}
                className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium transition-colors"
              >
                Add Bars
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Synchronized Track Container */}
      <div className="space-y-3">
        {/* Track Labels Column */}
        <div className="flex">
          <div className="w-16 flex-shrink-0 space-y-3">
            <h3 className="text-xs font-bold text-gray-700 h-8 flex items-center justify-center">DRUMS</h3>
            {drumTracks.map((track, trackIndex) => (
              <div key={trackIndex} className="h-10 flex items-center justify-center">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={track.enabled}
                    onChange={() => toggleDrumTrack(trackIndex)}
                    className="rounded w-3 h-3"
                  />
                  <span className="text-sm font-bold text-gray-800">
                    {track.name}
                  </span>
                </label>
              </div>
            ))}
            
            <h3 className="text-xs font-bold text-gray-700 h-8 flex items-center justify-center pt-2">CHORD</h3>
            {chordTracks.map((track, trackIndex) => (
              <div key={trackIndex} className="h-10 flex items-center justify-center">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={track.enabled}
                    onChange={() => toggleChordTrack(trackIndex)}
                    className="rounded w-3 h-3"
                  />
                  <span className="text-sm font-bold text-gray-800">
                    {track.name}
                  </span>
                </label>
              </div>
            ))}
          </div>

          {/* Synchronized Scrolling Steps */}
          <div className="flex-1 overflow-x-auto">
            <div className="space-y-3" style={{ minWidth: `${Math.max(drumSteps, chordSteps) * 52}px` }}>
              {/* Bar markers row */}
              <div className="h-8 flex gap-1">
                {Array.from({ length: Math.max(drumSteps, chordSteps) }, (_, stepIndex) => (
                  <div key={stepIndex} className="w-12 flex-shrink-0 text-center">
                    {stepIndex % timeSignature.numerator === 0 && (
                      <div className="text-xs text-gray-400 font-medium">
                        Bar {Math.floor(stepIndex / timeSignature.numerator) + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Drum track steps */}
              {drumTracks.map((track, trackIndex) => (
                <div key={trackIndex} className="h-10 flex gap-1 items-center">
                  {track.pattern.map((active, stepIndex) => (
                    <button
                      key={stepIndex}
                      onClick={() => toggleDrumStep(trackIndex, stepIndex)}
                      className={`w-12 h-8 flex-shrink-0 rounded border transition-transform ${
                        active
                          ? `${track.color} border-gray-400 text-white`
                          : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                      } ${
                        isPlaying && currentStep === stepIndex
                          ? 'ring-1 ring-blue-400 scale-105'
                          : ''
                      }`}
                    >
                      <div className="text-xs text-center w-full">{stepIndex + 1}</div>
                    </button>
                  ))}
                </div>
              ))}

              {/* Spacer between drum and chord tracks */}
              <div className="h-2"></div>

              {/* Chord track steps */}
              {chordTracks.map((track, trackIndex) => (
                <div key={trackIndex} className="h-10 flex gap-1 items-center">
                  {track.chords.map((chord, stepIndex) => (
                    <button
                      key={stepIndex}
                      className={`relative w-12 h-8 flex-shrink-0 rounded border transition-transform ${
                        chord
                          ? 'bg-blue-500 border-blue-600 text-white hover:bg-blue-400'
                          : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                      } ${
                        isPlaying && currentStep === stepIndex
                          ? 'ring-1 ring-blue-400 scale-105'
                          : ''
                      }`}
                      onClick={() => chord ? setChordAtStep(trackIndex, stepIndex, '') : openChordSelector(trackIndex, stepIndex)}
                      title={chord ? `Click to clear ${chord}` : 'Click to add chord'}
                    >
                      <div className="text-xs font-bold text-center w-full">
                        {chord || '+'}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Volume Controls */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[...drumTracks, ...chordTracks].map((track, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 text-center text-gray-600">
                  {track.name}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={track.volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    if ('color' in track) {
                      setDrumTrackVolume(drumTracks.indexOf(track as DrumTrack), newVolume);
                    } else {
                      setChordTrackVolume(chordTracks.indexOf(track as ChordTrack), newVolume);
                    }
                  }}
                  className="flex-1 h-1"
                />
                <span className="text-gray-500 w-8 text-right">
                  {Math.round(track.volume * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How to Use:</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Click drum steps to toggle hits • Click chord steps (+) to select/clear</li>
          <li>• Scroll horizontally to see all bars • Add more bars with "Add Bars" button</li>
          <li>• All tracks scroll together like a DAW timeline</li>
          <li>• Each step = 1 beat • Volume controls at bottom</li>
        </ul>
      </div>

      {/* Chord Selection Modal */}
      {showChordSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Select Chord</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {availableChords.slice(0, -1).map((chord) => (
                <button
                  key={chord}
                  onClick={() => selectChord(chord)}
                  className="px-4 py-3 bg-blue-100 text-blue-800 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                >
                  {chord}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => selectChord('')}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowChordSelector(false)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultitrackMixer;
