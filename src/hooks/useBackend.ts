import { useContext } from 'react';

import { BackendContext } from '../services/api/BackendProvider';

export function useBackend() {
  const context = useContext(BackendContext);

  if (!context) {
    throw new Error('useBackend must be used inside BackendProvider');
  }

  return context;
}
