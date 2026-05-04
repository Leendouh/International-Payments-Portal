import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

/**
 * Real-time Connection Status Indicator
 * Shows the current WebSocket connection status
 */

const RealtimeStatus = () => {
  const { realtimeStatus, websocketStatus } = useAuth();

  const getStatusColor = () => {
    switch (realtimeStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (realtimeStatus) {
      case 'connected':
        return <Wifi size={16} className="animate-pulse" />;
      case 'connecting':
        return <Loader2 size={16} className="animate-spin" />;
      case 'disconnected':
        return <WifiOff size={16} />;
      default:
        return <WifiOff size={16} />;
    }
  };

  const getStatusText = () => {
    switch (realtimeStatus) {
      case 'connected':
        return 'Real-time active';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Real-time offline';
      default:
        return 'Unknown status';
    }
  };

  // Don't show if user is not logged in
  if (!websocketStatus?.userId) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${getStatusColor()} transition-colors duration-300`}>
      {getStatusIcon()}
      <span className="hidden sm:inline">{getStatusText()}</span>
      
      {/* Show detailed status in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="ml-2 text-xs opacity-75">
          {websocketStatus?.connected && (
            <span>ID: {websocketStatus.userId?.slice(0, 8)}...</span>
          )}
        </div>
      )}
    </div>
  );
};

export default RealtimeStatus;
