import React from 'react';

interface ApiStatusIndicatorProps {
  status: 'checking' | 'connected' | 'disconnected';
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ status }) => {
  const statusConfig = {
    checking: {
      color: 'bg-yellow-500',
      text: 'API Status: Checking...',
      title: 'Attempting to connect to the backend API.',
      animate: true,
    },
    connected: {
      color: 'bg-green-500',
      text: 'API: Connected',
      title: 'Successfully connected to the backend API.',
      animate: false,
    },
    disconnected: {
      color: 'bg-red-500',
      text: 'API: Disconnected',
      title: 'Could not connect to the backend API. Data is loaded from a local cache.',
      animate: false,
    },
  };

  const { color, text, title, animate } = statusConfig[status];

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg" title={title}>
      <div className="relative flex items-center justify-center h-3 w-3">
        {animate && <span className={`absolute h-full w-full rounded-full ${color} opacity-75 animate-ping`}></span>}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`}></span>
      </div>
      <span className="text-xs font-medium text-slate-300">{text}</span>
    </div>
  );
};

export default ApiStatusIndicator;
