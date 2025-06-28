import { useState, useEffect, useRef, useCallback } from 'react';
import browserSupport from './utils/browserSupport';
import { AudioEffectType, type AudioEffectOptions, applyAudioEffect } from './effects/audioEffects';

// Configuration options interface
export interface AudioRecorderOptions {
  /** Optional audio constraints to pass to getUserMedia */
  audioConstraints?: MediaTrackConstraints;
  /** Recording data chunk interval in milliseconds */
  chunkInterval?: number;
  /** Custom MIME type to use if supported */
  preferredMimeType?: string;
  /** Called when recording is unsupported on the browser */
  onNotSupported?: () => void;
  /** Optional bitrate for audio recording quality */
  audioBitsPerSecond?: number;
  /** Volume metering refresh rate in ms (default: 100) */
  volumeMeterRefreshRate?: number;
  /** Audio effect to apply during recording (default: none) */
  audioEffect?: AudioEffectOptions;
}

export interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => Promise<void>;
  saveRecording: () => Promise<{ blob: Blob; url: string } | null>;
  playRecording: () => Promise<string | null>;
  /** Apply a new audio effect while recording */
  applyEffect: (effect: AudioEffectOptions) => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  mediaStream: MediaStream | null;
  /** Current audio volume level (0-1) */
  currentVolume: number;
  /** Error encountered during recording (if any) */
  error: Error | null;
  /** Whether permission to record has been denied */
  isPermissionDenied: boolean;
  /** Information about browser compatibility */
  browserCompatibility: {
    isSupported: boolean;
    mediaRecorderSupported: boolean;
    getUserMediaSupported: boolean;
    audioContextSupported: boolean;
    isMobileBrowser: boolean;
  };
  /** Current audio effect being applied */
  currentEffect: AudioEffectOptions;
}

export default function useAudioRecorder(
  options: AudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const {
    audioConstraints = {},
    chunkInterval = 500,
    preferredMimeType,
    onNotSupported,
    audioBitsPerSecond,
    volumeMeterRefreshRate = 100,
    audioEffect,
  } = options;

  // Check browser compatibility
  const [browserCompatibility] = useState(() => ({
    isSupported: browserSupport.isAudioRecordingSupported(),
    mediaRecorderSupported: browserSupport.isMediaRecorderSupported(),
    getUserMediaSupported: browserSupport.isGetUserMediaSupported(),
    audioContextSupported: browserSupport.isAudioContextSupported(),
    isMobileBrowser: browserSupport.isMobileBrowser(),
  }));

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [currentEffect, setCurrentEffect] = useState<AudioEffectOptions>({
    type: AudioEffectType.None,
    mix: 0.5,
  });

  const audioChunksRef = useRef<Blob[]>([]);
  const pausedChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');
  const audioUrlRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeTimerRef = useRef<number | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Set initial effect from options if provided
  useEffect(() => {
    if (audioEffect) {
      setCurrentEffect(audioEffect);
    }
  }, [audioEffect]);

  // Check compatibility on mount and call onNotSupported if provided
  useEffect(() => {
    if (!browserCompatibility.isSupported && onNotSupported) {
      onNotSupported();
    }
  }, [browserCompatibility.isSupported, onNotSupported]);

  const cleanupAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const getSupportedMimeType = useCallback(() => {
    // Use our browser support utility to find the best supported MIME type
    if (preferredMimeType && browserSupport.isMimeTypeSupported(preferredMimeType)) {
      return preferredMimeType;
    }

    return browserSupport.getBestSupportedMimeType();
  }, [preferredMimeType]);

  const stopMediaStream = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setMediaStream(null);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      cleanupAudioUrl();
      setError(null);

      // Check if recording is supported using our utility
      if (!browserCompatibility.isSupported) {
        const error = new Error('Audio recording is not supported in this browser');
        setError(error);
        if (onNotSupported) {
          onNotSupported();
        } else {
          console.error(error.message);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices
          .getUserMedia({
            audio: { ...audioConstraints },
          })
          .catch(err => {
            // Handle permission denied
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              setIsPermissionDenied(true);
              throw new Error('Microphone permission denied');
            }
            throw err;
          });

        setMediaStream(stream);
        setIsPermissionDenied(false);

        // Set up volume metering using AudioContext
        try {
          // Create audio context
          const audioContext = new (window.AudioContext ||
            // @ts-expect-error - webkitAudioContext for Safari
            window.webkitAudioContext)();

          // Create analyzer
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;

          // Connect the microphone to the analyser
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          // Store references
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;

          // Start volume monitoring
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateVolume = () => {
            if (!analyser) return;

            analyser.getByteFrequencyData(dataArray);

            // Calculate volume
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }

            // Normalize volume (0-1)
            const average = sum / dataArray.length / 255;
            setCurrentVolume(average);

            // Schedule next update
            volumeTimerRef.current = window.setTimeout(updateVolume, volumeMeterRefreshRate);
          };

          // Start monitoring
          updateVolume();
        } catch (err) {
          console.warn('Volume metering not available:', err);
        }

        mimeTypeRef.current = getSupportedMimeType();
        const recorder = new MediaRecorder(stream, {
          mimeType: mimeTypeRef.current,
          audioBitsPerSecond,
        });
        setMediaRecorder(recorder);

        audioChunksRef.current = [];
        pausedChunksRef.current = [];

        recorder.ondataavailable = event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          if (audioChunksRef.current.length === 0 && pausedChunksRef.current.length === 0) {
            return;
          }

          const allChunks = [...pausedChunksRef.current, ...audioChunksRef.current];

          const audioBlob = new Blob(allChunks, {
            type: mimeTypeRef.current,
          });

          if (audioBlob.size === 0) {
            return;
          }

          stopMediaStream(stream);
        };

        recorder.onerror = () => {
          stopMediaStream(stream);
          setIsRecording(false);
          setIsPaused(false);
        };

        recorder.start(chunkInterval);
        setIsRecording(true);
        setIsPaused(false);

        if (timer) {
          clearInterval(timer);
        }

        const newTimer = setInterval(() => {
          setRecordingDuration(prevDuration => prevDuration + 1);
        }, 1000);

        setTimer(newTimer);
      } catch (error) {
        setIsRecording(false);
        setIsPaused(false);
        console.error('Error starting recording:', error);
      }
    } catch (error) {
      setIsRecording(false);
      setIsPaused(false);
      console.error('Error starting recording:', error);
    }
  }, [
    getSupportedMimeType,
    stopMediaStream,
    timer,
    cleanupAudioUrl,
    audioConstraints,
    chunkInterval,
    onNotSupported,
    volumeMeterRefreshRate,
  ]);

  // ... All other functions remain mostly the same
  const pauseRecording = useCallback(() => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive' || isPaused) {
      return;
    }

    pausedChunksRef.current = [...pausedChunksRef.current, ...audioChunksRef.current];
    audioChunksRef.current = [];

    mediaRecorder.pause();
    setIsPaused(true);

    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  }, [mediaRecorder, isPaused, timer]);

  const resumeRecording = useCallback(async () => {
    if (!mediaRecorder || mediaRecorder.state !== 'paused') {
      return;
    }

    mediaRecorder.resume();
    setIsPaused(false);

    if (!timer) {
      const newTimer = setInterval(() => {
        setRecordingDuration(prevDuration => prevDuration + 1);
      }, 1000);
      setTimer(newTimer);
    }
  }, [mediaRecorder, timer]);

  const createAudioBlob = useCallback(() => {
    // Check if we have audio chunks to work with
    if (audioChunksRef.current.length === 0 && pausedChunksRef.current.length === 0) {
      return null;
    }

    // If recording is still active, pause it to access the data safely
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.pause();
    }

    // Combine all audio chunks
    const allChunks = [...pausedChunksRef.current, ...audioChunksRef.current];

    // Checking for iOS support
    const isIOSDevice = browserSupport.isIOS();

    // For iOS devices, use mp4/aac format if possible which is better supported
    let blobType = mimeTypeRef.current;
    if (isIOSDevice && !blobType.includes('mp4') && !blobType.includes('aac')) {
      // Try to use mp4 if the recorded MIME type isn't already an iOS-friendly format
      if (browserSupport.isMimeTypeSupported('audio/mp4')) {
        blobType = 'audio/mp4';
      } else if (browserSupport.isMimeTypeSupported('audio/aac')) {
        blobType = 'audio/aac';
      }
    }

    // Create a blob from the chunks using the appropriate MIME type
    const audioBlob = new Blob(allChunks, {
      type: blobType,
    });

    // Ensure we have valid data
    if (audioBlob.size === 0) {
      return null;
    }

    return audioBlob;
  }, [mediaRecorder]);

  const playRecording = useCallback(async () => {
    cleanupAudioUrl();

    const audioBlob = createAudioBlob();
    if (!audioBlob) return null;

    const audioUrl = URL.createObjectURL(audioBlob);
    audioUrlRef.current = audioUrl;

    return audioUrl;
  }, [createAudioBlob, cleanupAudioUrl]);

  const saveRecording = useCallback(async () => {
    const audioBlob = createAudioBlob();
    if (!audioBlob) return null;

    const audioUrl = URL.createObjectURL(audioBlob);

    return { blob: audioBlob, url: audioUrl };
  }, [createAudioBlob]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      return;
    }

    mediaRecorder.stop();
    setIsRecording(false);
    setIsPaused(false);

    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }

    // Cleanup volume metering
    if (volumeTimerRef.current) {
      clearTimeout(volumeTimerRef.current);
      volumeTimerRef.current = null;
    }

    setCurrentVolume(0);
    setRecordingDuration(0);
  }, [mediaRecorder, timer]);

  const cancelRecording = useCallback(() => {
    mediaRecorder?.state !== 'inactive' && mediaRecorder?.stop();

    stopMediaStream(mediaStream);
    setIsRecording(false);
    setIsPaused(false);

    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }

    // Cleanup volume metering
    if (volumeTimerRef.current) {
      clearTimeout(volumeTimerRef.current);
      volumeTimerRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(e => {
        console.warn('Error closing AudioContext:', e);
      });
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    cleanupAudioUrl();

    setCurrentVolume(0);
    setRecordingDuration(0);
    audioChunksRef.current = [];
    pausedChunksRef.current = [];
  }, [mediaRecorder, mediaStream, stopMediaStream, timer, cleanupAudioUrl]);

  const applyEffect = useCallback(
    (effect: AudioEffectOptions) => {
      // Update current effect state
      setCurrentEffect(effect);

      // If not recording or no audio context, we can't apply effects
      if (!isRecording || !audioContextRef.current || !mediaSourceRef.current) {
        return;
      }

      try {
        // Disconnect any existing connections
        try {
          mediaSourceRef.current.disconnect();
        } catch (e) {
          // Ignore disconnection errors
        }

        // Apply the new effect
        if (audioContextRef.current && mediaSourceRef.current) {
          const { destination } = audioContextRef.current;
          applyAudioEffect(audioContextRef.current, mediaSourceRef.current, destination, effect);
        }
      } catch (err) {
        console.warn('Failed to apply audio effect:', err);
      }
    },
    [isRecording]
  );

  useEffect(() => {
    return () => {
      if (mediaRecorder?.state !== "inactive") {
        return;
      }
      if (timer) {
        clearInterval(timer);
      }

      // Cleanup volume metering on unmount
      if (volumeTimerRef.current) {
        clearTimeout(volumeTimerRef.current);
      }

      if (audioContextRef.current  && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(console.error);
      }

      stopMediaStream(mediaStream);
      cleanupAudioUrl();
    };
  }, [mediaStream, stopMediaStream, timer, cleanupAudioUrl]);

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    pauseRecording,
    resumeRecording,
    saveRecording,
    playRecording,
    applyEffect,
    isRecording,
    isPaused,
    recordingDuration,
    mediaStream,
    currentVolume,
    error,
    isPermissionDenied,
    browserCompatibility,
    currentEffect,
  };
}

// Re-export audio effects
export { AudioEffectType, type AudioEffectOptions } from './effects/audioEffects';
