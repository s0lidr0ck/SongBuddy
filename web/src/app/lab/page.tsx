'use client';

import Metronome from '@/components/Metronome';
import Step808 from '@/components/Step808';
import Piano from '@/components/Piano';
import ChordExplorer from '@/components/ChordExplorer';
import MasterTempoControl from '@/components/MasterTempoControl';

export default function LabPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Music Lab</h1>
          <p className="text-gray-600">
            Explore music with our collection of tools: metronome, sequencer, piano, and chord explorer.
          </p>
        </div>

        {/* Master Tempo Control */}
        <div className="mb-8">
          <MasterTempoControl />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <Metronome />
          <Step808 />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Piano />
          <ChordExplorer />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Metronome</h3>
              <ul className="space-y-1">
                <li>• Adjust BPM with slider or +/- buttons</li>
                <li>• Use "Tap Tempo" to set BPM by tapping</li>
                <li>• Visual beat indicators show current beat</li>
                <li>• Quick presets: 60, 72, 90, 120 BPM</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">808 Sequencer</h3>
              <ul className="space-y-1">
                <li>• Click squares to activate/deactivate steps</li>
                <li>• Adjust volume for each track with sliders</li>
                <li>• Save patterns for later use</li>
                <li>• Syncs automatically with metronome tempo</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Piano</h3>
              <ul className="space-y-1">
                <li>• Click and hold keys to play notes</li>
                <li>• Use +/- buttons to change octave</li>
                <li>• Supports octaves 0-8</li>
                <li>• Touch-friendly for mobile devices</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Chord Explorer</h3>
              <ul className="space-y-1">
                <li>• Select any major key</li>
                <li>• See Nashville Number System</li>
                <li>• Click chords to hear them</li>
                <li>• Shows chord notes and Roman numerals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
}