'use client';

import { useEffect, useState } from 'react';
import { useWindows } from '@/hooks/use-windows';
import { Window } from './window';
import { Loader2 } from 'lucide-react';

interface WidgetWindowProps {
  widgetId: string;
  widgetName: string;
  widgetUrl: string;
}

export function WidgetWindow({ widgetId, widgetName, widgetUrl }: WidgetWindowProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { closeWindow } = useWindows();

  // Robustly normalize URL
  function normalizeUrl(url: string): string | null {
    try {
      // Try parsing as-is
      new URL(url);
      return url;
    } catch {
      // Try prepending https://
      try {
        const urlWithProtocol = `https://${url}`;
        new URL(urlWithProtocol);
        return urlWithProtocol;
      } catch {
        return null;
      }
    }
  }
  const normalizedUrl = normalizeUrl(widgetUrl);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading {widgetName}...</p>
          </div>
        </div>
      )}
      {normalizedUrl ? (
        <iframe
          src={normalizedUrl}
          title={widgetName}
          className={`w-full h-full ${isLoading ? 'hidden' : 'block'}`}
          onLoad={handleIframeLoad}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          allow="clipboard-read; clipboard-write"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-destructive">Invalid URL: {widgetUrl}</p>
            <p className="text-xs text-muted-foreground">Please check the widget URL in settings.</p>
          </div>
        </div>
      )}
    </div>
  );
}

