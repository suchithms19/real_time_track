import React, { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatusIndicator } from './StatusIndicator';
import { MetricsCard } from './MetricsCard';
import { ActivityLog } from './ActivityLog';
import { ActiveSessions } from './ActiveSessions';
import { FilterControls } from './FilterControls';
import { AlertsPanel } from './AlertsPanel';
import { SoundControls } from './SoundControls';
import type { FilterState } from '../types/analytics';

export const Dashboard: React.FC = () => {
  const {
    dashboardState,
    reconnect,
    requestDetailedStats,
    trackDashboardAction,
    clearAlerts,
    clearEvents,
    clearSessions,
    sound_state,
    toggle_sound,
    set_volume,
    is_new_visitor_flash,
  } = useWebSocket();

  const [currentFilter, setCurrentFilter] = useState<FilterState>({});

  const handleFilterChange = (newFilter: FilterState) => {
    setCurrentFilter(newFilter);
    requestDetailedStats(newFilter);
    trackDashboardAction('filter_applied', newFilter);
  };

  const handleClearData = () => {
    clearEvents();
    clearSessions();
    trackDashboardAction('clear_all_data', {});
  };

  const getTopPages = () => {
    const pages = Object.entries(dashboardState.analytics.pages_visited)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    return pages.map(([page, count]) => ({ page, count }));
  };

  const formatUptime = () => {
    // Calculate uptime since component mount (simplified)
    const now = Date.now();
    const startTime = React.useMemo(() => now, []);
    const uptime = Math.floor((now - startTime) / 1000);
    
    if (uptime < 60) return `${uptime}s`;
    const minutes = Math.floor(uptime / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-orange-400 font-mono text-3xl tracking-wider uppercase">
            Visitor Analytics
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-gray-400 font-mono text-sm">
              v2.1.7 CLASSIFIED
            </div>
            <div className="text-gray-400 font-mono text-sm">
              LAST UPDATE: {new Date().toLocaleString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })} UTC
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <StatusIndicator status={dashboardState.connectionStatus} />
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 font-mono text-sm">
              DASHBOARDS CONNECTED: {dashboardState.totalDashboards}
            </span>
            <span className="text-gray-400 font-mono text-sm">
              UPTIME: {formatUptime()}
            </span>
            {dashboardState.connectionStatus === 'disconnected' && (
              <button
                onClick={reconnect}
                className="bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded font-mono text-sm tracking-wider uppercase transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Visitor Metrics - Top Row */}
        <div className="col-span-12 mb-4">
          <div className="grid grid-cols-4 gap-4">
            <div className={`transition-all duration-200 ${is_new_visitor_flash ? 'animate-pulse bg-green-500/20 rounded-lg' : ''}`}>
              <MetricsCard
                title="Active Visitors"
                value={dashboardState.analytics.total_active}
                subtitle="Live Sessions"
                valueColor="text-green-400"
              />
            </div>
            <MetricsCard
              title="Total Today"
              value={dashboardState.analytics.total_today}
              subtitle="All Visits"
              valueColor="text-blue-400"
            />
            <MetricsCard
              title="Pages Tracked"
              value={Object.keys(dashboardState.analytics.pages_visited).length}
              subtitle="Unique URLs"
              valueColor="text-purple-400"
            />
            <MetricsCard
              title="Active Alerts"
              value={dashboardState.alerts.length}
              subtitle="System Status"
              valueColor={dashboardState.alerts.length > 0 ? "text-red-400" : "text-gray-400"}
            />
          </div>
        </div>

        {/* Activity Log - Left Column */}
        <div className="col-span-4">
          <ActivityLog
            events={dashboardState.recentEvents}
            onClear={clearEvents}
            className="h-full"
          />
        </div>

        {/* Active Sessions - Center Column */}
        <div className="col-span-4">
          <ActiveSessions
            sessions={dashboardState.activeSessions}
            onClear={clearSessions}
            className="h-full"
          />
        </div>

        {/* Filters and Alerts - Right Column */}
        <div className="col-span-4 space-y-4">
          <FilterControls
            filter={currentFilter}
            analytics={dashboardState.analytics}
            onFilterChange={handleFilterChange}
          />
          
          <SoundControls
            sound_state={sound_state}
            toggle_sound={toggle_sound}
            set_volume={set_volume}
          />
          
          <AlertsPanel
            alerts={dashboardState.alerts}
            onClear={clearAlerts}
          />
        </div>

        {/* Top Pages Chart - Bottom Row */}
        <div className="col-span-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-orange-400 font-mono text-lg tracking-wider uppercase">
                Page Activity Overview
              </h3>
              <button
                onClick={handleClearData}
                className="text-gray-400 hover:text-orange-400 font-mono text-xs tracking-wider uppercase transition-colors"
              >
                Clear All Data
              </button>
            </div>
            
            <div className="space-y-3">
              {getTopPages().length === 0 ? (
                <div className="text-gray-500 font-mono text-sm text-center py-8">
                  No page data available
                </div>
              ) : (
                getTopPages().map(({ page, count }) => {
                  const maxCount = Math.max(...Object.values(dashboardState.analytics.pages_visited));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={page} className="flex items-center space-x-4">
                      <div className="w-24 text-blue-400 font-mono text-sm truncate">
                        {page}
                      </div>
                      <div className="flex-1 bg-gray-800 rounded-full h-4 relative">
                        <div
                          className="bg-orange-500 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-mono text-xs">
                            {count}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-400 font-mono text-sm w-12 text-right">
                        {percentage.toFixed(0)}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* System Information - Bottom Right */}
        <div className="col-span-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h3 className="text-orange-400 font-mono text-lg tracking-wider uppercase mb-4">
              System Information
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400 font-mono text-sm">Connection Status</span>
                <span className={`font-mono text-sm ${
                  dashboardState.connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {dashboardState.connectionStatus.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400 font-mono text-sm">Active Sessions</span>
                <span className="text-green-400 font-mono text-sm">
                  {dashboardState.activeSessions.length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400 font-mono text-sm">Recent Events</span>
                <span className="text-blue-400 font-mono text-sm">
                  {dashboardState.recentEvents.length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400 font-mono text-sm">Total Dashboards</span>
                <span className="text-purple-400 font-mono text-sm">
                  {dashboardState.totalDashboards}
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-mono text-sm">Environment</span>
                  <span className="text-orange-400 font-mono text-sm">PRODUCTION</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 