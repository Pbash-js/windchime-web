import { useEffect, useState } from 'react';
import { isTauri } from '@/lib/tauri';

type TauriStatus = {
  isDesktop: boolean;
  isLoading: boolean;
};

export function useTauri(): TauriStatus {
  const [status, setStatus] = useState<TauriStatus>({
    isDesktop: false,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    const checkTauri = async () => {
      try {
        const tauriAvailable = isTauri();
        if (mounted) {
          setStatus({
            isDesktop: tauriAvailable,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking Tauri:', error);
        if (mounted) {
          setStatus({
            isDesktop: false,
            isLoading: false,
          });
        }
      }
    };

    // Only run on client side
    if (typeof window === 'undefined') {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    checkTauri();

    return () => {
      mounted = false;
    };
  }, []);

  return status;
}

export function useWindowControls(windowId?: string) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { isDesktop, isLoading } = useTauri();

  useEffect(() => {
    if (!isDesktop) return;

    const setupWindowListeners = async () => {
      const { appWindow } = await import('@tauri-apps/api/window');
      
      const updateWindowState = async () => {
        try {
          const [maximized, minimized] = await Promise.all([
            appWindow.isMaximized(),
            appWindow.isMinimized()
          ]);
          setIsMaximized(maximized);
          setIsMinimized(minimized);
        } catch (error) {
          console.error('Error updating window state:', error);
        }
      };
      
      // Set up event listeners
      const unlistenResize = await appWindow.onResized(updateWindowState);
      
      // Initial state
      updateWindowState();

      return () => {
        // Clean up event listeners
        if (unlistenResize && typeof unlistenResize === 'function') {
          unlistenResize();
        }
      };
    };

    setupWindowListeners();
  }, [isDesktop, windowId]);

  const minimize = async () => {
    if (!isDesktop) return;
    try {
      const { appWindow } = await import('@tauri-apps/api/window');
      await appWindow.minimize();
      setIsMinimized(true);
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const maximize = async () => {
    if (!isDesktop) return;
    const { appWindow } = await import('@tauri-apps/api/window');
    await appWindow.toggleMaximize();
  };

  const close = async () => {
    if (!isDesktop) return;
    const { appWindow } = await import('@tauri-apps/api/window');
    await appWindow.close();
  };

  // Update window state in the store if windowId is provided
  const updateWindowState = async (state: { isMinimized?: boolean; isMaximized?: boolean }) => {
    if (!isDesktop || !windowId) return;
    
    try {
      const { appWindow } = await import('@tauri-apps/api/window');
      
      if (state.isMinimized !== undefined) {
        if (state.isMinimized) {
          await appWindow.minimize();
          setIsMinimized(true);
        } else {
          await appWindow.unminimize();
          setIsMinimized(false);
        }
      }
      
      if (state.isMaximized !== undefined) {
        if (state.isMaximized) {
          await appWindow.maximize();
          setIsMaximized(true);
        } else {
          await appWindow.unmaximize();
          setIsMaximized(false);
        }
      }
    } catch (error) {
      console.error('Failed to update window state:', error);
    }
  };

  return {
    minimize,
    maximize,
    close,
    isMaximized,
    isMinimized,
    updateWindowState,
  };
}
