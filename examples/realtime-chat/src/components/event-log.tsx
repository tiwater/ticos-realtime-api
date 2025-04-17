'use client';

import React, { useRef, useState } from 'react';
import { useRealtime } from '@/contexts/realtime-context';
import { Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Helper function to format JSON with special handling for base64 strings
const formatJsonWithBase64 = (obj: any) => {
  // Custom replacer function to handle base64 strings
  const replacer = (key: string, value: any) => {
    // Check if value is a string that looks like base64 (long string without spaces)
    if (typeof value === 'string' && value.length > 200 && /^[A-Za-z0-9+/=]+$/.test(value)) {
      // Return truncated version for very long strings
      if (value.length > 100) {
        return value.substring(0, 40) + '... [truncated, length: ' + value.length + ']';
      }
      // For medium strings, just return them normally - the CSS will handle wrapping
      return value;
    }
    return value;
  };

  // Format the JSON with custom replacer
  return JSON.stringify(obj, replacer, 2);
};

export function EventLog() {
  const { events } = useRealtime();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Scroll to bottom when new events are added if auto-scroll is enabled
  React.useEffect(() => {
    if (scrollRef.current && autoScroll) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  return (
    <div className="h-full flex flex-col">
      <div className="py-2 px-4 border-b bg-gradient-to-r flex-shrink-0">
        <div className="flex justify-between items-center h-8">
          <h2 className="text-sm flex items-center gap-2 font-semibold">
            <Activity className="h-4 w-4 text-brand" />
            Event Log
            {events.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {events.length}
              </Badge>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-scroll" className="text-xs text-muted-foreground">
              Auto-scroll
            </Label>
            <Switch id="auto-scroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                No events recorded yet
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {events.map((event) => (
                  <AccordionItem
                    key={event.id}
                    value={event.id}
                    className={cn(
                      'text-xs rounded border',
                      event.source === 'server'
                        ? ''
                        : event.source === 'client'
                          ? 'bg-green-400/5 border-green-400/10'
                          : 'bg-red-50 border-red-200'
                    )}
                  >
                    <AccordionTrigger
                      className={cn(
                        'py-2 px-3 hover:no-underline',
                        event.source === 'server'
                          ? 'text-blue-500'
                          : event.source === 'client'
                            ? 'text-green-500'
                            : 'text-red-500'
                      )}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium flex items-center gap-1.5">
                          {event.source === 'client' ? '↑ ' : '↓ '}
                          {event.type}
                          {event.count && event.count > 1 && (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 border-green-400/40 bg-green-700/50 text-white"
                            >
                              {event.count}
                            </Badge>
                          )}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(event.time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      {event.event && (
                        <ScrollArea className="text-xs p-2 border border-t">
                          <div className="p-0 max-h-40">
                            <pre className="whitespace-pre-wrap break-words break-all hyphens-auto overflow-wrap-anywhere text-xs overflow-x-auto">
                              {formatJsonWithBase64(event.event)}
                            </pre>
                          </div>
                        </ScrollArea>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
