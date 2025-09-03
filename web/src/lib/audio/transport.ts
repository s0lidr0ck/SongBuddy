import { create } from 'zustand';

type TransportState = {
  bpm: number;
  setBpm: (bpm: number) => void;
  clickEnabled: boolean;
  setClickEnabled: (enabled: boolean) => void;
};

export const useTransport = create<TransportState>((set) => ({
  bpm: 72,
  setBpm: (bpm) => set({ bpm }),
  clickEnabled: true,
  setClickEnabled: (clickEnabled) => set({ clickEnabled })
}));


