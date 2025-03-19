# React Audio Recorder Hook

A powerful, TypeScript-based React hook for recording, managing, and processing audio in web applications with minimal setup and maximum flexibility.

## Features

- **Simple Integration**: Add professional audio recording capabilities to your React app with just a few lines of code
- **Full Recording Control**: Start, stop, pause, resume, and cancel recordings with ease
- **Customizable Audio Settings**: Configure audio constraints, chunk intervals, and MIME types
- **Recording Management**: Track recording duration and state (recording/paused) automatically
- **Audio Processing**: Save recordings as blobs with URLs for immediate playback or download
- **TypeScript Support**: Fully typed API with comprehensive interfaces for type safety
- **Modern Browser Support**: Works across all major browsers that support the MediaRecorder API
- **Zero Dependencies**: Lightweight implementation built only on React hooks
- **Responsive Design**: Perfect for both desktop and mobile web applications
- **Audio Visualization**: Example component demonstrates how to add audio waveform visualization
- **Comprehensive Tests**: Complete test suite ensures reliability

## Support

If you find this package helpful, you can support its development by buying me a coffee:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/miladbn)

## Installation

```bash
npm install react-audio-recorder-hook
# or
yarn add react-audio-recorder-hook
```

## Documentation

For comprehensive documentation, see the following resources:

- [Getting Started Guide](./docs-src/getting-started.md)
- [API Reference](./docs-src/api-reference.md)
- [Examples](./docs-src/examples.md)
- [Advanced Usage](./docs-src/advanced-usage.md)
- [Troubleshooting](./docs-src/troubleshooting.md)
- [Contributing Guide](./docs-src/contributing.md)
- [Best Practices](./docs-src/best-practices.md)
- [Auto-publishing Guide](./docs-src/auto-publishing.md)

## Basic Usage

```jsx
import React from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function AudioRecorderComponent() {
  const {
    startRecording,
    stopRecording,
    cancelRecording,
    pauseRecording,
    resumeRecording,
    playRecording,
    saveRecording,
    isRecording,
    isPaused,
    recordingDuration,
  } = useAudioRecorder({
    audioConstraints: { echoCancellation: true },
  });

  const handlePlay = async () => {
    const audioUrl = await playRecording();
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const handleSave = async () => {
    const recording = await saveRecording();
    if (recording) {
      console.log('Recording saved:', recording.blob);
      // You can upload the blob or use it as needed
    }
  };

  return (
    <div>
      <div>
        Recording: {isRecording ? 'Yes' : 'No'}
        {isPaused && ' (Paused)'}
      </div>
      <div>Duration: {recordingDuration}s</div>

      <div>
        {!isRecording && <button onClick={startRecording}>Start Recording</button>}

        {isRecording && !isPaused && <button onClick={pauseRecording}>Pause</button>}

        {isRecording && isPaused && <button onClick={resumeRecording}>Resume</button>}

        {isRecording && <button onClick={stopRecording}>Stop</button>}

        {isRecording && <button onClick={cancelRecording}>Cancel</button>}

        <button onClick={handlePlay}>Play</button>
        <button onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}
```

## API Overview

### useAudioRecorder(options)

#### Options

- `audioConstraints`: MediaTrackConstraints - Audio constraints to pass to getUserMedia
- `chunkInterval`: number - Recording data chunk interval in milliseconds (default: 500)
- `preferredMimeType`: string - Custom MIME type to use if supported
- `onNotSupported`: () => void - Called when recording is unsupported on the browser

#### Returns

An object with the following properties:

- `startRecording`: () => Promise<void> - Starts recording audio
- `stopRecording`: () => Promise<void> - Stops the current recording
- `cancelRecording`: () => void - Cancels the current recording
- `pauseRecording`: () => void - Pauses the current recording
- `resumeRecording`: () => Promise<void> - Resumes a paused recording
- `saveRecording`: () => Promise<{ blob: Blob; url: string } | null> - Creates a blob and URL for the recording
- `playRecording`: () => Promise<string | null> - Creates a URL for the recording that can be used with Audio
- `isRecording`: boolean - Whether recording is in progress
- `isPaused`: boolean - Whether recording is paused
- `recordingDuration`: number - Current recording duration in seconds
- `mediaStream`: MediaStream | null - The current media stream

## Advanced Usage Examples

### Audio Recorder with Visualization

This package includes an example component that demonstrates how to implement audio waveform visualization with the hook:

```jsx
import { AudioRecorderWithVisualization } from 'react-audio-recorder-hook/examples';

function App() {
  return (
    <div className="app">
      <h1>Audio Recorder with Visualization</h1>
      <AudioRecorderWithVisualization
        width={500}
        height={100}
        backgroundColor="#f0f0f0"
        barColor="#3a86ff"
      />
    </div>
  );
}
```

## Testing

The package includes a comprehensive test suite that ensures all functionality works as expected. All tests are now passing.

```bash
# Run the test suite
pnpm test

# Generate test coverage report
pnpm test:coverage
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./docs-src/contributing.md) for details on how to submit pull requests, report issues, and suggest enhancements.

## Roadmap

See our [improvements document](./src/tests/IMPROVEMENTS.md) for planned enhancements and future features.

## License

MIT
