# React Audio Recorder Hook Documentation

Welcome to the documentation for React Audio Recorder Hook, a TypeScript-based React hook that provides complete audio recording capabilities.

## Contents

- [Getting Started](./getting-started.md)
- [API Reference](./api-reference.md)
- [Examples](./examples.md)
- [Advanced Usage](./advanced-usage.md)
- [Troubleshooting](./troubleshooting.md)
- [Contributing](./contributing.md)

## About the Project

React Audio Recorder Hook is a powerful, lightweight solution for adding audio recording capabilities to your React applications. The hook provides a simple, intuitive API for recording, managing, and processing audio with minimal setup.

### Key Features

- Simple integration into React applications
- Full control over recording operations (start, stop, pause, resume, cancel)
- Customizable audio settings
- Recording management with automatic duration tracking
- Audio processing capabilities
- Comprehensive TypeScript support
- Compatible with all modern browsers supporting the MediaRecorder API

## Quick Start

```bash
npm install react-audio-recorder-hook
```

```jsx
import React from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function AudioRecorder() {
  const { startRecording, stopRecording, isRecording, recordingDuration } = useAudioRecorder();

  return (
    <div>
      <p>Recording: {isRecording ? 'Yes' : 'No'}</p>
      <p>Duration: {recordingDuration}s</p>

      {!isRecording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <button onClick={stopRecording}>Stop Recording</button>
      )}
    </div>
  );
}
```

For more information, check out the [getting started guide](./getting-started.md).
