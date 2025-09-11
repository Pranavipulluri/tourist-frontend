import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

const LocationCard = ({ location, onUpdateLocation }) => {
  const openInMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Current Location</h3>
          </div>
          {location && (
            <button
              onClick={openInMaps}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
              title="Open in Maps"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="card-body">
        {location ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Address</p>
              <p className="text-gray-900">{location.address || 'Address not available'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Latitude</p>
                <p className="text-gray-900 font-mono">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Longitude</p>
                <p className="text-gray-900 font-mono">{location.longitude.toFixed(6)}</p>
              </div>
            </div>
            <button
              onClick={onUpdateLocation}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <Navigation className="h-4 w-4" />
              <span>Update Location</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No location data available</p>
            <button
              onClick={onUpdateLocation}
              className="btn-primary flex items-center justify-center space-x-2 mx-auto"
            >
              <Navigation className="h-4 w-4" />
              <span>Get Current Location</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationCard;