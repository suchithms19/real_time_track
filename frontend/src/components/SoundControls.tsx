import React from 'react';

interface SoundControlsProps {
  sound_state: {
    is_enabled: boolean;
    volume: number;
  };
  toggle_sound: () => void;
  set_volume: (volume: number) => void;
}

export const SoundControls: React.FC<SoundControlsProps> = ({
  sound_state,
  toggle_sound,
  set_volume,
}) => {
  return (
    <div className="bg-gray-900 border border-green-500 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-green-400 font-mono text-sm">AUDIO</span>
        <button
          onClick={toggle_sound}
          className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
            sound_state.is_enabled
              ? 'bg-green-500 text-black hover:bg-green-400'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          {sound_state.is_enabled ? '🔊 ON' : '🔇 OFF'}
        </button>
      </div>
      
      {sound_state.is_enabled && (
        <div className="flex items-center space-x-2">
          <span className="text-green-400 font-mono text-xs">VOL:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={sound_state.volume}
            onChange={(e) => set_volume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                     [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-green-400 font-mono text-xs w-8">
            {Math.round(sound_state.volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}; 