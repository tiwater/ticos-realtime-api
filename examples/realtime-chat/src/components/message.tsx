'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useRealtime } from '@/contexts/realtime-context';
import { Button } from '@/components/ui/button';
import { Play, Pause, User2, Bot } from 'lucide-react';
import { ItemType } from '@ticos/realtime-api';

interface MessageProps {
  item: ItemType;
}

const Message: React.FC<MessageProps> = ({ item }) => {
  const { playAudio } = useRealtime();
  const [isPlaying, setIsPlaying] = useState(false);

  // Determine if this message has audio content
  const hasInlineAudio = item.formatted?.audio && item.formatted.audio.length > 0;
  const hasFileAudio = item.formatted?.file?.url && typeof item.formatted.file.url === 'string';
  const hasAudio = hasInlineAudio || hasFileAudio;

  // Get text content from either text or transcript
  const textContent = item.formatted?.text || item.formatted?.transcript || '';
  const hasText = textContent.length > 0;

  const handlePlayAudio = () => {
    if (isPlaying) {
      // TODO: Add ability to stop audio playback through context
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      // Make sure we have audio data before playing
      if (hasInlineAudio && item.formatted?.audio) {
        playAudio(item.formatted.audio);
      } else if (hasFileAudio && item.formatted?.file?.url) {
        // For file URLs, we can pass the URL directly to playAudio
        playAudio(item.formatted.file.url);
      }

      // Since there's no callback mechanism from playAudio, we'll use a timeout
      // to simulate the end of audio playback.
      setTimeout(() => setIsPlaying(false), 3000);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div
      className={`flex items-start gap-1.5 ${
        item.role === 'user' ? 'flex-row-reverse' : 'flex-row'
      } mb-2 mx-1`}
    >
      <Avatar
        className={cn(
          'flex-shrink-0 h-7 w-7 items-center justify-center',
          item.role === 'user' ? 'bg-brand' : 'bg-secondary'
        )}
      >
        {item.role === 'user' ? (
          <User2 className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-secondary-foreground" />
        )}
      </Avatar>

      <div
        className={cn(
          'flex-1 max-w-[85%] sm:max-w-[90%] md:max-w-[75%]',
          item.role === 'user' ? 'items-end' : 'items-start'
        )}
      >
        <Card
          className={cn(
            'rounded-xl w-fit p-2',
            item.role === 'user'
              ? 'bg-brand/80 text-brand-foreground rounded-tr-none ml-auto'
              : 'bg-secondary rounded-tl-none mr-auto'
          )}
        >
          <CardContent className="p-1.5 px-2.5 text-sm leading-snug">
            <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-normal overflow-hidden overflow-wrap-anywhere">
              {/* Display text content if available (from either text or transcript) */}
              {hasText && (
                <ReactMarkdown
                  components={{
                    a: (props) => (
                      <a
                        {...props}
                        className={`underline break-all hyphens-auto ${item.role === 'user' ? 'text-primary-foreground hover:text-primary-foreground/90' : 'text-primary hover:text-primary/80'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                    code: (props) => (
                      <code
                        {...props}
                        className={`rounded px-1 py-0.5 font-mono text-xs break-all ${item.role === 'user' ? 'bg-primary-foreground/20' : 'bg-muted/50 dark:bg-muted/20'}`}
                      />
                    ),
                    pre: (props) => (
                      <pre
                        {...props}
                        className={`rounded p-1 overflow-x-auto my-0.5 font-mono text-xs break-words whitespace-pre-wrap overflow-wrap-anywhere ${item.role === 'user' ? 'bg-primary-foreground/20' : 'bg-muted/50 dark:bg-muted/20'}`}
                      />
                    ),
                    p: ({ children }) => (
                      <p className="my-0.5 break-words hyphens-auto overflow-wrap-anywhere">
                        {children}
                      </p>
                    ),
                    ul: (props) => <ul {...props} className="pl-4 my-0.5 break-words" />,
                    ol: (props) => <ol {...props} className="pl-4 my-0.5 break-words" />,
                    li: (props) => <li {...props} className="my-0.5 break-words" />,
                    h1: (props) => <h1 {...props} className="text-sm font-bold my-1 break-words" />,
                    h2: (props) => <h2 {...props} className="text-sm font-bold my-1 break-words" />,
                    h3: (props) => <h3 {...props} className="text-xs font-bold my-1 break-words" />,
                    table: (props) => (
                      <div className="overflow-x-auto">
                        <table {...props} className="border-collapse text-xs my-1" />
                      </div>
                    ),
                    td: (props) => (
                      <td {...props} className="border border-border p-1 break-words" />
                    ),
                    th: (props) => (
                      <th {...props} className="border border-border p-1 break-words font-bold" />
                    ),
                  }}
                >
                  {textContent}
                </ReactMarkdown>
              )}

              {/* Audio play button inside the card content */}
              {hasAudio && (
                <div className="flex justify-end mt-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn('h-4 w-4 rounded-full')}
                    onClick={handlePlayAudio}
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Message;
