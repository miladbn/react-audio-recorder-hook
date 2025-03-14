/**
 * Mock implementations of browser compatibility detection functions for testing
 */
import { vi } from 'vitest';

/**
 * Mock: Check if MediaRecorder is supported in the current browser
 */
export const isMediaRecorderSupported = vi.fn().mockReturnValue(true);

/**
 * Mock: Check if getUserMedia is supported in the current browser
 */
export const isGetUserMediaSupported = vi.fn().mockReturnValue(true);

/**
 * Mock: Check if the AudioContext API is supported
 */
export const isAudioContextSupported = vi.fn().mockReturnValue(true);

/**
 * Mock: Check if the specified MIME type is supported for recording
 */
export const isMimeTypeSupported = vi.fn().mockReturnValue(true);

/**
 * Mock: Get the best supported MIME type for the current browser
 */
export const getBestSupportedMimeType = vi.fn().mockReturnValue('audio/webm;codecs=opus');

/**
 * Mock: Comprehensive check if audio recording is fully supported
 */
export const isAudioRecordingSupported = vi.fn().mockReturnValue(true);

/**
 * Mock: Check if the current browser is mobile
 */
export const isMobileBrowser = vi.fn().mockReturnValue(false);

export default {
  isMediaRecorderSupported,
  isGetUserMediaSupported,
  isAudioContextSupported,
  isMimeTypeSupported,
  getBestSupportedMimeType,
  isAudioRecordingSupported,
  isMobileBrowser,
};
