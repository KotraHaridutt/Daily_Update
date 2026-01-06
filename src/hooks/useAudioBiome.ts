import { useState, useEffect, useRef, useCallback } from 'react';

type Biome = 'rain' | 'forest' | 'static' | 'silent';

// Reliable Open Source Audio Loops (Wikimedia Commons)
const SOUNDS = {
  rain: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Rain_on_windows_int.ogg', // SQL / Water
  forest: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Forest_ambience_2.ogg', // Python / Nature
  static: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Brown_noise.ogg', // JS / Lightning / Focus
};

export const useAudioBiome = (text: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBiome, setCurrentBiome] = useState<Biome>('static');
  const [volume, setVolume] = useState(0.5); // Master volume
  const [intensity, setIntensity] = useState(0); // Typing intensity (0 to 1)

  // Audio Refs
  const rainRef = useRef<HTMLAudioElement | null>(null);
  const forestRef = useRef<HTMLAudioElement | null>(null);
  const staticRef = useRef<HTMLAudioElement | null>(null);
  
  // Typing Tracker
  const lastTypingTime = useRef<number>(0);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);

  // 1. INITIALIZE AUDIO
  useEffect(() => {
    const initAudio = (url: string) => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0;
      return audio;
    };

    rainRef.current = initAudio(SOUNDS.rain);
    forestRef.current = initAudio(SOUNDS.forest);
    staticRef.current = initAudio(SOUNDS.static);

    return () => {
      rainRef.current?.pause();
      forestRef.current?.pause();
      staticRef.current?.pause();
    };
  }, []);

  // 2. DETECT BIOME BASED ON TAGS
  useEffect(() => {
    const lowerText = text.toLowerCase();
    let nextBiome: Biome = 'static'; // Default (Brown Noise)

    if (lowerText.includes('#python') || lowerText.includes('#django') || lowerText.includes('#ai')) {
      nextBiome = 'forest';
    } else if (lowerText.includes('#sql') || lowerText.includes('#data') || lowerText.includes('#db')) {
      nextBiome = 'rain';
    } else if (lowerText.includes('#js') || lowerText.includes('#react') || lowerText.includes('#css')) {
      nextBiome = 'static';
    }

    // Only switch if we found a specific biome, otherwise stick to previous or default
    if (nextBiome !== currentBiome) {
      setCurrentBiome(nextBiome);
    }
  }, [text]);

  // 3. TRACK TYPING INTENSITY (Decay Logic)
  useEffect(() => {
    const checkIntensity = () => {
      const now = Date.now();
      const timeSinceType = now - lastTypingTime.current;

      // Logic: If typed within last 2 seconds, boost intensity. Otherwise decay.
      if (timeSinceType < 2000) {
        setIntensity(prev => Math.min(prev + 0.1, 1)); // Ramp up
      } else {
        setIntensity(prev => Math.max(prev - 0.05, 0)); // Decay down
      }
    };

    const interval = setInterval(checkIntensity, 500);
    return () => clearInterval(interval);
  }, []);

  // 4. TRIGGER TYPING EVENT (Call this onKeyDown)
  const triggerTyping = useCallback(() => {
    lastTypingTime.current = Date.now();
  }, []);

  // 5. MASTER MIXER (The Fader)
  useEffect(() => {
    if (!rainRef.current || !forestRef.current || !staticRef.current) return;

    const targetVolume = isPlaying ? volume : 0;
    
    // Dynamic Mix: Base Volume (20%) + Intensity Boost (up to 80%)
    const activeVolume = targetVolume * (0.2 + (intensity * 0.8));

    const fade = (audio: HTMLAudioElement, target: number) => {
      const diff = target - audio.volume;
      if (Math.abs(diff) > 0.01) {
        audio.volume += diff * 0.1; // Smooth fade
      }
    };

    // Apply fades based on current biome
    if (isPlaying) {
        // Start playing if paused
        if (rainRef.current.paused) rainRef.current.play();
        if (forestRef.current.paused) forestRef.current.play();
        if (staticRef.current.paused) staticRef.current.play();

        // Mix levels
        fade(rainRef.current, currentBiome === 'rain' ? activeVolume : 0);
        fade(forestRef.current, currentBiome === 'forest' ? activeVolume : 0);
        fade(staticRef.current, currentBiome === 'static' ? activeVolume : 0);
    } else {
        // Fade all to 0
        fade(rainRef.current, 0);
        fade(forestRef.current, 0);
        fade(staticRef.current, 0);
        
        // Pause if fully silent (optimization)
        if (rainRef.current.volume < 0.01) rainRef.current.pause();
    }

  }, [currentBiome, isPlaying, volume, intensity]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  return { isPlaying, togglePlay, currentBiome, intensity, triggerTyping, setVolume, volume };
};