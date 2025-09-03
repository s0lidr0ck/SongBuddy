import { AudioScheduler } from './scheduler';

declare global {
  interface Window { __songbuddyScheduler?: AudioScheduler }
}

let moduleSingleton: AudioScheduler | null = null;

export async function getScheduler(): Promise<AudioScheduler> {
  if (typeof window !== 'undefined') {
    if (!window.__songbuddyScheduler) {
      const sched = new AudioScheduler();
      await sched.init();
      window.__songbuddyScheduler = sched;
    }
    return window.__songbuddyScheduler as AudioScheduler;
  }
  if (!moduleSingleton) {
    moduleSingleton = new AudioScheduler();
    await moduleSingleton.init();
  }
  return moduleSingleton;
}

export function stopScheduler() {
  if (typeof window !== 'undefined' && window.__songbuddyScheduler) {
    window.__songbuddyScheduler.stop();
  } else if (moduleSingleton) {
    moduleSingleton.stop();
  }
}


