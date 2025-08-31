"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CombinedData } from '@/types';

interface WebSocketContextType {
  combinedData: CombinedData | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [combinedData, setCombinedData] = useState<CombinedData | null>(null);
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  useEffect(() => {
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data: CombinedData = JSON.parse(event.data);
        setCombinedData(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        // You might want to implement a more sophisticated backoff strategy here
        // For simplicity, we'll just reload the page or re-initialize the WS
        window.location.reload(); 
      }, 3000); 
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close(); // Close to trigger reconnect logic
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ combinedData }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
