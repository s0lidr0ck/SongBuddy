'use client';

import React, { useState } from 'react';
import { useTransport } from '@/lib/audio/transport';

interface MultitrackMixerProps {
  className?: string;
}

const MultitrackMixer: React.FC<MultitrackMixerProps> = ({ className = '' }) => {
  const { bpm, timeSignature, isPlaying, setIsPlaying } = useTransport();
  const [currentBar, setCurrentBar] = useState(0);
  const [totalBars, setTotalBars] = useState(4);
  const [isLooping, setIsLooping] = useState(true);

  // Track states
  const [chordTrackEnabled, setChordTrackEnabled] = useState(true);
  const [drumTrackEnabled, setDrumTrackEnabled] = useState(true);
  
  // Placeholder for now - will integrate with actual chord and drum data later
  const [chordProgression] = useState(['I', 'V', 'vi', 'IV']);
  const [drumPattern] = useState(['kick', 'snare', 'kick', 'snare']);

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

  const beatsPerBar = timeSignature.numerator;
  const totalBeats = totalBars * beatsPerBar;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">🎛️</span>
          Multitrack Mixer
        </h2>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalBars} bars</span> • 
            <span className="font-medium ml-1">{totalBeats} beats</span> • 
            <span className="font-medium ml-1">{timeSignature.numerator}/{timeSignature.denominator}</span>
          </div>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayback}
            className={`
              px-6 py-3 rounded-lg font-medium transition-colors
              ${isPlaying
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
              }
            `}
          >
            {isPlaying ? '⏸️ Stop' : '▶️ Play'}
          </button>
          
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <input
              type="checkbox"
              checked={isLooping}
              onChange={(e) => setIsLooping(e.target.checked)}
              className="rounded"
            />
            Loop
          </label>
        </div>

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

      {/* Track Display */}
      <div className="space-y-4">
        {/* Chord Track */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={chordTrackEnabled}
                  onChange={(e) => setChordTrackEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium text-gray-800">🎸 Chord Track</span>
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Volume:</span>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="75"
                className="w-20"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalBars }, (_, barIndex) => (
              <div key={barIndex} className="border rounded p-2 bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">Bar {barIndex + 1}</div>
                <div className="text-sm font-medium">
                  {chordProgression[barIndex % chordProgression.length]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drum Track */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={drumTrackEnabled}
                  onChange={(e) => setDrumTrackEnabled(e.target.checked)}
                  className="rounded"
                />
                <span className="font-medium text-gray-800">🥁 Drum Track</span>
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Volume:</span>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="w-20"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalBars }, (_, barIndex) => (
              <div key={barIndex} className="border rounded p-2 bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">Bar {barIndex + 1}</div>
                <div className="text-xs">
                  {drumPattern[barIndex % drumPattern.length]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Playing Bar {currentBar + 1} of {totalBars}</span>
            <span>{bpm} BPM • {timeSignature.numerator}/{timeSignature.denominator}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${((currentBar + 1) / totalBars) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MultitrackMixer;
