import { useState, useEffect, useRef, useCallback } from 'react';

type Biome = 'rain' | 'forest' | 'static' | 'silent';

const SOUNDS = {
  rain: '/sounds/rain.mp3',
  forest: '/sounds/forest.mp3',
  static: '/sounds/static.mp3',
};

export const useAudioBiome = (text: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBiome, setCurrentBiome] = useState<Biome>('static');
  const [volume, setVolume] = useState(0.5); 
  const [intensity, setIntensity] = useState(0); 

  // Audio Refs
  const rainRef = useRef<HTMLAudioElement | null>(null);
  const forestRef = useRef<HTMLAudioElement | null>(null);
  const staticRef = useRef<HTMLAudioElement | null>(null);
  
  const lastTypingTime = useRef<number>(0);

  // 1. INITIALIZE & PRELOAD
  useEffect(() => {
    const initAudio = (url: string) => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0; // Start silent
      audio.preload = 'auto'; 
      return audio;
    };

    rainRef.current = initAudio(SOUNDS.rain);
    forestRef.current = initAudio(SOUNDS.forest);
    staticRef.current = initAudio(SOUNDS.static);

    return () => {
      // Cleanup on unmount
      [rainRef, forestRef, staticRef].forEach(ref => {
        if (ref.current) {
            ref.current.pause();
            ref.current.src = '';
        }
      });
    };
  }, []);

  // 2. INSTANT BIOME DETECTION
  useEffect(() => {
    const lowerText = text.toLowerCase();
    let nextBiome: Biome = 'static'; 

    if (lowerText.includes('#python') || lowerText.includes('#django') || lowerText.includes('#ai')) {
      nextBiome = 'forest';
    } else if (lowerText.includes('#sql') || lowerText.includes('#data') || lowerText.includes('#db')) {
      nextBiome = 'rain';
    } else if (lowerText.includes('#js') || lowerText.includes('#react') || lowerText.includes('#css')) {
      nextBiome = 'static';
    }

    if (nextBiome !== currentBiome) {
      console.log(`⚡ [Instant Switch] -> ${nextBiome}`);
      setCurrentBiome(nextBiome);
    }
  }, [text]);

  // 3. INTENSITY TRACKER
  useEffect(() => {
    const checkIntensity = () => {
      const now = Date.now();
      const timeSinceType = now - lastTypingTime.current;
      // Faster decay/attack for responsiveness
      if (timeSinceType < 1500) {
        setIntensity(prev => Math.min(prev + 0.15, 1)); 
      } else {
        setIntensity(prev => Math.max(prev - 0.1, 0)); 
      }
    };
    const interval = setInterval(checkIntensity, 250); // Faster checks
    return () => clearInterval(interval);
  }, []);

  const triggerTyping = useCallback(() => {
    lastTypingTime.current = Date.now();
  }, []);

  // 4. THE "ALWAYS-ON" MIXER
  useEffect(() => {
    if (!rainRef.current || !forestRef.current || !staticRef.current) return;

    const baseVolume = 0.3; 
    const activeVolume = volume * (baseVolume + (intensity * (1 - baseVolume)));

    const updateTrack = (audio: HTMLAudioElement, isActive: boolean) => {
        // If Power is OFF, pause everything to save CPU
        if (!isPlaying) {
            audio.pause();
            return;
        }

        // If Power is ON, ensure it's playing (even if volume is 0)
        if (audio.paused) {
            audio.play().catch(() => {});
        }

        // Target Volume: Active gets full volume, Inactive gets 0
        const target = isActive ? activeVolume : 0;
        
        // Instant Volume Snap (No fading delay)
        // If you want a tiny fade, change 0.2 to 0.05
        const diff = target - audio.volume;
        if (Math.abs(diff) > 0.01) {
            audio.volume += diff * 0.2; 
        } else {
            audio.volume = target;
        }
    };

    // Update all 3 tracks every render
    updateTrack(rainRef.current, currentBiome === 'rain');
    updateTrack(forestRef.current, currentBiome === 'forest');
    updateTrack(staticRef.current, currentBiome === 'static');

  }, [currentBiome, isPlaying, volume, intensity]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return { isPlaying, togglePlay, currentBiome, intensity, triggerTyping, setVolume, volume };
};