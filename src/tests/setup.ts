// Mock MediaRecorder API and other browser features
import { vi, beforeEach, afterEach } from 'vitest';
// Import our mock implementation
import mockBrowserSupport from './__mocks__/browserSupport';

// Set up the mock for the browserSupport module
vi.mock('../utils/browserSupport', () => {
  return {
    default: mockBrowserSupport,
    // Also export individual functions
    ...mockBrowserSupport,
  };
});

// Create a global MediaRecorder mock
class MockMediaRecorder {
  // Make sure isTypeSupported is properly defined as a static method
  static isTypeSupported = vi.fn().mockImplementation(_mimeType => {
    return true;
  });

  ondataavailable: ((event: any) => void) | null = null;
  onstart: (() => void) | null = null;
  onstop: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onresume: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  stream: MediaStream;
  mimeType: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    this.stream = stream;
    this.mimeType = options?.mimeType ?? 'audio/webm';
    this.audioBitsPerSecond = options?.audioBitsPerSecond;
    this.videoBitsPerSecond = options?.videoBitsPerSecond;
    this.bitsPerSecond = options?.bitsPerSecond;
  }

  start(_chunkInterval?: number) {
    this.state = 'recording';

    // Call onstart synchronously to ensure it's called before test assertions
    if (this.onstart) this.onstart();

    // Simulate data being available immediately for tests
    if (this.ondataavailable) {
      const blob = new Blob(['test-audio-data'], { type: this.mimeType });
      this.ondataavailable({ data: blob });
    }
  }

  stop() {
    this.state = 'inactive';

    // Always have final data when stopped
    if (this.ondataavailable) {
      const blob = new Blob(['test-audio-data-final'], { type: this.mimeType });
      this.ondataavailable({ data: blob });
    }

    // Call onstop immediately
    if (this.onstop) this.onstop();
  }

  pause() {
    this.state = 'paused';
    if (this.onpause) this.onpause();
  }

  resume() {
    this.state = 'recording';
    if (this.onresume) this.onresume();
  }
}

// Create a global MediaStream mock
class MockMediaStream {
  id: string;
  active: boolean = true;
  tracks: Array<any> = [];

  constructor(tracks?: MediaStreamTrack[]) {
    this.id = Math.random().toString(36).substring(2, 15);
    this.tracks = tracks ?? [{ enabled: true, stop: vi.fn() }];
  }

  getAudioTracks() {
    return this.tracks;
  }

  getTracks() {
    return this.getAudioTracks();
  }
}

// Mock AudioContext and related APIs
class MockAnalyser {
  frequencyBinCount = 128;
  fftSize = 256;
  smoothingTimeConstant = 0.8;

  connect() {}
  disconnect() {}
  getByteFrequencyData(array: Uint8Array) {
    // Fill with random data between 0-255
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
}

class MockAudioContext {
  destination = {};
  sampleRate = 44100;

  createAnalyser() {
    return new MockAnalyser();
  }

  createMediaStreamSource() {
    return {
      connect: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn(),
    };
  }

  createConvolver() {
    return {
      buffer: null,
      connect: vi.fn(),
    };
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length),
    };
  }

  createDelay() {
    return {
      delayTime: { value: 0 },
      connect: vi.fn(),
    };
  }

  createWaveShaper() {
    return {
      curve: null,
      oversample: '4x',
      connect: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
    };
  }
}

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn().mockImplementation((_blob: Blob) => {
  return `mock-url-${Math.random().toString(36).substring(2, 9)}`;
});

// Mock URL.revokeObjectURL
const mockRevokeObjectURL = vi.fn();

// Save original MediaRecorder for tests that need to modify it
const OriginalMediaRecorder = MockMediaRecorder;

// Assign mocks to the global object
global.MediaRecorder = MockMediaRecorder as any;
global.MediaStream = MockMediaStream as any;
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;
global.AudioContext = MockAudioContext as any;
// For Safari support
global.webkitAudioContext = MockAudioContext as any;

// Mock browser support utilities that the hook might use
// Use Object.defineProperty to handle read-only mediaDevices
const mockGetUserMedia = vi
  .fn()
  .mockImplementation(async (_constraints: MediaStreamConstraints) => {
    return new MockMediaStream();
  });

// Set up mock for mediaDevices
if (!global.navigator.mediaDevices) {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    configurable: true,
  });
} else {
  // If mediaDevices already exists, just mock the getUserMedia method
  Object.defineProperty(global.navigator.mediaDevices, 'getUserMedia', {
    value: mockGetUserMedia,
    configurable: true,
  });
}

// Explicitly set the browser support variables
const browserSupport = {
  isAudioRecordingSupported: vi.fn().mockReturnValue(true),
  isMediaRecorderSupported: vi.fn().mockReturnValue(true),
  isGetUserMediaSupported: vi.fn().mockReturnValue(true),
  isAudioContextSupported: vi.fn().mockReturnValue(true),
  isMobileBrowser: vi.fn().mockReturnValue(false),
  isMimeTypeSupported: vi.fn().mockReturnValue(true),
  getBestSupportedMimeType: vi.fn().mockReturnValue('audio/webm'),
};

vi.mock('../utils/browserSupport', () => {
  return {
    default: browserSupport,
  };
});

// Set up interval mocking
beforeEach(() => {
  vi.useFakeTimers();

  // Mock setInterval to call callback immediately for duration tracking tests
  const _originalSetInterval = global.setInterval;
  vi.spyOn(global, 'setInterval').mockImplementation(
    (callback: () => void, _ms?: number, ..._args: unknown[]) => {
      callback();
      return 123 as unknown as NodeJS.Timeout;
    }
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// Store the original MediaRecorder for restoring after tests
vi.stubGlobal('__OriginalMediaRecorder', OriginalMediaRecorder);
