import React from 'react';
import GeofencingManagement from './GeofencingManagement';

export const ZoneManagement: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Zone Management</h1>
      <GeofencingManagement />
    </div>
  );
};
