"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { useRealtime } from '@/contexts/realtime-context';
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface MessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  audioData?: string;
}

const Message: React.FC<MessageProps> = ({ content, isUser, timestamp, audioData }) => {
  const { playAudio } = useRealtime();
  
  const handlePlayAudio = () => {
    if (audioData) {
      playAudio(audioData);
    }
  };
  
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-2`}>
      <Avatar className={cn(
        "mt-0.5 border-2 h-7 w-7", 
        isUser ? "border-primary/20" : "border-secondary/20"
      )}>
        {isUser ? (
          <>
            <AvatarImage src="/user-avatar.png" alt="User" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">U</AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/bot-avatar.png" alt="Ticos AI" />
            <AvatarFallback className="bg-secondary/10 text-secondary text-xs">AI</AvatarFallback>
          </>
        )}
      </Avatar>
      
      <div className={cn(
        "max-w-[85%] space-y-0.5",
        isUser ? "items-end" : "items-start"
      )}>
        <Card className={cn(
          "rounded-2xl shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-muted rounded-tl-none"
        )}>
          <CardContent className="p-2 px-3 text-sm">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {audioData && (
                <div className="flex items-center mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 w-7 p-0 rounded-full mr-2"
                    onClick={handlePlayAudio}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground">Audio message</span>
                </div>
              )}
              <ReactMarkdown
                components={{
                  a: (props) => (
                    <a 
                      {...props} 
                      className="text-primary underline hover:text-primary/80" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    />
                  ),
                  code: (props) => (
                    <code {...props} className="bg-muted/50 dark:bg-muted/20 rounded px-1 py-0.5 font-mono text-xs" />
                  ),
                  pre: (props) => (
                    <pre {...props} className="bg-muted/50 dark:bg-muted/20 rounded p-2 overflow-x-auto my-2 font-mono text-xs" />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
        <p className={cn(
          "text-[10px] text-muted-foreground px-2",
          isUser ? "text-right" : "text-left"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

export default Message;
