// Mock MediaRecorder API and other browser features
import { vi } from 'vitest';

// Create a global MediaRecorder mock
class MockMediaRecorder {
  // Make sure isTypeSupported is properly defined as a static method
  static isTypeSupported = vi.fn().mockReturnValue(true);

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

  start(chunkInterval?: number) {
    this.state = 'recording';
    if (this.onstart) this.onstart();

    // Make the mock recorder always have data
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

  constructor(tracks?: MediaStreamTrack[]) {
    this.id = Math.random().toString(36).substring(2, 15);
  }

  getAudioTracks() {
    return [{ enabled: true, stop: () => {} }];
  }

  getTracks() {
    return this.getAudioTracks();
  }
}

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn((blob: Blob) => {
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

// Mock getUserMedia using Object.defineProperty to avoid the read-only error
const mockGetUserMedia = vi.fn().mockImplementation(async (constraints: MediaStreamConstraints) => {
  return new MockMediaStream();
});

// Fix for readonly mediaDevices property
if (!global.navigator.mediaDevices) {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
  });
} else {
  global.navigator.mediaDevices.getUserMedia = mockGetUserMedia;
}

// Store the original MediaRecorder for restoring after tests
vi.stubGlobal('__OriginalMediaRecorder', OriginalMediaRecorder);
