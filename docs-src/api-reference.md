# API Reference

This document provides detailed information about the React Audio Recorder Hook API.

## useAudioRecorder

```typescript
function useAudioRecorder(options?: AudioRecorderOptions): UseAudioRecorderReturn;
```

The main hook function that provides audio recording capabilities.

### Parameters

#### `options` (optional)

An object containing configuration options for the audio recorder.

```typescript
interface AudioRecorderOptions {
  /** Audio constraints to pass to getUserMedia */
  audioConstraints?: MediaTrackConstraints;
  /** Recording data chunk interval in milliseconds (default: 500) */
  chunkInterval?: number;
  /** Custom MIME type to use if supported */
  preferredMimeType?: string;
  /** Called when recording is unsupported on the browser */
  onNotSupported?: () => void;
}
```

##### audioConstraints

Optional media track constraints for the audio. Passed directly to `getUserMedia`.

Example:

```typescript
{
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
}
```

See [MediaTrackConstraints](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints) for all available options.

##### chunkInterval

The time interval in milliseconds at which the recorder will capture data chunks. Default is 500ms.

##### preferredMimeType

The preferred MIME type for audio recording. Will fallback to browser defaults if not supported.

Common values:

- `'audio/webm'`
- `'audio/ogg'`
- `'audio/mp4'`

##### onNotSupported

A callback function that is called when the MediaRecorder API is not supported by the browser.

### Return Value

The hook returns an object with the following properties and methods:

```typescript
interface UseAudioRecorderReturn {
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
```

#### Methods

##### startRecording

```typescript
startRecording: () => Promise<void>;
```

Starts recording audio. This will request microphone permissions if they haven't been granted yet.

##### stopRecording

```typescript
stopRecording: () => Promise<void>;
```

Stops the current recording session and finalizes the recording.

##### cancelRecording

```typescript
cancelRecording: () => void
```

Cancels the current recording session and discards the recorded data.

##### pauseRecording

```typescript
pauseRecording: () => void
```

Pauses the current recording session. Can be resumed later.

##### resumeRecording

```typescript
resumeRecording: () => Promise<void>;
```

Resumes a previously paused recording session.

##### saveRecording

```typescript
saveRecording: () => Promise<{ blob: Blob; url: string } | null>;
```

Creates a Blob containing the recording data and a URL that can be used to access it.

Returns:

- `blob`: The Blob object containing the audio data
- `url`: A URL that can be used with audio elements or for downloading

Returns `null` if there is no recording data.

##### playRecording

```typescript
playRecording: () => Promise<string | null>;
```

Creates a URL for the recording that can be used with the Audio API.

Returns the URL as a string, or `null` if there is no recording data.

#### Properties

##### isRecording

```typescript
isRecording: boolean;
```

A boolean indicating whether recording is currently in progress.

##### isPaused

```typescript
isPaused: boolean;
```

A boolean indicating whether the recording is currently paused.

##### recordingDuration

```typescript
recordingDuration: number;
```

The duration of the current recording in seconds.

##### mediaStream

```typescript
mediaStream: MediaStream | null;
```

The current media stream being recorded, or `null` if no recording is in progress.

## Examples

### Basic Usage

```jsx
const { startRecording, stopRecording, isRecording } = useAudioRecorder();

// Start recording
await startRecording();

// Stop recording
await stopRecording();

// Check if recording
console.log(`Recording: ${isRecording}`);
```

### Recording with Custom Options

```jsx
const { startRecording } = useAudioRecorder({
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
  },
  preferredMimeType: 'audio/mp4',
  onNotSupported: () => {
    console.error('Audio recording not supported in this browser');
  },
});
```

### Saving and Processing a Recording

```jsx
const { startRecording, stopRecording, saveRecording } = useAudioRecorder();

// Start and then stop recording
await startRecording();
await stopRecording();

// Save the recording
const recording = await saveRecording();
if (recording) {
  // Use the blob and URL
  const { blob, url } = recording;

  // Example: Create a download link
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recording.webm';
  a.click();

  // Example: Upload to a server
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  await fetch('/upload', {
    method: 'POST',
    body: formData,
  });
}
```

For more complex examples, see the [Examples](./examples.md) section.
