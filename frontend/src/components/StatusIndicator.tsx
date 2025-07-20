import React from 'react';
import type { ConnectionStatus } from '../types/analytics';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '' }) => {
  const getStatusConfig = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          pulse: 'animate-pulse',
          text: 'CONNECTED',
          icon: '●'
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          pulse: 'animate-pulse',
          text: 'CONNECTING',
          icon: '◐'
        };
      case 'reconnecting':
        return {
          color: 'bg-orange-500',
          pulse: 'animate-pulse',
          text: 'RECONNECTING',
          icon: '◑'
        };
      case 'disconnected':
        return {
          color: 'bg-red-500',
          pulse: '',
          text: 'DISCONNECTED',
          icon: '○'
        };
      default:
        return {
          color: 'bg-gray-500',
          pulse: '',
          text: 'UNKNOWN',
          icon: '?'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-3 h-3 rounded-full ${config.color} ${config.pulse}`}></div>
      <span className="text-orange-400 font-mono text-sm tracking-wider">
        {config.text}
      </span>
    </div>
  );
}; 