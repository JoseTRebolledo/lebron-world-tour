import React from 'react';
import { render } from 'react-dom';
import { LeBronWorldTour } from './LeBronWorldTour';
import { SnackBarsProvider } from './hooks/useSnackBars';
import { AuthProvider } from './hooks/useAuth';

render(
  <SnackBarsProvider>
    <AuthProvider>
      <LeBronWorldTour />
    </AuthProvider>
  </SnackBarsProvider>,
  document.getElementById('root'),
);
