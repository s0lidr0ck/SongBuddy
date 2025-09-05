'use client';

import React from 'react';
import { useTransport } from '@/lib/audio/transport';

interface MasterTempoControlProps {
  className?: string;
}

const MasterTempoControl: React.FC<MasterTempoControlProps> = ({ className = '' }) => {
  const { bpm, setBpm, isPlaying, timeSignature, setTimeSignature } = useTransport();

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.max(60, Math.min(200, newBpm)));
  };

  const quickTempos = [60, 72, 90, 120, 140, 160];

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="mr-2">🎵</span>
        Master Tempo
      </h2>
      
      <div className="flex items-center justify-between">
        {/* BPM and Time Signature Display */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-1">{bpm}</div>
            <div className="text-sm text-gray-500 font-medium">BPM</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {timeSignature.numerator}/{timeSignature.denominator}
            </div>
            <div className="text-sm text-gray-500 font-medium">Time</div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleBpmChange(bpm + 1)}
              className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold"
            >
              +
            </button>
            <button
              onClick={() => handleBpmChange(bpm - 1)}
              className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold"
            >
              −
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleBpmChange(bpm + 10)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              +10
            </button>
            <button
              onClick={() => handleBpmChange(bpm - 10)}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              −10
            </button>
          </div>
        </div>

        {/* BPM Slider */}
        <div className="flex-1 mx-6">
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

        {/* Quick Tempo Presets and Time Signature */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="text-sm font-medium text-gray-600 mb-1">Quick BPM:</div>
            {quickTempos.map((tempo) => (
              <button
                key={tempo}
                onClick={() => handleBpmChange(tempo)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors
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
          
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-600">Time Signature:</div>
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
