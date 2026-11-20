/* eslint-disable import/prefer-default-export */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { Alert, Snackbar, Stack } from '@mui/material';

const SnackBarsContext = createContext({
  addAlert: () => {},
});

export const SnackBarsProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback(({ id, severity = 'info', message }) => {
    const alertId = id || `alert-${Date.now()}`;
    setAlerts((prev) => [
      { id: alertId, severity, message, open: true },
      ...prev.filter((item) => item.id !== alertId),
    ]);
  }, []);

  const closeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ addAlert }), [addAlert]);

  return (
    <SnackBarsContext.Provider value={value}>
      {children}
      <Stack
        spacing={1}
        sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1400, maxWidth: 360 }}
      >
        {alerts.map((alert) => (
          <Snackbar
            key={alert.id}
            open={alert.open}
            autoHideDuration={3500}
            onClose={() => closeAlert(alert.id)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ position: 'relative', top: 0, right: 0, left: 'auto', transform: 'none' }}
          >
            <Alert
              onClose={() => closeAlert(alert.id)}
              severity={alert.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {alert.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </SnackBarsContext.Provider>
  );
};

SnackBarsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const useSnackBars = () => useContext(SnackBarsContext);

export default useSnackBars;
