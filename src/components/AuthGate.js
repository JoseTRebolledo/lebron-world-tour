/* eslint-disable import/prefer-default-export */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import useAuth from '../hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value) => EMAIL_RE.test(String(value || '').trim());

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    minHeight: 44,
    '& fieldset': { borderColor: 'rgba(253,185,39,0.4)' },
  },
};

const labelProps = { sx: { color: 'rgba(255,255,255,0.6)' } };

const shellSx = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  px: { xs: 1.5, sm: 2 },
  py: 2,
  background:
    'radial-gradient(ellipse at 10% 0%, rgba(85,37,131,0.55), transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(253,185,39,0.2), transparent 45%), linear-gradient(160deg, #0b0b0b 0%, #161016 55%, #0b0b0b 100%)',
};

const cardSx = {
  width: '100%',
  maxWidth: 420,
  p: { xs: 2, sm: 3 },
  border: '1px solid rgba(253,185,39,0.35)',
  bgcolor: 'rgba(26,26,26,0.9)',
};

const primaryBtnSx = {
  bgcolor: '#FDB927',
  color: '#111',
  fontWeight: 700,
  minHeight: 44,
  '&:hover': { bgcolor: '#ffe08a' },
};

function BrandTitle() {
  return (
    <Typography
      variant="h3"
      sx={{
        fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
        letterSpacing: 2,
        color: '#FDB927',
        lineHeight: 1,
        fontSize: { xs: '2.2rem', sm: '3rem' },
      }}
    >
      LeBron World Tour
    </Typography>
  );
}

function SetPasswordForm() {
  const { setPassword, authError, signOut } = useAuth();
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);
    if (password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      await setPassword(password);
    } catch (error) {
      setLocalError(error.message || 'No se pudo guardar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={shellSx}>
      <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={cardSx}>
        <BrandTitle />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          Elige una contraseña para entrar la próxima vez.
        </Typography>
        <TextField
          label="Contraseña"
          type="password"
          required
          fullWidth
          value={password}
          onChange={(event) => setPasswordValue(event.target.value)}
          disabled={saving}
          InputLabelProps={labelProps}
          sx={fieldSx}
          autoComplete="new-password"
        />
        <TextField
          label="Confirmar contraseña"
          type="password"
          required
          fullWidth
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          disabled={saving}
          InputLabelProps={labelProps}
          sx={fieldSx}
          autoComplete="new-password"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={saving || !password || !confirm}
          sx={primaryBtnSx}
        >
          {saving ? 'Guardando…' : 'Guardar contraseña'}
        </Button>
        {(localError || authError) && (
          <Typography variant="body2" sx={{ color: '#ff8a80' }}>
            {localError || authError}
          </Typography>
        )}
        <Button
          type="button"
          onClick={() => signOut()}
          sx={{ color: 'rgba(255,255,255,0.65)', textTransform: 'none' }}
        >
          Cerrar sesión
        </Button>
      </Stack>
    </Box>
  );
}

export function AuthGate({ children }) {
  const {
    user,
    loading,
    configured,
    authError,
    needsPassword,
    signInWithPassword,
    signUpWithPassword,
  } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState(null);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          bgcolor: '#0b0b0b',
          color: '#FDB927',
          px: 2,
        }}
      >
        <Stack spacing={1.5} alignItems="center">
          <CircularProgress color="inherit" />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
            Cargando sesión…
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (user && needsPassword) {
    return <SetPasswordForm />;
  }

  if (user) {
    return children;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setLocalError('Introduce un email válido');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setLocalError('La contraseña debe tener al menos 8 caracteres');
        return;
      }
      if (password !== confirm) {
        setLocalError('Las contraseñas no coinciden');
        return;
      }
    }

    setSending(true);
    try {
      if (mode === 'login') {
        await signInWithPassword(trimmedEmail, password);
      } else {
        await signUpWithPassword(trimmedEmail, password);
      }
    } catch (error) {
      setLocalError(
        error.message
          || (mode === 'login' ? 'No se pudo iniciar sesión' : 'No se pudo crear la cuenta'),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={shellSx}>
      <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={cardSx}>
        <BrandTitle />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          {mode === 'login'
            ? 'Inicia sesión con email y contraseña. Si te compartieron un viaje, abre ese enlace después de iniciar sesión.'
            : 'Crea una cuenta con email y contraseña.'}
        </Typography>

        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={mode}
          onChange={(_event, value) => {
            if (!value) return;
            setMode(value);
            setLocalError(null);
            setConfirm('');
          }}
          sx={{
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.7)',
              borderColor: 'rgba(253,185,39,0.35)',
              textTransform: 'none',
              '&.Mui-selected': {
                bgcolor: 'rgba(253,185,39,0.2)',
                color: '#FDB927',
                borderColor: 'rgba(253,185,39,0.6)',
              },
            },
          }}
        >
          <ToggleButton value="login">Iniciar sesión</ToggleButton>
          <ToggleButton value="signup">Crear cuenta</ToggleButton>
        </ToggleButtonGroup>

        {!configured && (
          <Typography variant="body2" sx={{ color: '#ff8a80' }}>
            Falta configurar
            {' '}
            <code>REACT_APP_SUPABASE_URL</code>
            {' '}
            y
            {' '}
            <code>REACT_APP_SUPABASE_ANON_KEY</code>
            {' '}
            en
            {' '}
            <code>.env</code>
            .
          </Typography>
        )}

        <TextField
          label="Email"
          type="email"
          required
          fullWidth
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={!configured || sending}
          InputLabelProps={labelProps}
          sx={fieldSx}
          autoComplete="email"
          error={Boolean(email.trim()) && !isValidEmail(email)}
          helperText={
            email.trim() && !isValidEmail(email) ? 'Email no válido' : undefined
          }
          FormHelperTextProps={{ sx: { color: '#ff8a80' } }}
        />

        <TextField
          label="Contraseña"
          type="password"
          required
          fullWidth
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={!configured || sending}
          InputLabelProps={labelProps}
          sx={fieldSx}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {mode === 'signup' && (
          <TextField
            label="Confirmar contraseña"
            type="password"
            required
            fullWidth
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            disabled={!configured || sending}
            InputLabelProps={labelProps}
            sx={fieldSx}
            autoComplete="new-password"
          />
        )}

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={
            !configured
            || sending
            || !email.trim()
            || !isValidEmail(email)
            || !password
            || (mode === 'signup' && !confirm)
          }
          sx={primaryBtnSx}
        >
          {(() => {
            if (sending) return mode === 'login' ? 'Entrando…' : 'Creando…';
            return mode === 'login' ? 'Entrar' : 'Crear cuenta';
          })()}
        </Button>

        {(localError || authError) && (
          <Typography variant="body2" sx={{ color: '#ff8a80' }}>
            {localError || authError}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

AuthGate.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthGate;
