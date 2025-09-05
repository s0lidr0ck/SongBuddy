'use client';

import React, { useState } from 'react';
import { useTransport } from '@/lib/audio/transport';

interface MasterTempoControlProps {
  className?: string;
}

const MasterTempoControl: React.FC<MasterTempoControlProps> = ({ className = '' }) => {
  const { bpm, setBpm, isPlaying, timeSignature, setTimeSignature } = useTransport();
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.max(60, Math.min(200, newBpm)));
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4); // Keep only last 4 taps
    setTapTimes(newTapTimes);

    if (newTapTimes.length >= 2) {
      // Calculate average interval between taps
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      
      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / averageInterval); // Convert ms to BPM
      
      // Only update if the BPM is reasonable (between 60-200)
      if (calculatedBpm >= 60 && calculatedBpm <= 200) {
        setBpm(calculatedBpm);
      }
    }

    // Clear tap times after 3 seconds of no tapping
    setTimeout(() => {
      setTapTimes(prev => prev.filter(time => Date.now() - time < 3000));
    }, 3000);
  };

  const quickTempos = [60, 72, 90, 120, 140, 160];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-2">🎵</span>
        Master Tempo
      </h2>
      
      {/* Mobile-Responsive Layout */}
      <div className="space-y-6">
        {/* Main Display Row */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {/* BPM Display */}
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-1">{bpm}</div>
            <div className="text-sm text-gray-500 font-medium">BPM</div>
          </div>
          
          {/* Time Signature Display */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {timeSignature.numerator}/{timeSignature.denominator}
            </div>
            <div className="text-sm text-gray-500 font-medium">Time</div>
          </div>
          
          {/* Tap Tempo */}
          <button
            onClick={handleTapTempo}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
            title="Tap to set tempo"
          >
            Tap Tempo
          </button>
        </div>

        {/* BPM Controls Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBpmChange(bpm - 10)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              −10
            </button>
            <button
              onClick={() => handleBpmChange(bpm - 1)}
              className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold"
            >
              −
            </button>
          </div>
          
          {/* BPM Slider */}
          <div className="flex-1">
            <input
              type="range"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>60</span>
              <span>130</span>
              <span>200</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBpmChange(bpm + 1)}
              className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold"
            >
              +
            </button>
            <button
              onClick={() => handleBpmChange(bpm + 10)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              +10
            </button>
          </div>
        </div>

        {/* Bottom Controls Row */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Quick Tempo Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600 self-center mr-2">Quick:</span>
            {quickTempos.map((tempo) => (
              <button
                key={tempo}
                onClick={() => handleBpmChange(tempo)}
                className={`
                  px-3 py-1 rounded-lg text-sm font-medium transition-colors
                  ${bpm === tempo
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {tempo}
              </button>
            ))}
          </div>
          
          {/* Time Signature */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Time:</span>
            <button
              onClick={() => setTimeSignature({ numerator: 4, denominator: 4 })}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${timeSignature.numerator === 4 && timeSignature.denominator === 4
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              4/4
            </button>
            <button
              onClick={() => setTimeSignature({ numerator: 3, denominator: 4 })}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${timeSignature.numerator === 3 && timeSignature.denominator === 4
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              3/4
            </button>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {isPlaying && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Music Lab Active
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterTempoControl;
