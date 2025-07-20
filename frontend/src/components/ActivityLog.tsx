import React from 'react';
import type { VisitorEvent } from '../types/analytics';

interface ActivityLogProps {
  events: VisitorEvent[];
  className?: string;
  onClear?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  events,
  className = '',
  onClear
}) => {
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '00:00:00';
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '--/--/----';
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return '📱';
      case 'desktop':
        return '🖥️';
      case 'tablet':
        return '📱';
      default:
        return '💻';
    }
  };

  const getCountryFlag = (country: string) => {
    // Simple mapping for demo - in production, use a proper flag library
    const flags: Record<string, string> = {
      'India': '🇮🇳',
      'USA': '🇺🇸',
      'UK': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Japan': '🇯🇵',
      'Brazil': '🇧🇷',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
    };
    return flags[country] || '🌍';
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-orange-400 font-mono text-lg tracking-wider uppercase">
          Activity Log
        </h3>
        {onClear && (
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-orange-400 font-mono text-xs tracking-wider uppercase transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="h-80 overflow-y-auto p-4">
        {events.length === 0 ? (
          <div className="text-gray-500 font-mono text-sm text-center py-8">
            No visitor activity
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div
                key={`${event.session_id}-${event.timestamp}-${index}`}
                className="border-l-2 border-orange-500 pl-3 py-2 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-orange-400 font-mono text-xs">
                    {formatDate(event.timestamp)} {formatTime(event.timestamp)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span>{getCountryFlag(event.country)}</span>
                    <span>{getDeviceIcon(event.metadata.device)}</span>
                  </div>
                </div>
                
                <div className="text-gray-300 font-mono text-sm">
                  Visitor <span className="text-orange-400">{event.session_id.slice(-6)}</span>
                  {' '}viewed <span className="text-blue-400">{event.page}</span>
                </div>
                
                <div className="text-gray-500 font-mono text-xs mt-1">
                  {event.country} • {event.metadata.device} • from {event.metadata.referrer}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 