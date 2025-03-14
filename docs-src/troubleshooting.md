# Troubleshooting

This guide addresses common issues you might encounter when using the React Audio Recorder Hook.

## Permission Issues

### User Denied Microphone Access

**Symptom**: The recording doesn't start and you get a permission error.

**Solution**:

1. Check if the user has denied microphone permissions
2. Provide clear instructions on why your app needs microphone access
3. Guide users on how to reset permissions in their browser settings

```jsx
const { startRecording } = useAudioRecorder();

const handleStartRecording = async () => {
  try {
    await startRecording();
  } catch (error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      alert(
        'Microphone access is required for recording. Please enable it in your browser settings.'
      );

      // Show instructions for the user's specific browser
      showBrowserSpecificPermissionInstructions();
    } else {
      console.error('Error starting recording:', error);
    }
  }
};
```

### Automatic Permission Requests Blocked

**Symptom**: The browser doesn't show the permission dialog when attempting to record.

**Solution**:

1. Only request permissions in response to a user action (e.g., button click)
2. Make sure the request happens in the same call stack as the user action
3. Check if the site is being loaded over HTTPS (required for getUserMedia)

## Browser Compatibility Issues

### MediaRecorder Not Supported

**Symptom**: Recording doesn't work on certain browsers.

**Solution**:

1. Use the `onNotSupported` callback to detect unsupported browsers
2. Provide a fallback experience or clear error message

```jsx
const { startRecording } = useAudioRecorder({
  onNotSupported: () => {
    setIsSupported(false);
    alert('Audio recording is not supported in your browser. Please try Chrome, Firefox, or Edge.');
  },
});

// In your render function
if (!isSupported) {
  return <div className="error">Your browser doesn't support audio recording.</div>;
}
```

### MIME Type Not Supported

**Symptom**: Specified MIME type doesn't work in certain browsers.

**Solution**:

1. Check browser support before specifying a MIME type
2. Provide fallbacks

```jsx
// Helper function to check MIME type support
const getSupportedMimeType = () => {
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  }
  if (MediaRecorder.isTypeSupported('audio/mp4')) {
    return 'audio/mp4';
  }
  return 'audio/webm'; // Default fallback
};

// Use the function with the hook
const { startRecording } = useAudioRecorder({
  preferredMimeType: getSupportedMimeType(),
});
```

## Playback Issues

### Audio Not Playing After Recording

**Symptom**: Recording seems to work, but playback doesn't produce sound.

**Solutions**:

1. Check if the audio element is properly connected to the audio URL
2. Verify that the recording was successful and contains actual audio data
3. Check if the audio format is supported by the browser

```jsx
const handlePlay = async () => {
  const audioUrl = await playRecording();

  if (audioUrl) {
    // Create new audio element to ensure it's fresh
    const audio = new Audio(audioUrl);

    // Add error handling
    audio.onerror = e => {
      console.error('Audio playback error:', e);
      alert('Error playing the audio. The format might not be supported.');
    };

    // Force a play attempt and catch any errors
    try {
      await audio.play();
    } catch (error) {
      console.error('Play failed:', error);
      alert('Playback failed. This might be due to a browser restriction or format issue.');
    }
  } else {
    alert('No recording available to play.');
  }
};
```

### Audio Is Too Quiet

**Symptom**: Recorded audio is audible but very quiet.

**Solution**:

1. Check microphone settings in the operating system
2. Consider adding gain control to the audio constraints

```jsx
const { startRecording } = useAudioRecorder({
  audioConstraints: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true, // Enable automatic gain control
  },
});
```

## Memory and Performance Issues

### Long Recordings Cause Memory Problems

**Symptom**: Browser becomes unresponsive or crashes during long recordings.

**Solutions**:

1. Implement recording time limits
2. Break recordings into chunks
3. Clean up unused resources

```jsx
// Example of implementing a time limit
const MAX_RECORDING_TIME = 300; // 5 minutes in seconds

function TimeLimitedRecorder() {
  const [timeRemaining, setTimeRemaining] = useState(MAX_RECORDING_TIME);
  const timerRef = useRef(null);

  const { startRecording, stopRecording, isRecording, recordingDuration } = useAudioRecorder();

  // Set up timer when recording starts
  useEffect(() => {
    if (isRecording) {
      setTimeRemaining(MAX_RECORDING_TIME - recordingDuration);

      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            const newVal = MAX_RECORDING_TIME - recordingDuration;

            // Auto-stop when time limit is reached
            if (newVal <= 0) {
              stopRecording();
              clearInterval(timerRef.current);
              timerRef.current = null;
              return 0;
            }

            return newVal;
          });
        }, 1000);
      }
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, recordingDuration, stopRecording]);

  return (
    <div>
      {isRecording && (
        <div>
          Time remaining: {Math.floor(timeRemaining / 60)}:
          {(timeRemaining % 60).toString().padStart(2, '0')}
        </div>
      )}

      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
    </div>
  );
}
```

### Memory Leaks

**Symptom**: App becomes slower over time, especially after recording multiple times.

**Solution**:

1. Always clean up resources in useEffect's return function
2. Revoke object URLs when they're no longer needed
3. Stop tracks on mediaStream when done

```jsx
function LeakFreeRecorder() {
  const [audioUrl, setAudioUrl] = useState(null);
  const { startRecording, stopRecording, mediaStream } = useAudioRecorder();

  // Clean up MediaStream when component unmounts or recording stops
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  // Clean up old URLs when new ones are created or component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleSaveRecording = async () => {
    const recording = await saveRecording();
    if (recording) {
      // If there was a previous URL, revoke it
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(recording.url);
    }
  };

  return <div>{/* UI components */}</div>;
}
```

## Mobile Device Issues

### Safari on iOS Specific Problems

**Symptom**: Recording doesn't work properly on Safari for iOS.

**Solutions**:

1. Ensure the page is served over HTTPS
2. Be aware of autoplay restrictions on iOS
3. Handle iOS WebKit quirks:

```jsx
function iOSCompatibleRecorder() {
  const [audioElement, setAudioElement] = useState(null);

  // Reference to audio element to handle iOS quirks
  useEffect(() => {
    // Create audio element programmatically
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.style.display = 'none';
    document.body.appendChild(audio);

    setAudioElement(audio);

    return () => {
      if (audio && audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    };
  }, []);

  const handlePlay = async () => {
    const url = await playRecording();

    if (url && audioElement) {
      // For iOS, we need to make the audio element visible
      audioElement.style.display = 'block';
      audioElement.src = url;

      // On iOS, play must be called directly from a user action
      try {
        await audioElement.play();
      } catch (error) {
        console.error('Playback error (likely iOS autoplay restriction):', error);
        alert('Please tap the play button on the audio player to play the recording.');
      }
    }
  };

  return (
    <div>
      <button onClick={startRecording}>Record</button>
      <button onClick={stopRecording}>Stop</button>
      <button onClick={handlePlay}>Play</button>
    </div>
  );
}
```

## Still Having Issues?

If you're still experiencing problems after trying these solutions:

1. Check the browser console for specific error messages
2. Look for HTTPS-related issues if testing locally
3. Test with the latest version of Chrome, which has the best support for the MediaRecorder API
4. File an issue on our [GitHub repository](https://github.com/miladbn/react-audio-recorder-hook/issues) with:
   - Browser and OS details
   - Steps to reproduce
   - Error messages from the console
   - A minimal code example if possible
