'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  RealtimeClient,
  RealtimeUtils,
  Event as RealtimeBaseEvent,
  InputTextContent,
  InputAudioContent,
  ItemType,
} from '@ticos/realtime-api';
import { WavRecorder, WavStreamPlayer } from '@/lib/wavtools';

// Simplified event interface for the event log
interface Event {
  id: string;
  type: string;
  time: string;
  source: 'client' | 'server';
  event: RealtimeBaseEvent;
  count?: number;
}

interface RealtimeContextType {
  client: any;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  messages: ItemType[];
  events: Event[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
  playAudio: (audioData: string | Int16Array | ArrayBuffer) => void;
  vadEnabled: boolean;
  setVadEnabled: (enabled: boolean) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
  serverUrl?: string;
}

// Sample rate for audio recording and playback
const SAMPLE_RATE = 24000;

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  serverUrl = 'wss://stardust.ticos.cn/realtime',
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<ItemType[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [vadEnabled, setVadEnabled] = useState(false);
  const clientRef = useRef<any>(null);

  // Audio refs using wavtools
  const recorderRef = useRef<WavRecorder | null>(null);
  const playerRef = useRef<WavStreamPlayer | null>(null);
  const audioBufferRef = useRef<Int16Array>(new Int16Array(0));
  const audioInitializedRef = useRef<boolean>(false);

  // Helper function to convert ArrayBuffer to Base64 string
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Cleanup function for when component unmounts
  useEffect(() => {
    return () => {
      if (clientRef.current && clientRef.current.isConnected()) {
        clientRef.current.disconnect();
      }

      // Clean up audio components if initialized
      if (recorderRef.current) {
        recorderRef.current.quit().catch(console.error);
        recorderRef.current = null;
      }

      if (playerRef.current) {
        playerRef.current = null;
      }

      audioInitializedRef.current = false;
    };
  }, []);

  // Initialize audio components - only called when needed
  const initAudio = async (): Promise<boolean> => {
    if (audioInitializedRef.current) {
      return true; // Already initialized
    }

    try {
      // Initialize WavRecorder
      if (!recorderRef.current) {
        recorderRef.current = new WavRecorder({
          sampleRate: SAMPLE_RATE,
          outputToSpeakers: false,
          debug: false,
        });

        // Request permission to access microphone
        await recorderRef.current.requestPermission();
      }

      // Initialize WavStreamPlayer
      if (!playerRef.current) {
        playerRef.current = new WavStreamPlayer({ sampleRate: SAMPLE_RATE });
        await playerRef.current.connect();
      }

      audioInitializedRef.current = true;
      return true;
    } catch (err) {
      console.error('Error initializing audio components', err);
      setError(
        new Error('Error initializing audio: ' + (err instanceof Error ? err.message : String(err)))
      );
      return false;
    }
  };

  // Initialize event handlers
  const setupEventHandlers = () => {
    if (!clientRef.current) return;

    // Clear any existing handlers first
    clientRef.current.clearEventHandlers();

    // Set up event handlers
    clientRef.current.on('realtime.event', (eventData: any) => {
      // Type guard to ensure we have a valid TimestampedEvent
      if (
        eventData &&
        typeof eventData === 'object' &&
        'time' in eventData &&
        'source' in eventData &&
        'event' in eventData
      ) {
        // Create a properly formatted event for the event log
        const newEvent: Event = {
          id: eventData.event?.event_id || RealtimeUtils.generateId('mock_evt_'),
          type: eventData.event?.type || 'unknown',
          time: eventData.time,
          source: eventData.source,
          event: eventData.event,
          count: 1,
        };

        setEvents((prevEvents) => {
          // Check if this is a duplicate of the last event
          const lastEvent = prevEvents[prevEvents.length - 1];

          if (lastEvent && lastEvent.type === newEvent.type) {
            // Update the count for duplicate events
            const updatedEvents = [...prevEvents];
            updatedEvents[prevEvents.length - 1] = {
              ...lastEvent,
              count: (lastEvent.count || 1) + 1,
            };
            return updatedEvents;
          }

          // Add new event at the end (oldest first)
          const updatedEvents = [...prevEvents, newEvent];

          // Keep only the latest 100 events
          if (updatedEvents.length > 100) {
            return updatedEvents.slice(-100);
          }

          return updatedEvents;
        });
      }
    });

    clientRef.current.on('*', (event: any) => {
      console.log('event', event);
    });

    // Handle direct connection events (these should now work with our SDK fix)
    clientRef.current.on('client.connected', () => {
      console.log('Direct client.connected event received');
      setIsConnected(true);
    });

    clientRef.current.on('client.disconnected', () => {
      console.log('Direct client.disconnected event received');
      setIsConnected(false);

      // Clean up audio resources
      if (isRecording) {
        try {
          if (recorderRef.current) {
            recorderRef.current.pause();
          }
          setIsRecording(false);
        } catch (error) {
          console.error('Error stopping recording on disconnect:', error);
        }
      }

      // Stop any audio playback
      if (playerRef.current) {
        try {
          playerRef.current.interrupt && playerRef.current.interrupt();
        } catch (error) {
          console.error('Error stopping audio playback on disconnect:', error);
        }
      }

      // Reset audio buffer
      audioBufferRef.current = new Int16Array(0);
    });

    clientRef.current.on('client.error', (error: any) => {
      console.log('Direct client.error event received', error);
      setError(new Error('Error connecting to Realtime API'));
    });

    // Handle conversation updated event for audio processing
    clientRef.current.on('conversation.updated', async (event: any) => {
      const items = clientRef.current.getConversationItems();
      const { item, delta } = event;

      // Handle audio delta
      if (delta?.audio && playerRef.current) {
        playerRef.current.add16BitPCM(delta.audio, item.id);
      }

      // Handle transcript delta
      if (delta?.transcript) {
        console.log('Transcript delta received:', delta.transcript);
        // The transcript is already processed by the SDK's event processor
      }

      if (item?.status === 'completed' && item.formatted?.audio?.length) {
        console.log('conversation.updated (completed)', item, delta);
        let audioData = new Int16Array(item.formatted.audio);

        // Create WAV header
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);

        // "RIFF" chunk descriptor
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + audioData.length * 2, true); // file size
        view.setUint32(8, 0x57415645, false); // "WAVE"

        // "fmt " sub-chunk
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true); // subchunk1 size
        view.setUint16(20, 1, true); // PCM = 1
        view.setUint16(22, 1, true); // mono = 1 channel
        view.setUint32(24, SAMPLE_RATE, true); // sample rate
        view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
        view.setUint16(32, 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample

        // "data" sub-chunk
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, audioData.length * 2, true); // data size

        // Combine header and audio data
        const wavBlob = new Blob([wavHeader, audioData.buffer], {
          type: 'audio/wav',
        });

        await WavRecorder.decode(wavBlob, SAMPLE_RATE).then((decodedAudio) => {
          console.log('Decoded audio:', {
            blobSize: decodedAudio.blob.size,
            blobType: decodedAudio.blob.type,
            bufferLength: decodedAudio.audioBuffer.length,
            duration: decodedAudio.audioBuffer.duration,
          });

          item.formatted.file = {
            url: decodedAudio.url,
            blob: decodedAudio.blob,
          };
        });
      }
      setMessages(items);
    });

    // Handle conversation interrupted event
    clientRef.current.on('conversation.interrupted', () => {
      console.log('Conversation interrupted');
      if (playerRef.current) {
        playerRef.current.interrupt();
      }
    });
  };

  // Connect to the Realtime API
  const connect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear messages and events
      setMessages([]);
      setEvents([]);

      // Initialize audio components before connecting
      const audioInitialized = await initAudio();
      if (!audioInitialized) {
        throw new Error('Failed to initialize audio components');
      }

      // Create a fresh client instance each time
      clientRef.current = new RealtimeClient({
        url: serverUrl,
        apiKey: process.env.NEXT_PUBLIC_REALTIME_API_KEY || '',
        debug: true,
      });

      // Setup event handlers before connecting
      setupEventHandlers();

      // Connect to the API
      await clientRef.current.connect();

      // Update configuration to trigger session update
      clientRef.current.updateConfig({
        model: {
          provider: 'tiwater',
          name: 'stardust-2.5-turbo',
          modalities: ['text', 'audio'],
          instructions: '',
          tools: [],
          tool_choice: 'auto',
          temperature: 0.8,
          max_response_output_tokens: 4096,
        },
        hearing: {
          input_audio_format: 'pcm16',
          input_audio_transcription: null,
          turn_detection: vadEnabled ? { type: 'server_vad' } : null,
        },
      });

      // If VAD is enabled, start recording automatically
      if (vadEnabled && clientRef.current.getTurnDetectionType() === 'server_vad') {
        await startRecording();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Start audio recording
  const startRecording = async () => {
    if (isRecording) return;

    try {
      // Make sure audio is initialized
      if (!audioInitializedRef.current) {
        await initAudio();
      }

      if (!recorderRef.current) {
        throw new Error('Audio recorder not initialized');
      }

      // Begin recording session
      await recorderRef.current.begin();

      // Reset audio buffer
      audioBufferRef.current = new Int16Array(0);

      // Start recording with chunk processor
      await recorderRef.current.record(
        ({ mono }) => {
          // Process audio chunks
          if (mono.length > 0) {
            // Append to buffer using SDK's utility function
            audioBufferRef.current = RealtimeUtils.mergeInt16Arrays(audioBufferRef.current, mono);

            // Send audio data to server if connected
            if (clientRef.current && clientRef.current.isConnected()) {
              clientRef.current.appendInputAudio(mono);
            }
          }
        },
        // Chunk size (samples)
        2048
      );

      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording', err);
      setError(
        new Error('Error starting recording: ' + (err instanceof Error ? err.message : String(err)))
      );
    }
  };

  // Stop audio recording and send the audio data
  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      setIsRecording(false);

      // First pause the recording
      await recorderRef.current.pause();

      // Then save the audio data
      const wavData = await recorderRef.current.save();

      // Convert the blob to ArrayBuffer for sending to the API
      const arrayBuffer = await wavData.blob.arrayBuffer();

      // Convert ArrayBuffer to Base64 string
      const base64Audio = arrayBufferToBase64(arrayBuffer);

      // Create message with audio content
      if (base64Audio) {
        // Create audio content
        const audioContent: InputAudioContent = {
          type: 'input_audio',
          audio: base64Audio,
          transcript: null,
        };

        // Send to server
        if (clientRef.current && clientRef.current.isConnected()) {
          clientRef.current.sendUserMessageContent([audioContent]);
        }

        // Reset buffer
        audioBufferRef.current = new Int16Array(0);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error stopping recording:', error);
    }
  };

  // Play audio from base64 data, URL, or buffer
  const playAudio = async (audioData: string | Int16Array | ArrayBuffer) => {
    try {
      // Make sure audio is initialized
      if (!audioInitializedRef.current) {
        await initAudio();
      }

      if (!playerRef.current) {
        throw new Error('Audio player not initialized');
      }

      let int16Data: Int16Array;

      // Handle different input types
      if (typeof audioData === 'string') {
        // Check if it's a URL or base64 data
        if (audioData.startsWith('http') || audioData.startsWith('blob:')) {
          // It's a URL, fetch the audio data
          const response = await fetch(audioData);
          const arrayBuffer = await response.arrayBuffer();
          int16Data = new Int16Array(arrayBuffer);
        } else {
          // It's base64 data, convert to Int16Array using SDK utility
          const arrayBuffer = RealtimeUtils.base64ToArrayBuffer(audioData);
          int16Data = new Int16Array(arrayBuffer);
        }
      } else if (audioData instanceof Int16Array) {
        // It's already an Int16Array
        int16Data = audioData;
      } else {
        // It's an ArrayBuffer, convert to Int16Array
        int16Data = new Int16Array(audioData);
      }

      // Play the audio
      playerRef.current.add16BitPCM(int16Data);
    } catch (err) {
      console.error('Error playing audio', err);
      setError(
        new Error('Error playing audio: ' + (err instanceof Error ? err.message : String(err)))
      );
    }
  };

  // Disconnect from the Realtime API
  const disconnect = async () => {
    setIsLoading(true);
    try {
      // Clean up event handlers and disconnect
      if (clientRef.current && clientRef.current.isConnected()) {
        clientRef.current.clearEventHandlers();
        clientRef.current.disconnect();
      }

      // Stop recording if active
      if (recorderRef.current && isRecording) {
        await recorderRef.current.end();
        setIsRecording(false);
      }

      // Interrupt audio player
      if (playerRef.current) {
        playerRef.current.interrupt();
      }

      // Reset connection states
      setIsConnected(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Error disconnecting', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  };

  // Send a message to the conversation
  const sendMessage = async (content: string) => {
    try {
      // Connect first if we don't have a client or it's not connected
      if (!clientRef.current || !clientRef.current.isConnected()) {
        await connect();
      }

      // Create input content
      const inputContent: InputTextContent = {
        type: 'input_text',
        text: content,
      };

      // Send to server - we'll receive the message back through the realtime events
      clientRef.current.sendUserMessageContent([inputContent]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    }
  };

  // Update VAD setting
  useEffect(() => {
    if (clientRef.current && isConnected) {
      clientRef.current.updateConfig({
        hearing: {
          input_audio_format: 'pcm16',
          input_audio_transcription: null,
          turn_detection: vadEnabled ? { type: 'server_vad' } : null,
        },
      });

      // If VAD is enabled, start recording automatically
      if (vadEnabled && clientRef.current.getTurnDetectionType() === 'server_vad') {
        startRecording();
      } else if (!vadEnabled && isRecording) {
        // If VAD is disabled but we're recording, stop recording
        stopRecording();
      }
    }
  }, [vadEnabled, isConnected]);

  const value = {
    client: clientRef.current,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    sendMessage,
    events,
    messages,
    startRecording,
    stopRecording,
    isRecording,
    playAudio,
    vadEnabled,
    setVadEnabled,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
