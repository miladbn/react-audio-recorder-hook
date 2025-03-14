import { useState, useEffect, useRef, useCallback } from 'react';

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
}

export interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => Promise<void>;
  saveRecording: () => Promise<{ blob: Blob; url: string } | null>;
  playRecording: () => Promise<string | null>;
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  mediaStream: MediaStream | null;
}

export default function useAudioRecorder(
  options: AudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const { audioConstraints = {}, chunkInterval = 500, preferredMimeType, onNotSupported } = options;

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pausedChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm');
  const audioUrlRef = useRef<string | null>(null);

  const cleanupAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const getSupportedMimeType = useCallback(() => {
    if (preferredMimeType && MediaRecorder.isTypeSupported(preferredMimeType)) {
      return preferredMimeType;
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      return 'audio/ogg';
    } else if (MediaRecorder.isTypeSupported('audio/wav')) {
      return 'audio/wav';
    } else {
      return 'audio/webm';
    }
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
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (onNotSupported) {
          onNotSupported();
        } else {
          console.error('Your browser does not support audio recording.');
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { ...audioConstraints },
      });
      setMediaStream(stream);

      mimeTypeRef.current = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeTypeRef.current,
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
  }, [
    getSupportedMimeType,
    stopMediaStream,
    timer,
    cleanupAudioUrl,
    audioConstraints,
    chunkInterval,
    onNotSupported,
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

    // Create a blob from the chunks
    const audioBlob = new Blob(allChunks, {
      type: mimeTypeRef.current,
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

    cleanupAudioUrl();

    setRecordingDuration(0);
    audioChunksRef.current = [];
    pausedChunksRef.current = [];
  }, [mediaRecorder, mediaStream, stopMediaStream, timer, cleanupAudioUrl]);

  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
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
    isRecording,
    isPaused,
    recordingDuration,
    mediaStream,
  };
}
