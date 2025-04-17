"use client";

import React, { useRef, useEffect } from 'react';
import { useRealtime } from '@/contexts/realtime-context';
import Message from './message';
import ChatInput from './chat-input';
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, AudioLines, Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MessageItem {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  audioData?: any;
}

const ChatContainer: React.FC = () => {
  const { 
    isConnected, 
    isLoading, 
    error, 
    connect, 
    sendMessage, 
    disconnect,
    messages,
    startRecording,
    stopRecording,
    isRecording,
    vadEnabled,
    setVadEnabled
  } = useRealtime();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error.message}`, {
        description: "Please try reconnecting or check your API key.",
        icon: <AlertCircle className="h-4 w-4" />
      });
    }
  }, [error]);

  // Handle send message
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      await sendMessage(content);
    } catch (err) {
      toast.error(`Failed to send message: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleConnect = async () => {
    const toastId = toast.loading('Connecting to Realtime API...');
    try {
      await connect();
      toast.success('Connected to Realtime API', { id: toastId });
      
      // Send a message after connection is established
      try {
        await sendMessage('Hello');
      } catch (err) {
        toast.error(`Failed to send message: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } catch (err) {
      toast.error(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
    }
  };

  const handleDisconnect = async () => {
    const toastId = toast.loading('Disconnecting...');
    try {
      await disconnect();
      toast.success('Disconnected from Realtime API', { id: toastId });
    } catch (err) {
      toast.error(`Disconnect error: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className={`border-b px-4 py-2 ${
        isConnected 
          ? 'bg-gradient-to-r from-green-500/15 to-green-400/5' 
          : isLoading 
            ? 'bg-gradient-to-r from-amber-500/15 to-amber-400/5'
            : 'bg-gradient-to-r from-slate-500/10 to-slate-400/5'
      }`}>
        <div className="flex justify-between h-8 items-center">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AudioLines className={cn("h-4 w-4 animate-pulse")} />
            Realtime Chat
            <div className={`h-2.5 w-2.5 rounded-full ml-1 ${
              isConnected 
                ? 'bg-green-500 animate-pulse' 
                : isLoading 
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-gray-400'
            }`}></div>
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="vad-mode"
                checked={vadEnabled}
                onCheckedChange={setVadEnabled}
                disabled={isLoading}
              />
              <Label htmlFor="vad-mode" className="text-sm">VAD Mode</Label>
            </div>
            
            {isConnected ? (
              <Button 
                onClick={handleDisconnect} 
                variant="destructive" 
              >
                Disconnect
              </Button>
            ) : !isLoading ? (
              <Button 
                onClick={handleConnect} 
                variant="default" 
                className="bg-green-500 hover:bg-green-600"
              >
                Connect
              </Button>
            ) : (
              <Button 
                disabled 
                variant="outline" 
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Connecting...
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4 pb-20">
            {messages.length > 0 && messages.map((message, index) => (
              <Message
                key={message.id || index}
                content={message.content}
                isUser={message.isUser}
                timestamp={message.timestamp}
                audioData={message.audioData}
              />
            ))}
            {messages.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                  <AudioLines className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    Welcome to Ticos Realtime Chat!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {isConnected 
                      ? 'Start a conversation by using the Push to Talk button below.' 
                      : 'Connect to start chatting with Ticos Realtime API.'}
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex gap-2 items-center">
            {isConnected && !vadEnabled && (
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="icon"
                disabled={!isConnected}
                onMouseDown={async () => await startRecording()}
                onMouseUp={async () => await stopRecording()}
                onMouseLeave={async () => isRecording && await stopRecording()}
                className="rounded-full h-12 w-12 flex items-center justify-center"
              >
                <Mic className={cn("h-5 w-5", isRecording && "animate-pulse")} />
              </Button>
            )}
            <ChatInput 
              onSendMessage={handleSendMessage} 
              disabled={!isConnected || isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
