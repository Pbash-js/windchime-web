'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Window } from "./window";
import { TaskPanel } from "./task-panel";
import { NotesPanel } from "./notes-panel";
import { TimerPanel } from "./timer-panel";
import { CalendarWindow } from "./calendar-window";
import { SettingsWindow } from "./settings-window";
import { PlaylistWindow } from "./playlist-window";
import { CustomLinksWindow } from "./custom-links-window";
import MediaControls from "./media-controls";
import { useWindows, isWidgetWindow, WidgetWindowType } from "@/hooks/use-windows";
import { CheckSquare, FileText, Timer, Calendar, Settings, Music, Link as LinkIcon, LayoutGrid } from "lucide-react";
import { WidgetWindow } from "./widget-window";
import { WidgetsPanel } from "./widgets-panel";

// Track active widget windows to avoid duplicates
const widgetWindows = new Map<string, { name: string; url: string }>();

export function registerWidgetWindow(widgetId: string, name: string, url: string) {
  widgetWindows.set(widgetId, { name, url });
  return widgetId;
}

export function unregisterWidgetWindow(widgetId: string) {
  widgetWindows.delete(widgetId);
}

// Define the WindowPortal component for rendering windows in a portal
const WindowPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  
  // Get the portal container (created in layout.tsx)
  const portalRoot = typeof document !== 'undefined' 
    ? document.getElementById('window-portal') 
    : null;

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Don't render until mounted and portal exists
  if (!mounted || !portalRoot) {
    return null;
  }

  // Create portal with debug styles in development
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{
        overflow: 'visible'
      }}
    >
      {children}
    </div>,
    portalRoot
  );
};

// Helper function to create window components based on window state
type WindowComponents = Record<string, React.ReactNode>;

const createWindowComponents = (windows: any): WindowComponents => {
  const components: WindowComponents = {};

  // Helper to create window component
  const createWindow = (
    key: string, 
    title: string, 
    icon: React.ReactNode, 
    content: React.ReactNode,
    width: number = 400,
    height: number = 500
  ) => (
    <Window
      key={key}
      title={title}
      icon={icon}
      type={key as any}
      defaultWidth={width}
      defaultHeight={height}
    >
      {content}
    </Window>
  );

  // Create each window if it's open
  Object.entries(windows).forEach(([key, windowState]) => {
    const state = windowState as { isOpen: boolean };
    
    if (!state.isOpen) return;

    // Handle regular windows
    switch (key) {
      case 'tasks':
        components.tasks = createWindow('tasks', 'Tasks', <CheckSquare className="h-4 w-4" />, <TaskPanel />);
        break;
      case 'notes':
        components.notes = createWindow('notes', 'Notes', <FileText className="h-4 w-4" />, <NotesPanel />);
        break;
      case 'timer':
        components.timer = createWindow('timer', 'Timer', <Timer className="h-4 w-4" />, <TimerPanel />);
        break;
      case 'calendar':
        components.calendar = createWindow('calendar', 'Calendar', <Calendar className="h-4 w-4" />, <CalendarWindow />, 800, 600);
        break;
      case 'settings':
        components.settings = createWindow('settings', 'Settings', <Settings className="h-4 w-4" />, <SettingsWindow />, 600, 500);
        break;
      case 'playlist':
        components.playlist = createWindow('playlist', 'Playlist', <Music className="h-4 w-4" />, <PlaylistWindow />);
        break;
      case 'customLinks':
        components.customLinks = createWindow('customLinks', 'Custom Links', <LinkIcon className="h-4 w-4" />, <CustomLinksWindow />, 450, 500);
        break;
      case 'widgets':
        components.widgets = createWindow('widgets', 'Widgets', <LayoutGrid className="h-4 w-4" />, <WidgetsPanel />, 600, 700);
        break;
      default:
        // Handle widget windows
        if (isWidgetWindow(key)) {
          const widgetInfo = widgetWindows.get(key);
          if (widgetInfo) {
            components[key] = createWindow(
              key,
              widgetInfo.name,
              <LayoutGrid className="h-4 w-4" />,
              <WidgetWindow 
                widgetId={key} 
                widgetName={widgetInfo.name} 
                widgetUrl={widgetInfo.url} 
              />,
              800,
              600
            );
          }
        }
        break;
    }
  });

  return components;
};

// Main WindowManager component
export function WindowManager() {
  const [isMounted, setIsMounted] = useState(false);
  const { windows } = useWindows();

  // Set mounted state on client
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Memoize window components to prevent unnecessary re-renders
  const windowComponents = useMemo(() => {
    return createWindowComponents(windows);
  }, [windows]);

  // Don't render on server
  if (!isMounted) {
    return null;
  }

  // Get all visible windows
  const visibleWindows = Object.values(windowComponents).filter(Boolean);
  
  return (
    <>
      {visibleWindows.length > 0 && (
        <WindowPortal>
          {visibleWindows}
        </WindowPortal>
      )}
      <MediaControls />
    </>
  );
}
