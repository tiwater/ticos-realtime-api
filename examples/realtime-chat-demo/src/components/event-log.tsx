"use client";

import React, { useRef, useState } from 'react';
import { useRealtime } from '@/contexts/realtime-context';
import { Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

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
            <span className="text-xs text-muted-foreground">Auto-scroll</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoScroll} 
                onChange={(e) => setAutoScroll(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-9 h-5 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
            </label>
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
                      "text-xs rounded border shadow-sm",
                      event.source === 'system' 
                        ? 'bg-slate-100 border-slate-200' 
                        : event.source === 'server' 
                          ? 'bg-green-400/20 border-green-300/20' 
                          : event.source === 'client'
                            ? 'bg-blue-400/20 border-blue-300/20'
                            : 'bg-red-50 border-red-200'
                    )}
                  >
                    <AccordionTrigger 
                      className={cn(
                        "py-2 px-3 hover:no-underline",
                        event.source === 'system' 
                          ? 'text-slate-700' 
                          : event.source === 'server' 
                            ? 'text-green-700' 
                            : event.source === 'client'
                              ? 'text-blue-700'
                              : 'text-red-700'
                      )}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium flex items-center gap-1.5">
                          {event.type}
                          {event.count && event.count > 1 && (
                            <Badge variant="outline" className="text-xs py-0.5 border-brand/40 bg-brand/80 text-white">
                              {event.count}
                            </Badge>
                          )}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      {event.data && (
                        <ScrollArea className="text-xs p-2 border border-t">
                          <div className="p-0 max-h-40">
                            <pre>{JSON.stringify(event.data, null, 2)}</pre>
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
