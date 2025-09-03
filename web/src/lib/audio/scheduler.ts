export class AudioScheduler {
  private id: string;
  public audioContext!: AudioContext;
  private intervalId: number | null = null;
  public callbacks: ((time: number, step: number) => void)[] = [];
  private bpm: number = 120.0;
  private nextNoteTime: number = 0.0;
  private scheduleAheadTime: number = 25.0; // ms
  private noteLength: number = 0.05; // seconds
  private isPlaying: boolean = false;
  private currentStep: number = 0;

  constructor() {
    this.id = Math.random().toString(36).substring(2, 11);
  }
  
  async init() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  setBPM(bpm: number) {
    this.bpm = bpm;
  }

  addCallback(callback: (time: number, step: number) => void) {
    this.callbacks.push(callback);
  }

  removeCallback(callback: (time: number, step: number) => void) {
    let index = this.callbacks.indexOf(callback);
    while (index > -1) {
      this.callbacks.splice(index, 1);
      index = this.callbacks.indexOf(callback);
    }
  }

  async start() {
    if (!this.audioContext) return;
    if (this.isPlaying) {
      return; // prevent duplicate timers
    }

    // Resume audio context on user interaction
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.isPlaying = true;
    this.nextNoteTime = this.audioContext.currentTime;
    this.currentStep = 0; // Reset step counter
    
    // Use setInterval for more predictable timing
    this.intervalId = setInterval(() => {
      this.scheduler();
    }, 10); // Check every 10ms
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }



  private scheduler() {
    if (!this.audioContext || !this.isPlaying) return;

    const currentTime = this.audioContext.currentTime;
    const scheduleWindow = currentTime + this.scheduleAheadTime / 1000;
    
    // Only schedule one beat at a time to prevent double-scheduling
    if (this.nextNoteTime < scheduleWindow) {
      // Call all registered callbacks for this beat
      this.callbacks.forEach((callback) => {
        callback(this.nextNoteTime, this.currentStep);
      });

      // Advance time and step
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextNoteTime += secondsPerBeat;
      this.currentStep = (this.currentStep + 1) % 8;
    }
  }

  playClick(time: number) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 1000; // Higher frequency for clearer click
    oscillator.type = 'sine'; // Clean sine wave
    
    // Better envelope - start at 0, attack quickly, then decay
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + this.noteLength); // Decay to very small but non-zero value

    oscillator.start(time);
    oscillator.stop(time + this.noteLength);
  }

  playSample(audioBuffer: AudioBuffer, time: number, volume = 1.0) {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.value = volume;

    source.start(time);
  }

  async loadSample(url: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Error loading sample:', error);
      return null;
    }
  }
}