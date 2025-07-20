import { useCallback, useRef, useState } from 'react';

interface NotificationSoundState {
  is_enabled: boolean;
  volume: number;
}

export const useNotificationSound = () => {
  const audio_context_ref = useRef<AudioContext | null>(null);
  const [sound_state, setSoundState] = useState<NotificationSoundState>({
    is_enabled: true,
    volume: 0.3,
  });

  // Initialize AudioContext on first use
  const get_audio_context = useCallback((): AudioContext | null => {
    if (!audio_context_ref.current) {
      try {
        audio_context_ref.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext not supported:', error);
        return null;
      }
    }
    return audio_context_ref.current;
  }, []);

  // Generate notification beep sound
  const play_notification = useCallback(async () => {
    if (!sound_state.is_enabled) return;

    const audio_context = get_audio_context();
    if (!audio_context) return;

    try {
      // Resume AudioContext if suspended (required by some browsers)
      if (audio_context.state === 'suspended') {
        await audio_context.resume();
      }

      // Create oscillator for beep sound
      const oscillator = audio_context.createOscillator();
      const gain_node = audio_context.createGain();

      // Connect nodes
      oscillator.connect(gain_node);
      gain_node.connect(audio_context.destination);

      // Configure sound - tactical beep
      oscillator.frequency.setValueAtTime(800, audio_context.currentTime); // 800Hz frequency
      oscillator.type = 'sine';

      // Volume envelope for smooth beep
      gain_node.gain.setValueAtTime(0, audio_context.currentTime);
      gain_node.gain.linearRampToValueAtTime(sound_state.volume, audio_context.currentTime + 0.01);
      gain_node.gain.linearRampToValueAtTime(0, audio_context.currentTime + 0.15);

      // Play the beep
      oscillator.start(audio_context.currentTime);
      oscillator.stop(audio_context.currentTime + 0.15);

    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [sound_state.is_enabled, sound_state.volume, get_audio_context]);

  // Double beep for important events
  const play_double_beep = useCallback(async () => {
    if (!sound_state.is_enabled) return;

    await play_notification();
    setTimeout(() => play_notification(), 200);
  }, [play_notification, sound_state.is_enabled]);

  const toggle_sound = useCallback(() => {
    setSoundState(prev => ({
      ...prev,
      is_enabled: !prev.is_enabled,
    }));
  }, []);

  const set_volume = useCallback((volume: number) => {
    setSoundState(prev => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume)),
    }));
  }, []);

  const cleanup = useCallback(() => {
    if (audio_context_ref.current) {
      audio_context_ref.current.close();
      audio_context_ref.current = null;
    }
  }, []);

  return {
    sound_state,
    play_notification,
    play_double_beep,
    toggle_sound,
    set_volume,
    cleanup,
  };
}; 