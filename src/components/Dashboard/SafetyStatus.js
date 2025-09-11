import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';

const SafetyStatus = ({ status, lastUpdate, onUpdateLocation }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'safe':
        return {
          icon: ShieldCheck,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          message: 'You are in a safe area',
          description: 'Your location is being monitored and you are in a secure zone.',
        };
      case 'warning':
        return {
          icon: ShieldAlert,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          message: 'Please stay alert',
          description: 'You may be in an area that requires extra caution.',
        };
      case 'danger':
        return {
          icon: Shield,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          message: 'High risk area detected',
          description: 'Please leave this area immediately and contact authorities.',
        };
      default:
        return {
          icon: Shield,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          message: 'Status unknown',
          description: 'Unable to determine your current safety status.',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div className={`card ${config.bgColor} ${config.borderColor} border-l-4`}>
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full ${config.bgColor}`}>
              <StatusIcon className={`h-8 w-8 ${config.color}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${config.color}`}>
                {config.message}
              </h3>
              <p className="text-gray-600 mt-1">
                {config.description}
              </p>
              {lastUpdate && (
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {new Date(lastUpdate).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onUpdateLocation}
            className="btn-secondary flex items-center space-x-2"
            title="Update Location"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Update</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyStatus;