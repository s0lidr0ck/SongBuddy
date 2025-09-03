import { create } from 'zustand';

type TempoState = { 
  bpm: number; 
  setBpm: (n: number) => void; 
  running: boolean; 
  setRunning: (r: boolean) => void;
};

export const useTempo = create<TempoState>((set) => ({
  bpm: 72, 
  setBpm: (bpm) => set({ bpm }), 
  running: false, 
  setRunning: (running) => set({ running })
}));