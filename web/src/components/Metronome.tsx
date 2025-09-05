'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioScheduler } from '@/lib/audio/scheduler';
import { useTransport } from '@/lib/audio/transport';

export default function Metronome() {
  const { bpm, setBpm, clickEnabled } = useTransport();
  const [running, setRunning] = useState(false);
  const [scheduler, setScheduler] = useState<AudioScheduler | null>(null);
  const [samples, setSamples] = useState<{onBeat: AudioBuffer | null, offBeat: AudioBuffer | null}>({ onBeat: null, offBeat: null });
  const [currentBeat, setCurrentBeat] = useState(1);
  const beatIndexRef = useRef(0); // 0..3, first callback -> 0 => beat 1

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (async () => {
        const newScheduler = new AudioScheduler();
        await newScheduler.init();
        loadMetronomeSamples(newScheduler);
        setScheduler(newScheduler);
      })();
    }

    return () => {
      if (scheduler) {
        scheduler.stop();
      }
    };
  }, []);

  const loadMetronomeSamples = async (schedulerInstance: AudioScheduler) => {
    if (!schedulerInstance) return;
    
    try {
      const onBeatSample = await schedulerInstance.loadSample('https://s-r-m.s3.us-east-1.amazonaws.com/SongBuddy/audio/on-beat.mp3');
      const offBeatSample = await schedulerInstance.loadSample('https://s-r-m.s3.us-east-1.amazonaws.com/SongBuddy/audio/off-beat.mp3');
      setSamples({ onBeat: onBeatSample, offBeat: offBeatSample });
    } catch (error) {
      console.error('Error loading metronome samples:', error);
    }
  };

  const metronomeCallback = useCallback((time: number) => {
    if (!scheduler || !clickEnabled) return;
    const beat = (beatIndexRef.current % 4) + 1;
    if (beat === 1 && samples.onBeat) {
      scheduler.playSample(samples.onBeat, time, 0.7);
    } else if (samples.offBeat) {
      scheduler.playSample(samples.offBeat, time, 0.5);
    } else {
      scheduler.playClick(time);
    }
    setCurrentBeat(beat);
    beatIndexRef.current = (beatIndexRef.current + 1) % 4;
  }, [clickEnabled, scheduler, samples]);

  // Keep BPM updated on scheduler
  useEffect(() => {
    if (scheduler) {
      scheduler.setBPM(bpm);
    }
  }, [bpm, scheduler]);

  // Start/stop only when running changes
  useEffect(() => {
    if (!scheduler) return;
    const run = async () => {
      if (running) {
        // Reset to downbeat on start
        beatIndexRef.current = 0;
        setCurrentBeat(1);
        scheduler.removeCallback(metronomeCallback);
        scheduler.addCallback(metronomeCallback);
        await scheduler.start();
      } else {
        scheduler.removeCallback(metronomeCallback);
        scheduler.stop();
        beatIndexRef.current = 0;
        setCurrentBeat(1);
      }
    };
    run();
    return () => {
      if (scheduler) {
        scheduler.removeCallback(metronomeCallback);
      }
    };
  }, [running, metronomeCallback, scheduler]);

  const toggleMetronome = () => {
    setRunning(!running);
  };

  // Removed BPM controls - now managed by master tempo

  // Removed tap tempo logic - now handled by master tempo

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Metronome</h2>
      
      <div className="text-center mb-8">
        <div className="text-4xl font-bold text-gray-900 mb-2">{bpm} BPM</div>
        <div className="text-sm text-gray-500">Controlled by Master Tempo</div>
      </div>

      <div className="flex items-center justify-center space-x-2 mb-8">
        {[1, 2, 3, 4].map((beat) => (
          <div
            key={beat}
            className={`w-4 h-4 rounded-full transition-colors ${
              running && currentBeat === beat
                ? 'bg-blue-500'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={toggleMetronome}
          className={`w-20 h-20 rounded-full text-2xl font-bold transition-colors ${
            running
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {running ? '⏸' : '▶'}
        </button>
        
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        Use the Master Tempo control above to adjust BPM and tap tempo
      </div>
    </div>
  );
}