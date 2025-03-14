import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import useAudioRecorder from '../index';

// Define the RecordingResult type to match the hook's return value
interface RecordingResult {
  blob: Blob;
  url: string;
}

describe('useAudioRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAudioRecorder());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.recordingDuration).toBe(0);
    expect(result.current.mediaStream).toBe(null);
  });

  it('should start recording when startRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.mediaStream).not.toBeNull();
  });

  it('should stop recording when stopRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
  });

  it('should cancel recording when cancelRecording is called', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
      result.current.cancelRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingDuration).toBe(0);
  });

  it('should pause and resume recording', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
      result.current.pauseRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(result.current.isPaused).toBe(true);

    await act(async () => {
      await result.current.resumeRecording();
    });

    expect(result.current.isPaused).toBe(false);
  });

  it('should save recording and return blob and URL', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });

    let savedRecording: RecordingResult | null = null;

    await act(async () => {
      savedRecording = await result.current.saveRecording();
    });

    expect(savedRecording).not.toBeNull();
  });

  it('should play recording and return URL', async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });

    let audioUrl: string | null = null;

    await act(async () => {
      audioUrl = await result.current.playRecording();
    });

    expect(audioUrl).not.toBeNull();
    expect(typeof audioUrl).toBe('string');
    expect(audioUrl).toContain('mock-url-');
  });

  it('should track recording duration', async () => {
    // Mock timers
    vi.useFakeTimers();

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    // Fast-forward 2 seconds
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.recordingDuration).toBeGreaterThan(0);

    // Restore timers
    vi.useRealTimers();
  });

  it('should handle custom audio constraints', async () => {
    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
    };

    const { result } = renderHook(() => useAudioRecorder({ audioConstraints }));

    await act(async () => {
      await result.current.startRecording();
    });

    // Check if getUserMedia was called with the correct constraints
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: audioConstraints,
    });
  });

  it('should handle custom MIME type if supported', async () => {
    const preferredMimeType = 'audio/mp4';
    const isTypeSupported = vi.spyOn(MediaRecorder, 'isTypeSupported').mockReturnValue(true);

    const { result } = renderHook(() => useAudioRecorder({ preferredMimeType }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(isTypeSupported).toHaveBeenCalledWith(preferredMimeType);
  });

  it('should call onNotSupported callback if recording is not supported', async () => {
    // Mock MediaRecorder to be undefined
    const originalMediaRecorder = global.MediaRecorder;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.MediaRecorder = undefined as any;

    const onNotSupported = vi.fn();

    renderHook(() => useAudioRecorder({ onNotSupported }));

    expect(onNotSupported).toHaveBeenCalled();

    // Restore MediaRecorder
    global.MediaRecorder = originalMediaRecorder;
  });
});
