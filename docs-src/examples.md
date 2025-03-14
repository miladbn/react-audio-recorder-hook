# Examples

This section contains various examples showcasing different ways to use the React Audio Recorder Hook.

## Basic Audio Recorder

A simple component that enables recording, stopping, and playing audio.

```jsx
import React, { useState } from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function BasicRecorder() {
  const [audioUrl, setAudioUrl] = useState(null);
  const { startRecording, stopRecording, isRecording, recordingDuration } = useAudioRecorder();

  const handleStop = async () => {
    await stopRecording();
    const url = await playRecording();
    setAudioUrl(url);
  };

  return (
    <div className="recorder">
      <div className="status">{isRecording ? 'Recording...' : 'Not Recording'}</div>
      <div className="duration">Duration: {recordingDuration.toFixed(1)}s</div>

      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={handleStop}>Stop Recording</button>
        )}
      </div>

      {audioUrl && (
        <div className="player">
          <audio src={audioUrl} controls />
        </div>
      )}
    </div>
  );
}
```

## Recorder with Pause/Resume

A more advanced recorder with pause and resume capabilities.

```jsx
import React, { useState } from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function PausableRecorder() {
  const [audioUrl, setAudioUrl] = useState(null);
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    isRecording,
    isPaused,
    recordingDuration,
  } = useAudioRecorder();

  const handleStop = async () => {
    await stopRecording();
    const url = await playRecording();
    setAudioUrl(url);
  };

  return (
    <div className="recorder">
      <div className="status">
        {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Not Recording'}
      </div>
      <div className="duration">Duration: {recordingDuration.toFixed(1)}s</div>

      <div className="controls">
        {!isRecording && <button onClick={startRecording}>Start</button>}

        {isRecording && !isPaused && <button onClick={pauseRecording}>Pause</button>}

        {isRecording && isPaused && <button onClick={resumeRecording}>Resume</button>}

        {isRecording && (
          <>
            <button onClick={handleStop}>Stop</button>
            <button onClick={cancelRecording}>Cancel</button>
          </>
        )}
      </div>

      {audioUrl && (
        <div className="player">
          <audio src={audioUrl} controls />
        </div>
      )}
    </div>
  );
}
```

## Audio Recorder with Waveform Visualization

A more advanced example that includes real-time waveform visualization during recording.

```jsx
import React, { useRef, useEffect, useState } from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function VisualizerRecorder() {
  const canvasRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const { startRecording, stopRecording, isRecording, recordingDuration, mediaStream } =
    useAudioRecorder();

  const handleStop = async () => {
    await stopRecording();
    const url = await playRecording();
    setAudioUrl(url);
  };

  // Visualization logic
  useEffect(() => {
    let animationId;
    let audioContext;
    let analyser;
    let dataArray;

    if (isRecording && mediaStream && canvasRef.current) {
      // Set up audio context and analyser
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      // Connect the stream to the analyser
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      // Get a canvas context for drawing
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      // Draw function for the visualization
      const draw = () => {
        animationId = requestAnimationFrame(draw);

        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(200, 200, 200)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      };

      draw();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isRecording, mediaStream]);

  return (
    <div className="recorder">
      <div className="status">{isRecording ? 'Recording...' : 'Not Recording'}</div>
      <div className="duration">Duration: {recordingDuration.toFixed(1)}s</div>

      <canvas
        ref={canvasRef}
        width="300"
        height="100"
        style={{
          border: '1px solid #000',
          backgroundColor: '#f0f0f0',
        }}
      />

      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={handleStop}>Stop Recording</button>
        )}
      </div>

      {audioUrl && (
        <div className="player">
          <audio src={audioUrl} controls />
        </div>
      )}
    </div>
  );
}
```

## Audio Recorder with Upload

An example that uploads the recorded audio to a server.

```jsx
import React, { useState } from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function UploadRecorder() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { startRecording, stopRecording, saveRecording, isRecording, recordingDuration } =
    useAudioRecorder();

  const handleStop = async () => {
    await stopRecording();
  };

  const handleUpload = async () => {
    const recording = await saveRecording();
    if (!recording) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('audio', recording.blob, 'recording.webm');

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://your-api-endpoint.com/upload');

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadSuccess(true);
        } else {
          console.error('Upload failed');
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        console.error('Upload error');
        setIsUploading(false);
      };

      xhr.send(formData);
    } catch (error) {
      console.error('Error uploading recording:', error);
      setIsUploading(false);
    }
  };

  return (
    <div className="recorder">
      <div className="status">{isRecording ? 'Recording...' : 'Not Recording'}</div>
      <div className="duration">Duration: {recordingDuration.toFixed(1)}s</div>

      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording} disabled={isUploading}>
            Start Recording
          </button>
        ) : (
          <button onClick={handleStop}>Stop Recording</button>
        )}

        {!isRecording && recordingDuration > 0 && (
          <button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? `Uploading (${uploadProgress}%)` : 'Upload Recording'}
          </button>
        )}
      </div>

      {uploadSuccess && <div className="success-message">Recording uploaded successfully!</div>}
    </div>
  );
}
```

## Custom Audio Format Recorder

An example that uses a specific audio format (if supported).

```jsx
import React, { useState } from 'react';
import useAudioRecorder from 'react-audio-recorder-hook';

function CustomFormatRecorder() {
  const [audioUrl, setAudioUrl] = useState(null);
  const [formatSupported, setFormatSupported] = useState(true);

  const { startRecording, stopRecording, isRecording, recordingDuration } = useAudioRecorder({
    preferredMimeType: 'audio/mp4',
    onNotSupported: () => {
      setFormatSupported(false);
      alert('The preferred audio format is not supported on this browser');
    },
  });

  const handleStop = async () => {
    await stopRecording();
    const url = await playRecording();
    setAudioUrl(url);
  };

  return (
    <div className="recorder">
      <div className="status">{isRecording ? 'Recording...' : 'Not Recording'}</div>
      <div className="duration">Duration: {recordingDuration.toFixed(1)}s</div>

      {!formatSupported && (
        <div className="warning">MP4 format not supported. Using browser default format.</div>
      )}

      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={handleStop}>Stop Recording</button>
        )}
      </div>

      {audioUrl && (
        <div className="player">
          <audio src={audioUrl} controls />
        </div>
      )}
    </div>
  );
}
```

For a more advanced visualization example, check out the included [AudioRecorderWithVisualization](./advanced-usage.md#audio-recorder-with-visualization) component that comes with this package.
