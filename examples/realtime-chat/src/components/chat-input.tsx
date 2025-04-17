"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react"; 
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (recordingTimeoutRef.current) {
        clearInterval(recordingTimeoutRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
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
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start a timer to update recording time
      recordingTimeoutRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear the recording timer
      if (recordingTimeoutRef.current) {
        clearInterval(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      // Process the audio
      processAudio();
    }
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Here you would normally send the audio to a speech-to-text service
      // For demo purposes, we'll just simulate a response after a delay
      setTimeout(() => {
        const transcribedText = "This is a simulated voice message from the microphone input.";
        onSendMessage(transcribedText);
        setIsProcessing(false);
        setRecordingTime(0);
      }, 1500);
      
      // Clean up the media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio');
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center">
      {isProcessing ? (
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border">
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          <span className="text-sm">Processing audio...</span>
        </div>
      ) : (
        <Button
          type="button"
          size="lg"
          variant="default"
          className={cn(
            "gap-2 rounded-full px-6 py-3 h-auto shadow-lg",
            isRecording 
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
              : "bg-green-500 hover:bg-green-600 text-white",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onMouseDown={!disabled ? startRecording : undefined}
          onMouseUp={!disabled ? stopRecording : undefined}
          onMouseLeave={isRecording ? stopRecording : undefined}
          onTouchStart={!disabled ? startRecording : undefined}
          onTouchEnd={!disabled ? stopRecording : undefined}
          disabled={disabled}
        >
          <Mic className="h-5 w-5" />
          <span>{isRecording ? `Recording ${formatTime(recordingTime)}` : "Hold to Talk"}</span>
        </Button>
      )}
    </div>
  );
};

export default ChatInput;
