import React from 'react';
import ReactDOM from 'react-dom';
import { Volume2, VolumeX, CloudRain, Trees, Zap, Activity } from 'lucide-react';

interface Props {
  isPlaying: boolean;
  togglePlay: () => void;
  currentBiome: 'rain' | 'forest' | 'static' | 'silent';
  intensity: number; // 0 to 1
}

export const AudioController: React.FC<Props> = ({ isPlaying, togglePlay, currentBiome, intensity }) => {
  
  const getIcon = () => {
    switch (currentBiome) {
      case 'rain': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'forest': return <Trees className="w-4 h-4 text-green-400" />;
      case 'static': return <Zap className="w-4 h-4 text-yellow-400" />;
      default: return <Volume2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLabel = () => {
    switch (currentBiome) {
      case 'rain': return 'Structure (SQL)';
      case 'forest': return 'Nature (Python)';
      case 'static': return 'Flow (Focus)';
      default: return 'Silence';
    }
  };

  // --- THE UI CONTENT ---
  const content = (
    <div className={`
      fixed bottom-6 right-6 z-[99999] flex items-center gap-3 p-3 rounded-full border shadow-2xl backdrop-blur-md transition-all duration-500 font-sans
      ${isPlaying ? 'bg-gray-900/90 border-gray-700 pr-6' : 'bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-700 w-12 h-12 justify-center hover:w-auto hover:pr-6 group overflow-hidden cursor-pointer'}
    `}>
      
      {/* Power Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className={`shrink-0 p-1 rounded-full transition-colors ${isPlaying ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'}`}
      >
        {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>

      {/* Expanded Controls */}
      <div 
        className={`flex items-center gap-3 transition-all duration-500 overflow-hidden whitespace-nowrap ${isPlaying ? 'w-auto opacity-100' : 'w-0 opacity-0 group-hover:w-auto group-hover:opacity-100'}`}
        onClick={!isPlaying ? togglePlay : undefined}
      >
        
        {/* Divider */}
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

        {/* Biome Indicator */}
        <div className="flex items-center gap-2">
            {getIcon()}
            <div className="flex flex-col leading-none">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Environment</span>
                <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">{getLabel()}</span>
            </div>
        </div>

        {/* Intensity Meter */}
        {isPlaying && (
            <div className="flex flex-col gap-1 w-12 ml-2">
                <div className="flex justify-between items-center">
                    <Activity className="w-3 h-3 text-gray-400" />
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-300" 
                        style={{ width: `${Math.max(intensity * 100, 10)}%` }} 
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(content, document.body);
};