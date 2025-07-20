import React, { useState } from 'react';
import type { SessionData } from '../types/analytics';

interface ActiveSessionsProps {
  sessions: SessionData[];
  className?: string;
  onClear?: () => void;
}

export const ActiveSessions: React.FC<ActiveSessionsProps> = ({
  sessions,
  className = '',
  onClear
}) => {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatLastActivity = (timestamp: string) => {
    try {
      const now = Date.now();
      const activityTime = new Date(timestamp).getTime();
      const diffMs = now - activityTime;
      const diffSeconds = Math.floor(diffMs / 1000);
      
      if (diffSeconds < 60) return `${diffSeconds}s ago`;
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ago`;
    } catch {
      return 'Unknown';
    }
  };

  const getCountryFlag = (country: string) => {
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

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-orange-400 font-mono text-lg tracking-wider uppercase">
          Active Sessions
        </h3>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400 font-mono text-sm">
            {sessions.length} Active
          </span>
          {onClear && (
            <button
              onClick={onClear}
              className="text-gray-400 hover:text-orange-400 font-mono text-xs tracking-wider uppercase transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      <div className="h-80 overflow-y-auto p-4">
        {sessions.length === 0 ? (
          <div className="text-gray-500 font-mono text-sm text-center py-8">
            No active sessions
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.session_id}
                className={`border border-gray-700 rounded-lg p-3 cursor-pointer transition-all hover:border-orange-500 ${
                  selectedSession === session.session_id ? 'border-orange-500 bg-gray-800' : ''
                }`}
                onClick={() => setSelectedSession(
                  selectedSession === session.session_id ? null : session.session_id
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-400 font-mono text-sm">
                      {session.session_id.slice(-8)}
                    </span>
                    <span>{getCountryFlag(session.country)}</span>
                    <span>{getDeviceIcon(session.device)}</span>
                  </div>
                  <div className="text-gray-400 font-mono text-xs">
                    {formatLastActivity(session.last_activity)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="text-gray-300 font-mono text-sm">
                    Current: <span className="text-blue-400">{session.current_page}</span>
                  </div>
                  <div className="text-gray-400 font-mono text-xs">
                    Duration: {formatDuration(session.duration)}
                  </div>
                </div>
                
                <div className="text-gray-500 font-mono text-xs">
                  {session.country} • {session.device}
                </div>
                
                {selectedSession === session.session_id && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-orange-400 font-mono text-sm mb-2">Journey:</div>
                    <div className="flex flex-wrap gap-2">
                      {session.journey.map((page, index) => (
                        <div key={index} className="flex items-center">
                          <span className="bg-gray-800 text-blue-400 px-2 py-1 rounded text-xs font-mono">
                            {page}
                          </span>
                          {index < session.journey.length - 1 && (
                            <span className="text-gray-500 mx-1">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-gray-500 font-mono text-xs mt-2">
                      {session.journey.length} pages visited
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 