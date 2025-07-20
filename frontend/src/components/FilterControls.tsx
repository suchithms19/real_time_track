import React from 'react';
import type { FilterState, AnalyticsSummary } from '../types/analytics';

interface FilterControlsProps {
  filter: FilterState;
  analytics: AnalyticsSummary;
  onFilterChange: (filter: FilterState) => void;
  className?: string;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  analytics,
  onFilterChange,
  className = ''
}) => {
  const countries = ['India', 'USA', 'UK', 'Germany', 'France', 'Japan', 'Brazil', 'Canada', 'Australia'];
  const pages = Object.keys(analytics.pages_visited);

  const handleCountryChange = (country: string) => {
    const newFilter = { ...filter };
    if (country === 'all') {
      delete newFilter.country;
    } else {
      newFilter.country = country;
    }
    onFilterChange(newFilter);
  };

  const handlePageChange = (page: string) => {
    const newFilter = { ...filter };
    if (page === 'all') {
      delete newFilter.page;
    } else {
      newFilter.page = page;
    }
    onFilterChange(newFilter);
  };

  const clearFilters = () => {
    onFilterChange({});
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

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-orange-400 font-mono text-lg tracking-wider uppercase">
          Filters
        </h3>
        {(filter.country || filter.page) && (
          <button
            onClick={clearFilters}
            className="text-gray-400 hover:text-orange-400 font-mono text-xs tracking-wider uppercase transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Country Filter */}
        <div>
          <label className="block text-gray-400 font-mono text-sm mb-2 tracking-wider uppercase">
            Country
          </label>
          <select
            value={filter.country || 'all'}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300 font-mono text-sm focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="all">All Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {getCountryFlag(country)} {country}
              </option>
            ))}
          </select>
        </div>

        {/* Page Filter */}
        <div>
          <label className="block text-gray-400 font-mono text-sm mb-2 tracking-wider uppercase">
            Page
          </label>
          <select
            value={filter.page || 'all'}
            onChange={(e) => handlePageChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-gray-300 font-mono text-sm focus:outline-none focus:border-orange-500 transition-colors"
          >
            <option value="all">All Pages</option>
            {pages.map((page) => (
              <option key={page} value={page}>
                {page} ({analytics.pages_visited[page]})
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Display */}
        {(filter.country || filter.page) && (
          <div className="pt-2 border-t border-gray-700">
            <div className="text-gray-400 font-mono text-xs mb-2 tracking-wider uppercase">
              Active Filters:
            </div>
            <div className="flex flex-wrap gap-2">
              {filter.country && (
                <span className="bg-orange-500 text-black px-2 py-1 rounded text-xs font-mono">
                  {getCountryFlag(filter.country)} {filter.country}
                </span>
              )}
              {filter.page && (
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-mono">
                  {filter.page}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 