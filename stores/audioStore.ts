"use client";

import { create } from "zustand";

interface LoopAB {
  pointA: number | null;
  pointB: number | null;
  isLooping: boolean;
}

interface AudioState {
  // Player state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  isBuffering: boolean;
  speed: number;
  volume: number;

  // Loop A-B
  loopAB: LoopAB;

  // Current lesson audio
  audioUrl: string | null;

  // Yêu cầu seek tương đối — AudioPlayer sở hữu <audio> nên nó áp dụng, nonce để lặp lại được
  seekRequest: { delta: number; nonce: number } | null;

  // Actions
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsLoaded: (loaded: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setAudioUrl: (url: string | null) => void;
  requestSeekBy: (delta: number) => void;
  setLoopPoint: (point: "A" | "B", time: number) => void;
  clearLoop: () => void;
  toggleLoop: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isLoaded: false,
  isBuffering: false,
  speed: 1,
  volume: 1,
  loopAB: { pointA: null, pointB: null, isLooping: false },
  audioUrl: null,
  seekRequest: null,
};

/**
 * Audio Store — quản lý state của audio player.
 * Không persist — reset khi navigate sang bài mới.
 */
export const useAudioStore = create<AudioState>()((set, get) => ({
  ...INITIAL_STATE,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setSpeed: (speed) => set({ speed }),
  setVolume: (volume) => set({ volume }),
  setAudioUrl: (audioUrl) => set({ audioUrl, isLoaded: false, currentTime: 0 }),

  requestSeekBy: (delta) =>
    set((state) => ({
      seekRequest: { delta, nonce: (state.seekRequest?.nonce ?? 0) + 1 },
    })),

  setLoopPoint: (point, time) => {
    const { loopAB } = get();
    if (point === "A") {
      set({ loopAB: { ...loopAB, pointA: time } });
    } else {
      set({ loopAB: { ...loopAB, pointB: time } });
    }
  },

  clearLoop: () =>
    set({ loopAB: { pointA: null, pointB: null, isLooping: false } }),

  toggleLoop: () => {
    const { loopAB } = get();
    if (loopAB.pointA !== null && loopAB.pointB !== null) {
      set({ loopAB: { ...loopAB, isLooping: !loopAB.isLooping } });
    }
  },

  reset: () => set(INITIAL_STATE),
}));
