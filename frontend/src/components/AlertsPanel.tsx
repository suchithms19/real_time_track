import React from 'react';
import type { AlertEvent } from '../types/analytics';

interface AlertsPanelProps {
  alerts: AlertEvent['data'][];
  onClear?: () => void;
  className?: string;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onClear,
  className = ''
}) => {
  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'border-red-500 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'info':
        return 'border-blue-500 bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getAlertTextColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-orange-400 font-mono text-lg tracking-wider uppercase">
          System Alerts
        </h3>
        <div className="flex items-center space-x-4">
          {alerts.length > 0 && (
            <span className="text-gray-400 font-mono text-sm">
              {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
            </span>
          )}
          {onClear && alerts.length > 0 && (
            <button
              onClick={onClear}
              className="text-gray-400 hover:text-orange-400 font-mono text-xs tracking-wider uppercase transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      <div className="h-64 overflow-y-auto p-4">
        {alerts.length === 0 ? (
          <div className="text-gray-500 font-mono text-sm text-center py-8">
            No system alerts
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`border-l-4 p-3 rounded ${getAlertColor(alert.level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getAlertIcon(alert.level)}</span>
                    <span className={`font-mono text-xs tracking-wider uppercase ${getAlertTextColor(alert.level)}`}>
                      {alert.level}
                    </span>
                  </div>
                  <div className="text-gray-400 font-mono text-xs">
                    {new Date().toLocaleTimeString('en-US', { hour12: false })}
                  </div>
                </div>
                
                <div className="mt-2 text-gray-300 font-mono text-sm">
                  {alert.message}
                </div>
                
                {alert.details && Object.keys(alert.details).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <div className="text-gray-400 font-mono text-xs mb-1">Details:</div>
                    <div className="space-y-1">
                      {Object.entries(alert.details).map(([key, value]) => (
                        <div key={key} className="text-gray-500 font-mono text-xs">
                          <span className="text-gray-400">{key}:</span> {String(value)}
                        </div>
                      ))}
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