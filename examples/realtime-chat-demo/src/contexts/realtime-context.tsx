"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  RealtimeClient, 
  Event as RealtimeEvent, 
  TimestampedEvent,
  Content,
  TextContent,
  ItemType,
  RealtimeUtils
} from '@ticos/realtime-api';
import { WavRecorder, WavStreamPlayer, WavPacker } from '@/lib/wavtools';

interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  source?: 'client' | 'server' | 'system';
  data?: any;
  count?: number;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'received' | 'error';
  audioUrl?: string;
  audioData?: string; // Base64 encoded audio data
}

interface RealtimeContextType {
  client: any;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  messages: Message[];
  events: Event[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
  playAudio: (audioData: string) => void;
  vadEnabled: boolean;
  setVadEnabled: (enabled: boolean) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
  serverUrl?: string;
}

// Define the input content types locally to avoid TypeScript errors
interface LocalInputTextContent {
  type: 'input_text';
  text: string;
}

interface LocalInputAudioContent {
  type: 'input_audio';
  audio?: string;
  transcript?: string | null;
}

// Sample rate for audio recording and playback
const SAMPLE_RATE = 24000;

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  serverUrl = 'wss://stardust.ticos.cn/realtime',
}) => {
  const [client, setClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [vadEnabled, setVadEnabled] = useState(false);
  const clientRef = useRef<any>(null);
  
  // Audio refs using wavtools
  const recorderRef = useRef<WavRecorder | null>(null);
  const playerRef = useRef<WavStreamPlayer | null>(null);
  const audioBufferRef = useRef<Int16Array>(new Int16Array(0));
  const audioInitializedRef = useRef<boolean>(false);
  
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

  // Helper function to add events to the event log
  const addEvent = (event: any) => {
    // Extract event details
    const eventType = event.event?.type || 'unknown';
    const eventSource = event.source || 'system';
    const eventTime = event.time || new Date().toISOString();
    
    // Add the event to the events array, aggregating similar consecutive events
    setEvents((prevEvents) => {
      const lastEvent = prevEvents[prevEvents.length - 1];
      if (lastEvent && lastEvent.type === eventType) {
        // If we receive multiple events of the same type in a row, aggregate them
        const updatedEvent = { 
          ...lastEvent,
          count: (lastEvent.count || 1) + 1,
          data: event // Update with the latest event data
        };
        return [...prevEvents.slice(0, -1), updatedEvent];
      } else {
        // Otherwise add as a new event
        const newEvent: Event = {
          id: RealtimeUtils.generateId('evt_', 12),
          type: eventType,
          message: eventType,
          source: eventSource as 'client' | 'server' | 'system',
          data: event,
          timestamp: new Date(eventTime),
          count: 1
        };
        return [...prevEvents, newEvent];
      }
    });
  };

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
          debug: false
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
      setError(new Error('Error initializing audio: ' + (err instanceof Error ? err.message : String(err))));
      return false;
    }
  };

  // Handle conversation updated event
  const handleConversationUpdated = async ({ item, delta }: any) => {
    const items = client.conversation.getItems();
    if (delta?.audio && playerRef.current) {
      playerRef.current.add16BitPCM(delta.audio, item.id);
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
      const decodedAudio = await WavRecorder.decode(wavBlob, SAMPLE_RATE);
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
    }
    setMessages(items);
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
      
      // Create client if it doesn't exist
      if (!client) {
        const newClient = new RealtimeClient({
          url: serverUrl,
          apiKey: process.env.NEXT_PUBLIC_REALTIME_API_KEY || '',
        });
        
        // Set up event handlers
        newClient.on('connected', () => {
          addEvent({
            event: { type: 'client.connected' },
            source: 'client',
            time: new Date().toISOString()
          });
        });
        
        newClient.on('disconnect', () => {
          setIsConnected(false);
        });
        
        newClient.on('error', (event: any) => {
          if (event && event.error) {
            setError(new Error(event.error.message || 'Unknown error'));
          }
        });
        
        newClient.on('realtime.event', addEvent);
        
        // Conversation-specific events
        newClient.on('conversation.interrupted', () => {
          console.log('Conversation interrupted');
          if (playerRef.current) {
            playerRef.current.interrupt();
          }
        });
        
        newClient.on('conversation.item.completed', (event: any) => {
          console.log('conversation.item.completed', event.item);
        });
        
        newClient.on('conversation.updated', handleConversationUpdated);
        
        // Connect to the API
        await newClient.connect();
        
        // Update configuration to trigger session update
        newClient.updateConfig({
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
          }
        });
        
        // Update state with the new client
        setClient(newClient);
        clientRef.current = newClient;
        setIsConnected(true);
        
        // If VAD is enabled, start recording automatically
        if (vadEnabled && newClient.getTurnDetectionType() === 'server_vad') {
          await startRecording();
        }
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
            audioBufferRef.current = RealtimeUtils.mergeInt16Arrays(
              audioBufferRef.current,
              mono
            );
            
            // Send audio data to server if connected
            if (client && client.isConnected()) {
              client.appendInputAudio(mono);
            }
          }
        },
        // Chunk size (samples)
        2048
      );
      
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording', err);
      setError(new Error('Error starting recording: ' + (err instanceof Error ? err.message : String(err))));
    }
  };

  // Stop audio recording and send the audio data
  const stopRecording = async () => {
    if (!isRecording) return;
    
    try {
      if (!recorderRef.current) {
        throw new Error('Audio recorder not initialized');
      }
      
      // Pause recording
      await recorderRef.current.pause();
      
      // Get the recorded audio
      const audioData = await recorderRef.current.save();
      
      // Send the full audio buffer if not empty
      if (audioBufferRef.current.length > 0) {
        // Create audio content
        const audioContent: LocalInputAudioContent = {
          type: 'input_audio',
          audio: RealtimeUtils.arrayBufferToBase64(audioBufferRef.current.buffer as ArrayBuffer),
          transcript: null
        };
        
        // Send to server
        if (client && client.isConnected()) {
          client.sendUserMessageContent([audioContent as any]);
        }
        
        // Reset buffer
        audioBufferRef.current = new Int16Array(0);
      }
      
      setIsRecording(false);
    } catch (err) {
      console.error('Error stopping recording', err);
      setError(new Error('Error stopping recording: ' + (err instanceof Error ? err.message : String(err))));
    }
  };

  // Play audio from base64 data or URL
  const playAudio = async (audioData: string) => {
    try {
      // Make sure audio is initialized
      if (!audioInitializedRef.current) {
        await initAudio();
      }
      
      if (!playerRef.current) {
        throw new Error('Audio player not initialized');
      }
      
      // Check if it's a URL or base64 data
      if (audioData.startsWith('http') || audioData.startsWith('blob:')) {
        // It's a URL, fetch the audio data
        const response = await fetch(audioData);
        const arrayBuffer = await response.arrayBuffer();
        const int16Data = new Int16Array(arrayBuffer);
        playerRef.current.add16BitPCM(int16Data);
      } else {
        // It's base64 data, convert to Int16Array using SDK utility
        const arrayBuffer = RealtimeUtils.base64ToArrayBuffer(audioData);
        const int16Data = new Int16Array(arrayBuffer);
        playerRef.current.add16BitPCM(int16Data);
      }
    } catch (err) {
      console.error('Error playing audio', err);
      setError(new Error('Error playing audio: ' + (err instanceof Error ? err.message : String(err))));
    }
  };

  // Disconnect from the Realtime API
  const disconnect = async () => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      
      // Stop recording if active
      if (isRecording) {
        await stopRecording();
      }
      
      // Clean up audio resources
      if (recorderRef.current) {
        await recorderRef.current.quit();
        recorderRef.current = null;
      }
      
      if (playerRef.current) {
        await playerRef.current.interrupt().catch(console.error);
        playerRef.current = null;
      }
      
      // Reset audio initialization state
      audioInitializedRef.current = false;
      
      // Disconnect from the API
      await client.disconnect();
      setIsConnected(false);
      setClient(null);
      clientRef.current = null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message to the conversation
  const sendMessage = async (content: string) => {
    if (!client) {
      await connect();
      return;
    }
    
    try {
      // Send to server - we'll receive the message back through the realtime events
      if (client && client.isConnected()) {
        const inputContent: LocalInputTextContent = {
          type: 'input_text',
          text: content
        };
        client.sendUserMessageContent([inputContent as any]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    }
  };

  // Update VAD setting
  useEffect(() => {
    if (client && isConnected) {
      client.updateConfig({
        hearing: {
          input_audio_format: 'pcm16',
          input_audio_transcription: null,
          turn_detection: vadEnabled ? { type: 'server_vad' } : null,
        }
      });
      
      // If VAD is enabled, start recording automatically
      if (vadEnabled && client.getTurnDetectionType() === 'server_vad') {
        startRecording();
      } else if (!vadEnabled && isRecording) {
        // If VAD is disabled but we're recording, stop recording
        stopRecording();
      }
    }
  }, [vadEnabled, isConnected]);

  const value = {
    client,
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
    setVadEnabled
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
