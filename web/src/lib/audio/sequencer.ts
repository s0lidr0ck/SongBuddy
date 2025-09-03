import { create } from 'zustand';

type SequencerState = { 
  bpm: number; 
  setBpm: (n: number) => void; 
  running: boolean; 
  setRunning: (r: boolean) => void;
};

export const useSequencer = create<SequencerState>((set) => ({
  bpm: 72, 
  setBpm: (bpm) => set({ bpm }), 
  running: false, 
  setRunning: (running) => set({ running })
}));