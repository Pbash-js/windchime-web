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
import { MediaControls } from "./media-controls";
import { useWindows } from "@/hooks/use-windows";
import { CheckSquare, FileText, Timer, Calendar, Settings, Music } from "lucide-react";

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
  if (windows.tasks?.isOpen) {
    components.tasks = createWindow('tasks', 'Tasks', <CheckSquare className="h-4 w-4" />, <TaskPanel />);
  }

  if (windows.notes?.isOpen) {
    components.notes = createWindow('notes', 'Notes', <FileText className="h-4 w-4" />, <NotesPanel />);
  }

  if (windows.timer?.isOpen) {
    components.timer = createWindow('timer', 'Timer', <Timer className="h-4 w-4" />, <TimerPanel />);
  }

  if (windows.calendar?.isOpen) {
    components.calendar = createWindow('calendar', 'Calendar', <Calendar className="h-4 w-4" />, <CalendarWindow />, 800, 600);
  }

  if (windows.settings?.isOpen) {
    components.settings = createWindow('settings', 'Settings', <Settings className="h-4 w-4" />, <SettingsWindow />, 600, 500);
  }

  if (windows.playlist?.isOpen) {
    components.playlist = createWindow('playlist', 'Playlist', <Music className="h-4 w-4" />, <PlaylistWindow />);
  }

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
