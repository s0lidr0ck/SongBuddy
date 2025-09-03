'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTransport } from '@/lib/audio/transport';
import { AudioScheduler } from '@/lib/audio/scheduler';
import { getDB } from '@/lib/db/rxdb';

interface Pattern {
  kick: number[];
  snare: number[];
  hat: number[];
  ride: number[];
}

interface PatternData {
  id: string;
  name?: string;
  bpm: number;
  steps: Pattern;
  created_at: string;
  updated_at: string;
}

let sequencerScheduler: AudioScheduler | null = null;
const sampleBuffers: { [key: string]: AudioBuffer | null } = {
  kick: null,
  snare: null,
  hat: null,
  ride: null
};

export default function Step808() {
  const { bpm, setBpm, clickEnabled, setClickEnabled } = useTransport();
  const [running, setRunning] = useState(false);
  const [scheduler, setScheduler] = useState<AudioScheduler | null>(null);
  const [pattern, setPattern] = useState<Pattern>({
    kick: [1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0],
    hat: [1, 1, 1, 1, 1, 1, 1, 1],
    ride: [0, 0, 0, 0, 0, 0, 0, 0]
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [volumes, setVolumes] = useState({
    kick: 0.8,
    snare: 0.7,
    hat: 0.5,
    ride: 0.6
  });
  const patternRef = useRef(pattern);
  const currentStepRef = useRef(0);
  const pendingTimersRef = useRef<number[]>([]);
  const [doubles, setDoubles] = useState({ kick: false, snare: false, hat: false, ride: false });
  const volumesRef = useRef(volumes);
  const doublesRef = useRef(doubles);
  const secondsPerBeatRef = useRef(60 / Math.max(40, Math.min(200, bpm)));


  useEffect(() => { patternRef.current = pattern; }, [pattern]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { volumesRef.current = volumes; }, [volumes]);
  useEffect(() => { doublesRef.current = doubles; }, [doubles]);
  const [savedPatterns, setSavedPatterns] = useState<PatternData[]>([]);

  useEffect(() => {
    const newScheduler = new AudioScheduler();
    if (typeof window !== 'undefined') {
      (async () => {
        await newScheduler.init();
        loadSamples(newScheduler);
        setScheduler(newScheduler);
      })();
    }
    loadSavedPatterns();

    return () => {
      newScheduler.stop();
    };
  }, []);

  const loadSamples = async (schedulerInstance: AudioScheduler) => {
    if (!schedulerInstance) return;
    try {
      // Try to load samples from public folder; fallback to synths if not found
      const [kick, snare, hat, ride] = await Promise.all([
        schedulerInstance.loadSample('/audio/808/kick.wav'),
        schedulerInstance.loadSample('/audio/808/snare.wav'),
        schedulerInstance.loadSample('/audio/808/hat.wav'),
        schedulerInstance.loadSample('/audio/808/ride.wav')
      ]);
      sampleBuffers.kick = kick;
      sampleBuffers.snare = snare;
      sampleBuffers.hat = hat;
      sampleBuffers.ride = ride;
    } catch (error) {
      console.error('Error loading samples:', error);
    }
  };

  const createSyntheticKick = useCallback(
    (time: number) => {
      if (!scheduler) return;

      const oscillator = scheduler.audioContext.createOscillator();
      const gainNode = scheduler.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(scheduler.audioContext.destination);

      oscillator.frequency.setValueAtTime(150, time);
      gainNode.gain.setValueAtTime(1, time);

      oscillator.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

      oscillator.start(time);
      oscillator.stop(time + 0.1);
    },
    [scheduler],
  );

  const createSyntheticSnare = useCallback(
    (time: number) => {
      if (!scheduler) return;
      const noise = scheduler.audioContext.createBufferSource();
      const noiseGain = scheduler.audioContext.createGain();
      const noiseFilter = scheduler.audioContext.createBiquadFilter();

      const bufferSize = scheduler.audioContext.sampleRate;
      const buffer = scheduler.audioContext.createBuffer(1, bufferSize, bufferSize);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;

      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1500;
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(scheduler.audioContext.destination);

      noiseGain.gain.setValueAtTime(0.5, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      noise.start(time);
      noise.stop(time + 0.2);

      const osc = scheduler.audioContext.createOscillator();
      const oscGain = scheduler.audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, time);
      osc.connect(oscGain);
      oscGain.connect(scheduler.audioContext.destination);

      oscGain.gain.setValueAtTime(0.7, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.start(time);
      osc.stop(time + 0.2);
    },
    [scheduler],
  );

  const createSyntheticHat = useCallback(
    (time: number) => {
      if (!scheduler) return;
      const noise = scheduler.audioContext.createBufferSource();
      const noiseGain = scheduler.audioContext.createGain();
      const noiseFilter = scheduler.audioContext.createBiquadFilter();

      const bufferSize = scheduler.audioContext.sampleRate;
      const buffer = scheduler.audioContext.createBuffer(1, bufferSize, bufferSize);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;

      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 7000;
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(scheduler.audioContext.destination);

      noiseGain.gain.setValueAtTime(0.3, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      noise.start(time);
      noise.stop(time + 0.05);
    },
    [scheduler],
  );

  const createSyntheticRide = useCallback(
    (time: number) => {
      if (!scheduler) return;
      const noise = scheduler.audioContext.createBufferSource();
      const noiseGain = scheduler.audioContext.createGain();
      const noiseFilter = scheduler.audioContext.createBiquadFilter();

      const bufferSize = scheduler.audioContext.sampleRate;
      const buffer = scheduler.audioContext.createBuffer(1, bufferSize, bufferSize);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;

      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 5000;
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(scheduler.audioContext.destination);

      noiseGain.gain.setValueAtTime(0.4, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      noise.start(time);
      noise.stop(time + 0.3);
    },
    [scheduler],
  );

  // Create a stable callback that receives step from scheduler
  const sequencerCallback = useCallback((time: number, stepIndex: number) => {
    const p = patternRef.current;

    // Play sounds for current step
    if (p.kick[stepIndex]) {
      if (sampleBuffers.kick) {
        scheduler?.playSample(
          sampleBuffers.kick,
          time,
          volumesRef.current.kick,
        );
      } else {
        createSyntheticKick(time);
      }
      if (doublesRef.current.kick) {
        const half = secondsPerBeatRef.current / 2;
        if (sampleBuffers.kick) {
          scheduler?.playSample(
            sampleBuffers.kick,
            time + half,
            volumesRef.current.kick,
          );
        } else {
          createSyntheticKick(time + half);
        }
      }
    }
    if (p.snare[stepIndex]) {
      if (sampleBuffers.snare) {
        scheduler?.playSample(
          sampleBuffers.snare,
          time,
          volumesRef.current.snare,
        );
      } else {
        createSyntheticSnare(time);
      }
      if (doublesRef.current.snare) {
        const half = secondsPerBeatRef.current / 2;
        if (sampleBuffers.snare) {
          scheduler?.playSample(
            sampleBuffers.snare,
            time + half,
            volumesRef.current.snare,
          );
        } else {
          createSyntheticSnare(time + half);
        }
      }
    }
    if (p.hat[stepIndex]) {
      if (sampleBuffers.hat) {
        scheduler?.playSample(
          sampleBuffers.hat,
          time,
          volumesRef.current.hat,
        );
      } else {
        createSyntheticHat(time);
      }
      if (doublesRef.current.hat) {
        const half = secondsPerBeatRef.current / 2;
        if (sampleBuffers.hat) {
          scheduler?.playSample(
            sampleBuffers.hat,
            time + half,
            volumesRef.current.hat,
          );
        } else {
          createSyntheticHat(time + half);
        }
      }
    }
    if (p.ride[stepIndex]) {
      if (sampleBuffers.ride) {
        scheduler?.playSample(
          sampleBuffers.ride,
          time,
          volumesRef.current.ride,
        );
      } else {
        createSyntheticRide(time);
      }
      if (doublesRef.current.ride) {
        const half = secondsPerBeatRef.current / 2;
        if (sampleBuffers.ride) {
          scheduler?.playSample(
            sampleBuffers.ride,
            time + half,
            volumesRef.current.ride,
          );
        } else {
          createSyntheticRide(time + half);
        }
      }
    }

    // Visual: highlight the column that was just triggered, aligned to audio time
    const ctx = scheduler?.audioContext;
    if (ctx) {
      const delayMs = Math.max(0, (time - ctx.currentTime) * 1000 - 2);
      const id = window.setTimeout(() => setCurrentStep(stepIndex), delayMs);
      pendingTimersRef.current.push(id);
    } else {
      setCurrentStep(stepIndex);
    }
  }, [scheduler, createSyntheticKick, createSyntheticSnare, createSyntheticHat, createSyntheticRide]);

  // Keep BPM updated on scheduler
  useEffect(() => {
    if (scheduler) {
      scheduler.setBPM(bpm);
    }
    secondsPerBeatRef.current = 60 / Math.max(40, Math.min(200, bpm));
  }, [bpm, scheduler]);

  // Start/stop only when running changes
  useEffect(() => {
    if (!scheduler) return;
    const run = async () => {
      if (running) {
        // Reset visual step indicator
        setCurrentStep(0);

        // Clear ALL callbacks to prevent any duplicates
        scheduler.callbacks = [];
        // Add the stable callback
        scheduler.addCallback(sequencerCallback);
        // Disable metronome click when sequencer is running
        setClickEnabled(false);
        await scheduler.start();
      } else {
        scheduler.stop();
        // Re-enable metronome click
        setClickEnabled(true);
        // Clear any pending visual timers
        pendingTimersRef.current.forEach((id) => clearTimeout(id));
        pendingTimersRef.current = [];
        setCurrentStep(0);
      }
    };
    run();
  }, [running, scheduler]);

  const toggleStep = (track: keyof Pattern, step: number) => {
    setPattern(prev => ({
      ...prev,
      [track]: prev[track].map((value, index) => 
        index === step ? (value ? 0 : 1) : value
      )
    }));
  };

  const clearPattern = () => {
    setPattern({
      kick: [0, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 0, 0, 0, 0, 0, 0, 0],
      hat: [0, 0, 0, 0, 0, 0, 0, 0],
      ride: [0, 0, 0, 0, 0, 0, 0, 0]
    });
  };

  const loadSavedPatterns = async () => {
    try {
      const db = await getDB();
      const docs = await db.patterns.find({
        sort: [{ updated_at: 'desc' }]
      }).exec();
      
      const patterns = docs.map((doc: any) => ({
        id: doc.get('id'),
        name: doc.get('name'),
        bpm: doc.get('bpm'),
        steps: doc.get('steps'),
        created_at: doc.get('created_at'),
        updated_at: doc.get('updated_at')
      }));
      
      setSavedPatterns(patterns);
    } catch (error) {
      console.error('Error loading patterns:', error);
    }
  };

  const savePattern = async () => {
    try {
      const db = await getDB();
      const now = new Date().toISOString();
      const patternId = `pattern_${Date.now()}`;
      
      const patternData = {
        id: patternId,
        name: `Pattern ${savedPatterns.length + 1}`,
        bpm,
        steps: pattern,
        created_at: now,
        updated_at: now
      };
      
      await db.patterns.insert(patternData);
      await loadSavedPatterns();
    } catch (error) {
      console.error('Error saving pattern:', error);
    }
  };

  const loadPattern = (patternData: PatternData) => {
    setPattern(patternData.steps);
  };

  const trackNames = {
    kick: 'Kick',
    snare: 'Snare',
    hat: 'Hi-Hat',
    ride: 'Ride'
  };

  const trackColors = {
    kick: 'bg-red-500',
    snare: 'bg-blue-500',
    hat: 'bg-yellow-500',
    ride: 'bg-green-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Drum Machine</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setRunning(!running)}
            className={`px-4 py-2 text-sm font-medium rounded ${
              running
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {running ? '⏸ Stop' : '▶ Play'}
          </button>
          <button
            onClick={clearPattern}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
          >
            Clear
          </button>
          <button
            onClick={savePattern}
            className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
          >
            Save Pattern
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">BPM:</span>
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold"
            >
              −
            </button>
            <span className="text-xl font-bold text-gray-900 w-12 text-center">{bpm}</span>
            <button
              onClick={() => setBpm(Math.min(200, bpm + 1))}
              className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-sm font-bold"
            >
              +
            </button>
          </div>
          <div className="flex items-center space-x-2 sm:flex-1 sm:max-w-xs sm:ml-4">
            <span className="text-xs text-gray-500 sm:hidden">Slider:</span>
            <input
              type="range"
              min="40"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-1 h-2"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(pattern).map(([track, steps]) => (
          <div key={track} className="space-y-2">
            {/* Track controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-700 min-w-[4rem]">
                  {trackNames[track as keyof typeof trackNames]}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Vol:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volumes[track as keyof typeof volumes]}
                    onChange={(e) => setVolumes(prev => ({
                      ...prev,
                      [track]: parseFloat(e.target.value)
                    }))}
                    className="w-20 h-2"
                  />
                  <span className="text-xs text-gray-500 w-10 text-right">
                    {Math.round(volumes[track as keyof typeof volumes] * 100)}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDoubles(prev => ({ ...prev, [track]: !prev[track as keyof typeof prev] }))}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  doubles[track as keyof typeof doubles]
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
                title="Double rate (2x)"
              >
                2x
              </button>
            </div>
            
            {/* Step buttons row */}
            <div className="grid grid-cols-8 gap-1">
              {steps.map((active: number, stepIndex: number) => (
                <button
                  key={stepIndex}
                  onClick={() => toggleStep(track as keyof Pattern, stepIndex)}
                  className={`w-12 h-12 rounded border-2 transition-transform ${
                    active
                      ? `${trackColors[track as keyof typeof trackColors]} border-gray-400`
                      : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
                  } ${
                    running && currentStep === stepIndex
                      ? 'ring-2 ring-blue-400 scale-105'
                      : ''
                  }`}
                >
                  <div className="text-xs text-gray-600">{stepIndex + 1}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {savedPatterns.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Saved Patterns</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {savedPatterns.map(patternData => (
              <button
                key={patternData.id}
                onClick={() => loadPattern(patternData)}
                className="p-3 text-sm bg-gray-100 hover:bg-gray-200 rounded border text-left"
              >
                <div className="font-medium">{patternData.name}</div>
                <div className="text-xs text-gray-500">{patternData.bpm} BPM</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}