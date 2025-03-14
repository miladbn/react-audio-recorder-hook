# Getting Started with React Audio Recorder Hook

This guide will help you integrate the React Audio Recorder Hook into your project and start using its features.

## Installation

You can install the package using npm or yarn:

```bash
# Using npm
npm install react-audio-recorder-hook

# Using yarn
yarn add react-audio-recorder-hook

# Using pnpm
pnpm add react-audio-recorder-hook
```

## Prerequisites

This hook requires:

- React 16.8.0 or higher (for Hooks support)
- A browser with MediaRecorder API support (most modern browsers)

## Basic Usage

Here's a simple example of how to use the hook:

```jsx
import React from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function BasicAudioRecorder() {
  const {
    startRecording,
    stopRecording,
    cancelRecording,
    saveRecording,
    isRecording,
    recordingDuration,
  } = useAudioRecorder();

  const handleSave = async () => {
    const recording = await saveRecording();
    if (recording) {
      console.log('Recording saved:', recording.blob);
      // You can now upload this blob to a server or do other processing
    }
  };

  return (
    <div>
      <div>Status: {isRecording ? 'Recording' : 'Not recording'}</div>
      <div>Duration: {recordingDuration} seconds</div>

      <div>
        <button onClick={startRecording} disabled={isRecording}>
          Start
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop
        </button>
        <button onClick={cancelRecording} disabled={!isRecording}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={isRecording || recordingDuration === 0}>
          Save
        </button>
      </div>
    </div>
  );
}

export default BasicAudioRecorder;
```

## Configuration Options

You can customize the behavior of the hook by passing options:

```jsx
const recorderOptions = {
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  chunkInterval: 1000, // milliseconds
  preferredMimeType: 'audio/webm',
  onNotSupported: () => {
    alert('Audio recording is not supported in this browser');
  },
};

const { startRecording, stopRecording /* ... */ } = useAudioRecorder(recorderOptions);
```

## Common Use Cases

### Playing Recorded Audio

```jsx
function PlayableAudioRecorder() {
  const { playRecording /* other functions */ } = useAudioRecorder();

  const handlePlay = async () => {
    const audioUrl = await playRecording();
    if (audioUrl) {
      // You can use this URL with an audio element
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div>
      {/* Other UI elements */}
      <button onClick={handlePlay}>Play Recording</button>
    </div>
  );
}
```

### Pause and Resume Recording

```jsx
function PausableAudioRecorder() {
  const {
    startRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    /* other functions */
  } = useAudioRecorder();

  return (
    <div>
      {!isRecording && <button onClick={startRecording}>Start</button>}

      {isRecording && !isPaused && <button onClick={pauseRecording}>Pause</button>}

      {isRecording && isPaused && <button onClick={resumeRecording}>Resume</button>}

      {/* Other UI elements */}
    </div>
  );
}
```

## Browser Compatibility

The hook relies on the [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder), which is supported in most modern browsers:

- Chrome 49+
- Firefox 25+
- Edge 79+
- Safari 14.1+
- Opera 36+

For browsers that don't support MediaRecorder, you can provide a fallback using the `onNotSupported` callback.

## Next Steps

Check out the [API Reference](./api-reference.md) for detailed information about all available options and methods, or see the [Examples](./examples.md) for more complex usage patterns.
