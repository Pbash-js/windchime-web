"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
  isInitialLoad: boolean;
  markAsLoaded: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMarkedAsLoaded, setIsMarkedAsLoaded] = useState(false);

  // Mark the app as fully loaded
  const markAsLoaded = useCallback(() => {
    if (isMarkedAsLoaded) return;
    
    setIsMarkedAsLoaded(true);
    
    // Minimum loading time for smooth transition (1 second)
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsInitialLoad(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isMarkedAsLoaded]);

  // Set a maximum loading time (5 seconds) as a fallback
  useEffect(() => {
    const maxLoadTime = setTimeout(() => {
      if (isLoading) {
        console.log('Maximum load time reached, forcing load complete');
        markAsLoaded();
      }
    }, 5000);

    return () => clearTimeout(maxLoadTime);
  }, [isLoading, markAsLoaded]);

  const setLoading = useCallback((loading: boolean) => {
    if (!loading) {
      markAsLoaded();
    } else {
      setIsLoading(true);
    }
  }, [markAsLoaded]);

  return (
    <LoadingContext.Provider value={{ 
      isLoading, 
      setLoading, 
      isInitialLoad,
      markAsLoaded 
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
