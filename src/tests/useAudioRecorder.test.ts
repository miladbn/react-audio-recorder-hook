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
    // Mock URL.createObjectURL to return a predictable URL
    const mockUrl = 'mock-url-test';
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);

    const { result } = renderHook(() => useAudioRecorder());

    // Start and stop recording to add data
    await act(async () => {
      await result.current.startRecording();
    });

    // Ensure there's audio data
    await act(async () => {
      await result.current.stopRecording();
    });

    // Reset the mock to track new calls
    vi.mocked(URL.createObjectURL).mockClear();
    vi.mocked(URL.createObjectURL).mockReturnValue(mockUrl);

    let audioUrl: string | null = null;

    // Play the recording
    await act(async () => {
      audioUrl = await result.current.playRecording();
    });

    // Check that URL.createObjectURL was called and the URL was returned
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(audioUrl).toBe(mockUrl);
  });

  it('should track recording duration', async () => {
    // Reset real timers first to avoid interference
    vi.useRealTimers();

    // Mock setInterval to increment recordingDuration
    const originalSetInterval = global.setInterval;
    global.setInterval = vi.fn().mockImplementation((callback, ms) => {
      // Call callback immediately to increment counter
      callback();
      return 123 as unknown as NodeJS.Timeout;
    });

    // Mock clearInterval
    const originalClearInterval = global.clearInterval;
    global.clearInterval = vi.fn();

    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    // Should be greater than 0 because our mocked setInterval calls the callback immediately
    expect(result.current.recordingDuration).toBeGreaterThan(0);

    // Restore original timers
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
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
    // Create a temporary helper to trigger onNotSupported
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;

    // Mock getUserMedia to be undefined
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: undefined,
      configurable: true,
    });

    const onNotSupported = vi.fn();

    const { result } = renderHook(() => useAudioRecorder({ onNotSupported }));

    // Trigger startRecording which should call onNotSupported
    await act(async () => {
      await result.current.startRecording();
    });

    // Verify onNotSupported was called
    expect(onNotSupported).toHaveBeenCalled();

    // Restore the original getUserMedia
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: originalGetUserMedia,
      configurable: true,
    });
  });
});
