/**
 * Utility functions for browser compatibility detection
 */

/**
 * Check if MediaRecorder is supported in the current browser
 */
export function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && 'MediaRecorder' in window;
}

/**
 * Check if getUserMedia is supported in the current browser
 */
export function isGetUserMediaSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices
  );
}

/**
 * Check if the AudioContext API is supported
 */
export function isAudioContextSupported(): boolean {
  return (
    typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window)
  );
}

/**
 * Check if the specified MIME type is supported for recording
 */
export function isMimeTypeSupported(mimeType: string): boolean {
  if (!isMediaRecorderSupported()) {
    return false;
  }
  return MediaRecorder.isTypeSupported(mimeType);
}

/**
 * Get the best supported MIME type for the current browser
 */
export function getBestSupportedMimeType(): string {
  if (!isMediaRecorderSupported()) {
    return '';
  }

  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/wav',
  ];

  for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return 'audio/webm'; // Fallback
}

/**
 * Comprehensive check if audio recording is fully supported
 */
export function isAudioRecordingSupported(): boolean {
  return (
    isMediaRecorderSupported() &&
    isGetUserMediaSupported() &&
    isAudioContextSupported() &&
    getBestSupportedMimeType() !== ''
  );
}

/**
 * Check if the current browser is mobile
 */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default {
  isMediaRecorderSupported,
  isGetUserMediaSupported,
  isAudioContextSupported,
  isMimeTypeSupported,
  getBestSupportedMimeType,
  isAudioRecordingSupported,
  isMobileBrowser,
};
