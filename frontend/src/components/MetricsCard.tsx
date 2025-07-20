import React from 'react';

interface MetricsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  className?: string;
  valueColor?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  className = '',
  valueColor = 'text-orange-400'
}) => {
  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="text-center">
        <div className="text-gray-400 text-sm font-mono tracking-wider uppercase mb-2">
          {title}
        </div>
        <div className={`text-4xl font-bold font-mono ${valueColor} mb-1`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && (
          <div className="text-gray-500 text-xs font-mono tracking-wide uppercase">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}; 