'use client';

import ChatContainer from '@/components/chat-container';
import { EventLog } from '@/components/event-log';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { useRealtime } from '@/contexts/realtime-context';
import { Github } from 'lucide-react';

export default function Home() {
  const { isConnected, isLoading } = useRealtime();

  return (
    <main className="flex h-screen flex-col">
      <div className="w-full mx-auto flex flex-col gap-4 h-screen p-4">
        <header className="flex flex-col md:flex-row items-center justify-between p-4 rounded-lg flex-shrink-0">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ticos Realtime Chat</h1>
            <p className="hidden md:block text-muted-foreground mt-2 mx-auto md:mx-0 text-sm md:text-base">
              A demonstration of the{' '}
              <a
                href="https://github.com/tiwater/ticos-realtime-api"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Ticos Realtime API
              </a>{' '}
              .
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-9 w-9 rounded-full hover:bg-brand/10 hover:text-brand hover:border-brand/20"
            >
              <a
                href="https://github.com/tiwater/ticos-realtime-api"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <ThemeSwitcher />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
          <div className="md:col-span-2 h-[calc(100vh-160px)] shadow-md overflow-hidden rounded-lg border bg-card">
            <ChatContainer />
          </div>

          <div className="hidden md:block h-[calc(100vh-160px)] overflow-hidden shadow-md rounded-lg border bg-card">
            <EventLog />
          </div>
        </div>
      </div>
    </main>
  );
}
