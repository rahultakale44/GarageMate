import React from 'react';

interface MapFallbackProps {
  message?: string;
}

const MapFallback: React.FC<MapFallbackProps> = ({ message = 'Map is unavailable right now.' }) => (
  <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-dark-300 bg-dark-50 px-4 text-center text-sm text-dark-600">
    <div>
      <p className="font-medium text-dark-900">Map unavailable</p>
      <p className="mt-1">{message}</p>
    </div>
  </div>
);

export default MapFallback;
