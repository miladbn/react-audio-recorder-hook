# Advanced Usage

This section covers more advanced usage patterns for the React Audio Recorder Hook.

## Audio Recorder with Visualization

The package includes a ready-to-use component with audio visualization capabilities:

```jsx
import React from 'react';
import { AudioRecorderWithVisualization } from 'react-audio-recorder-hook/examples';

function App() {
  return (
    <div>
      <h1>Audio Recorder</h1>
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

### Props

The `AudioRecorderWithVisualization` component accepts the following props:

| Prop              | Type   | Default   | Description                                  |
| ----------------- | ------ | --------- | -------------------------------------------- |
| `width`           | number | 300       | Width of the visualization canvas in pixels  |
| `height`          | number | 60        | Height of the visualization canvas in pixels |
| `backgroundColor` | string | '#f5f5f5' | Background color of the visualization        |
| `barColor`        | string | '#4a9fff' | Color of the visualization bars              |
| `className`       | string | undefined | CSS class name to apply to the container     |

## Custom Audio Processing

You can perform custom processing on the audio blob before saving or uploading it.

```jsx
import React, { useState } from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function AudioProcessingExample() {
  const [processedUrl, setProcessedUrl] = useState(null);
  const { startRecording, stopRecording, saveRecording } = useAudioRecorder();

  const processAudio = async () => {
    const recording = await saveRecording();
    if (!recording) return;

    // Convert to ArrayBuffer for processing
    const arrayBuffer = await recording.blob.arrayBuffer();

    // Here you could perform custom processing on the ArrayBuffer
    // This is just a placeholder for your actual processing logic
    const processedBuffer = await applyCustomProcessing(arrayBuffer);

    // Convert back to Blob
    const processedBlob = new Blob([processedBuffer], { type: recording.blob.type });

    // Create URL for the processed blob
    const url = URL.createObjectURL(processedBlob);
    setProcessedUrl(url);
  };

  // Placeholder for your custom processing function
  const applyCustomProcessing = async arrayBuffer => {
    // In a real application, you would apply audio effects, filtering, etc.
    // For this example, we're just returning the original buffer
    return arrayBuffer;
  };

  return (
    <div>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>
      <button onClick={processAudio}>Process Audio</button>

      {processedUrl && <audio src={processedUrl} controls />}
    </div>
  );
}
```

## Working with Web Audio API

You can integrate the hook with the Web Audio API for more advanced audio analysis and manipulation.

```jsx
import React, { useRef, useEffect, useState } from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function WebAudioExample() {
  const { startRecording, stopRecording, mediaStream, isRecording } = useAudioRecorder();
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const [lowFrequency, setLowFrequency] = useState(0);
  const [midFrequency, setMidFrequency] = useState(0);
  const [highFrequency, setHighFrequency] = useState(0);

  // Set up Web Audio API when recording starts
  useEffect(() => {
    if (isRecording && mediaStream) {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Connect media stream to analyser
      sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream);
      sourceRef.current.connect(analyserRef.current);

      // Start frequency analysis
      const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);

      const analyzeFrequencies = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(frequencyData);

        // Calculate averages for low, mid, and high frequencies
        // This is a simplified division - in a real app you might use more precise ranges
        const bins = analyserRef.current.frequencyBinCount;
        const lowBins = Math.floor(bins / 3);
        const midBins = Math.floor(bins / 3);
        const highBins = bins - lowBins - midBins;

        let lowSum = 0;
        for (let i = 0; i < lowBins; i++) {
          lowSum += frequencyData[i];
        }

        let midSum = 0;
        for (let i = lowBins; i < lowBins + midBins; i++) {
          midSum += frequencyData[i];
        }

        let highSum = 0;
        for (let i = lowBins + midBins; i < bins; i++) {
          highSum += frequencyData[i];
        }

        setLowFrequency(Math.round(lowSum / lowBins));
        setMidFrequency(Math.round(midSum / midBins));
        setHighFrequency(Math.round(highSum / highBins));

        requestAnimationFrame(analyzeFrequencies);
      };

      analyzeFrequencies();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
      }
    };
  }, [isRecording, mediaStream]);

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>

      {isRecording && (
        <div>
          <h3>Frequency Analysis</h3>
          <div>
            <label>Low Frequencies: </label>
            <div
              style={{
                width: `${lowFrequency}px`,
                height: '20px',
                backgroundColor: 'blue',
                maxWidth: '100%',
              }}
            />
          </div>
          <div>
            <label>Mid Frequencies: </label>
            <div
              style={{
                width: `${midFrequency}px`,
                height: '20px',
                backgroundColor: 'green',
                maxWidth: '100%',
              }}
            />
          </div>
          <div>
            <label>High Frequencies: </label>
            <div
              style={{
                width: `${highFrequency}px`,
                height: '20px',
                backgroundColor: 'red',
                maxWidth: '100%',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## Creating Multi-Track Recorder

You can use multiple instances of the hook to create a multi-track recorder:

```jsx
import React, { useState } from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function MultiTrackRecorder() {
  const [tracks, setTracks] = useState([]);
  const [isCreatingTrack, setIsCreatingTrack] = useState(false);

  const { startRecording, stopRecording, saveRecording, isRecording, recordingDuration } =
    useAudioRecorder();

  const addTrack = async () => {
    setIsCreatingTrack(true);
    await startRecording();
  };

  const finishTrack = async () => {
    await stopRecording();
    const recording = await saveRecording();

    if (recording) {
      setTracks([
        ...tracks,
        {
          id: Date.now(),
          url: recording.url,
          blob: recording.blob,
          duration: recordingDuration,
        },
      ]);
    }

    setIsCreatingTrack(false);
  };

  const removeTrack = trackId => {
    setTracks(tracks.filter(track => track.id !== trackId));
  };

  return (
    <div>
      <h2>Multi-Track Recorder</h2>

      <div style={{ marginBottom: '20px' }}>
        {!isCreatingTrack ? (
          <button onClick={addTrack}>Add New Track</button>
        ) : (
          <div>
            <div>Recording... {recordingDuration.toFixed(1)}s</div>
            <button onClick={finishTrack}>Finish Track</button>
          </div>
        )}
      </div>

      <div>
        <h3>Tracks:</h3>
        {tracks.length === 0 && <p>No tracks yet. Record something!</p>}

        {tracks.map(track => (
          <div
            key={track.id}
            style={{
              marginBottom: '10px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          >
            <div>
              Track {track.id} - {track.duration.toFixed(1)}s
            </div>
            <audio src={track.url} controls style={{ width: '100%' }} />
            <button onClick={() => removeTrack(track.id)}>Remove Track</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Performance Considerations

When working with audio recording, especially in long sessions, consider the following performance tips:

1. **Memory Management**: Long recordings can consume significant memory. Consider:

   - Breaking long recordings into chunks
   - Implementing a maximum recording duration
   - Releasing unused resources (URLs, streams) with cleanup functions

2. **Browser Limitations**: Different browsers have different limitations:

   - Mobile browsers may have stricter memory constraints
   - Some browsers limit the maximum recording time
   - Older browsers may have less efficient implementations

3. **Background Processing**: Use Web Workers for computationally intensive tasks:

   - Audio processing
   - Analysis
   - Encoding/decoding

4. **Stream Handling**: Properly clean up streams when they're no longer needed:
   ```javascript
   useEffect(() => {
     // Cleanup function
     return () => {
       if (mediaStream) {
         mediaStream.getTracks().forEach(track => track.stop());
       }
     };
   }, [mediaStream]);
   ```
