import { create } from 'zustand';

type TransportState = {
  bpm: number;
  setBpm: (bpm: number) => void;
  clickEnabled: boolean;
  setClickEnabled: (enabled: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  timeSignature: { numerator: number; denominator: number };
  setTimeSignature: (timeSignature: { numerator: number; denominator: number }) => void;
};

export const useTransport = create<TransportState>((set) => ({
  bpm: 120,
  setBpm: (bpm) => set({ bpm }),
  clickEnabled: true,
  setClickEnabled: (clickEnabled) => set({ clickEnabled }),
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  timeSignature: { numerator: 4, denominator: 4 },
  setTimeSignature: (timeSignature) => set({ timeSignature })
}));


