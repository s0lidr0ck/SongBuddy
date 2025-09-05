import { create } from 'zustand';

type TransportState = {
  bpm: number;
  setBpm: (bpm: number) => void;
  clickEnabled: boolean;
  setClickEnabled: (enabled: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
};

export const useTransport = create<TransportState>((set) => ({
  bpm: 120,
  setBpm: (bpm) => set({ bpm }),
  clickEnabled: true,
  setClickEnabled: (clickEnabled) => set({ clickEnabled }),
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying })
}));


