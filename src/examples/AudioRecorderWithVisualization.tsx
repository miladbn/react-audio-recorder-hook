/* eslint-disable react/jsx-uses-react */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import useAudioRecorder from '../index';

interface AudioRecorderWithVisualizationProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  barColor?: string;
  className?: string;
}

export function AudioRecorderWithVisualization({
  width = 300,
  height = 60,
  backgroundColor = '#f5f5f5',
  barColor = '#4a9fff',
  className,
}: AudioRecorderWithVisualizationProps) {
  const {
    startRecording,
    stopRecording,
    cancelRecording,
    pauseRecording,
    resumeRecording,
    saveRecording,
    playRecording,
    isRecording,
    isPaused,
    recordingDuration,
    mediaStream,
  } = useAudioRecorder();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startVisualization = useCallback(() => {
    if (!canvasRef.current || !audioAnalyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioAnalyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw function
    const draw = () => {
      // Schedule next animation frame
      animationFrameRef.current = requestAnimationFrame(draw);

      // Get the frequency data
      analyser.getByteFrequencyData(dataArray);

      // Clear the canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate bar width
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      // Draw the bars
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        ctx.fillStyle = barColor;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }, [backgroundColor, barColor]);

  const setupAudioAnalysis = useCallback(() => {
    if (!mediaStream || !canvasRef.current) return;

    // Create audio context and analyser with better type handling
    let audioContext: AudioContext;
    try {
      // Modern browsers
      audioContext = new AudioContext();
    } catch (e) {
      // For older browsers that might use the prefixed version
      // Use ts-expect-error instead of ts-ignore
      // @ts-expect-error WebkitAudioContext may not exist in the window type
      audioContext = new window.webkitAudioContext();
      // No need to check for null since this will throw if not available
    }

    const audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 256;

    // Connect the media stream to the analyser
    const audioSource = audioContext.createMediaStreamSource(mediaStream);
    audioSource.connect(audioAnalyser);

    // Store references
    audioContextRef.current = audioContext;
    audioAnalyserRef.current = audioAnalyser;

    // Start visualization
    startVisualization();
  }, [mediaStream, startVisualization]);

  const cleanupAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    audioAnalyserRef.current = null;
  }, []);

  useEffect(() => {
    if (mediaStream && isRecording && !isPaused) {
      setupAudioAnalysis();
    } else if (!isRecording || isPaused) {
      cleanupAudioAnalysis();
    }

    return () => {
      cleanupAudioAnalysis();
    };
  }, [mediaStream, isRecording, isPaused, setupAudioAnalysis, cleanupAudioAnalysis]);

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    await stopRecording();
    const recording = await saveRecording();
    if (recording) {
      setAudioUrl(recording.url);
    }
  };

  const handlePlayRecording = async () => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      const url = await playRecording();
      if (url) {
        setAudioUrl(url);
        // Create and play audio element
        const audio = new Audio(url);
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
        audioRef.current = audio;
      }
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={className}>
      <div style={{ marginBottom: '12px' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            backgroundColor,
            borderRadius: '4px',
            display: 'block',
          }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontWeight: 'bold' }}>
          {isRecording ? (isPaused ? 'Recording Paused' : 'Recording...') : 'Not Recording'}
        </div>
        <div>Duration: {formatDuration(recordingDuration)}</div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Start Recording
          </button>
        ) : (
          <>
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                style={{
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Resume
              </button>
            )}

            <button
              onClick={handleStopRecording}
              style={{
                backgroundColor: '#F44336',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Stop
            </button>

            <button
              onClick={cancelRecording}
              style={{
                backgroundColor: '#9E9E9E',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </>
        )}

        {audioUrl && !isRecording && (
          <button
            onClick={handlePlayRecording}
            disabled={isPlaying}
            style={{
              backgroundColor: isPlaying ? '#9E9E9E' : '#673AB7',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: isPlaying ? 'not-allowed' : 'pointer',
            }}
          >
            {isPlaying ? 'Playing...' : 'Play'}
          </button>
        )}
      </div>
    </div>
  );
}

export default AudioRecorderWithVisualization;
