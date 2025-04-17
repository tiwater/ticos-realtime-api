'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  // New props for real-time recording
  useRealTimeRecording?: boolean;
  onStartRecording?: () => Promise<void>;
  onStopRecording?: () => Promise<void>;
  isRecording?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  useRealTimeRecording = false,
  onStartRecording,
  onStopRecording,
  isRecording: externalIsRecording = false,
}) => {
  const [message, setMessage] = useState('');
  const [isLocalRecording, setIsLocalRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine if recording is active (either local or external)
  const isRecordingActive = useRealTimeRecording ? externalIsRecording : isLocalRecording;

  // Auto-focus textarea and adjust height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (!useRealTimeRecording) {
        stopLocalRecording();
      }
      if (recordingTimeoutRef.current) {
        clearInterval(recordingTimeoutRef.current);
      }
    };
  }, [useRealTimeRecording]);

  // Adjust textarea height based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  // Handle text input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Handle key press for submitting with Enter
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle text input submission
  const handleSubmit = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Start local recording (when not using real-time API recording)
  const startLocalRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsLocalRecording(true);
      setRecordingTime(0);

      // Start a timer to update recording time
      recordingTimeoutRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  // Stop local recording
  const stopLocalRecording = () => {
    if (mediaRecorderRef.current && isLocalRecording) {
      mediaRecorderRef.current.stop();
      setIsLocalRecording(false);

      // Clear the recording timer
      if (recordingTimeoutRef.current) {
        clearInterval(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      // Process the audio
      processLocalAudio();
    }
  };

  // Process local audio recording
  const processLocalAudio = async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      // Here you would normally send the audio to a speech-to-text service
      // For demo purposes, we'll just simulate a response after a delay
      setTimeout(() => {
        const transcribedText = 'This is a simulated voice message from the microphone input.';
        onSendMessage(transcribedText);
        setIsProcessing(false);
        setRecordingTime(0);
      }, 1500);

      // Clean up the media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio');
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  // Handle recording button press
  const handleRecordPress = async () => {
    if (useRealTimeRecording && onStartRecording) {
      await onStartRecording();
    } else {
      await startLocalRecording();
    }
  };

  // Handle recording button release
  const handleRecordRelease = async () => {
    if (useRealTimeRecording && onStopRecording) {
      await onStopRecording();
    } else {
      stopLocalRecording();
    }
  };

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {isProcessing ? (
        <div className="flex items-center justify-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          <span className="text-sm">Processing audio...</span>
        </div>
      ) : (
        <div className="relative">
          <div
            className={cn(
              'relative w-full flex items-end rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring shadow-sm',
              isRecordingActive && 'border-red-500 ring-1 ring-red-500'
            )}
          >
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Ticos..."
              className="flex-1 max-h-[150px] min-h-[44px] resize-none border-0 shadow-none focus-visible:ring-0 pl-4 pr-16 py-3"
              disabled={disabled || isRecordingActive}
            />

            <div className="absolute bottom-1 right-1 flex gap-1">
              {!message.trim() ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn(
                    'h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground',
                    isRecordingActive && 'text-red-500 animate-pulse'
                  )}
                  onMouseDown={!disabled ? handleRecordPress : undefined}
                  onMouseUp={!disabled ? handleRecordRelease : undefined}
                  onMouseLeave={isRecordingActive ? handleRecordRelease : undefined}
                  onTouchStart={!disabled ? handleRecordPress : undefined}
                  onTouchEnd={!disabled ? handleRecordRelease : undefined}
                  disabled={disabled}
                  title="Hold to record audio (release to send)"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground"
                  onClick={handleSubmit}
                  disabled={disabled || !message.trim()}
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {isRecordingActive && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              Recording {formatTime(useRealTimeRecording ? 0 : recordingTime)}
            </div>
          )}

          <div className="mt-1 text-xs text-muted-foreground text-center">
            Press Enter to send, Shift+Enter for new line.{' '}
            {useRealTimeRecording ? 'Hold mic button to record audio.' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
