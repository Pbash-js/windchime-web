// Declare types for Tauri APIs
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

type TauriWindow = typeof import('@tauri-apps/api/window');

let tauriWindow: TauriWindow | null = null;

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && !!window.__TAURI__;
};

// Dynamic imports for Tauri APIs
const getTauriWindow = async (): Promise<TauriWindow | null> => {
  if (typeof window === 'undefined') return null;
  if (!tauriWindow && isTauri()) {
    tauriWindow = await import('@tauri-apps/api/window');
  }
  return tauriWindow;
};

export interface WindowOptions {
  title?: string;
  width?: number;
  height?: number;
  url?: string;
  center?: boolean;
  resizable?: boolean;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
}

export const createWindow = async (label: string, options: WindowOptions = {}) => {
  if (typeof window === 'undefined') return null;
  if (!isTauri()) {
    console.warn('Tauri is not available in the browser');
    return null;
  }

  try {
    const tauri = await getTauriWindow();
    if (!tauri) return null;

    const { WebviewWindow } = tauri;
    const defaultOptions: WindowOptions = {
      title: 'Windchime',
      width: 1024,
      height: 768,
      center: true,
      resizable: true,
      fullscreen: false,
      alwaysOnTop: false,
      ...options,
    };

    const webview = new WebviewWindow(label, {
      url: defaultOptions.url || '/',
      title: defaultOptions.title,
      width: defaultOptions.width,
      height: defaultOptions.height,
      center: defaultOptions.center,
      resizable: defaultOptions.resizable,
      fullscreen: defaultOptions.fullscreen,
      alwaysOnTop: defaultOptions.alwaysOnTop,
    });

    return webview;
  } catch (error) {
    console.error('Error creating window:', error);
    return null;
  }
};

export const closeCurrentWindow = async () => {
  if (typeof window === 'undefined' || !isTauri()) return;
  
  const tauri = await getTauriWindow();
  if (!tauri) return;
  
  const { appWindow } = tauri;
  await appWindow.close();
};

export const minimizeCurrentWindow = async () => {
  if (typeof window === 'undefined' || !isTauri()) return;
  
  const tauri = await getTauriWindow();
  if (!tauri) return;
  
  const { appWindow } = tauri;
  await appWindow.minimize();
};

export const maximizeCurrentWindow = async () => {
  if (typeof window === 'undefined' || !isTauri()) return;
  
  const tauri = await getTauriWindow();
  if (!tauri) return;
  
  const { appWindow } = tauri;
  await appWindow.toggleMaximize();
};
