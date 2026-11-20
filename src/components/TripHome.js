/* eslint-disable import/prefer-default-export */
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import { supabase } from '../lib/supabase';
import { buildSeedItinerary } from '../helpers/seedItinerary';
import useAuth from '../hooks/useAuth';

const TRIPS_FETCH_MS = 12000;

export function TripHome({ onOpenTrip, onError, onInfo }) {
  const { user, isAdmin, signOut } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadTrips = useCallback(async () => {
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = window.setTimeout(() => {
      if (controller) controller.abort();
    }, TRIPS_FETCH_MS);

    try {
      let query = supabase
        .from('trips')
        .select('id, title, updated_at, owner_id, share_mode')
        .order('updated_at', { ascending: false });
      if (controller) {
        query = query.abortSignal(controller.signal);
      }
      const { data, error } = await query;
      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      const aborted = error?.name === 'AbortError'
        || /aborted|abort/i.test(String(error?.message || ''));
      const message = aborted
        ? 'La carga de viajes tardó demasiado. Revisa la conexión e inténtalo de nuevo.'
        : (error.message || 'No se pudieron cargar los viajes');
      setLoadError(message);
      if (onError) onError(message);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [user?.id, onError]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleCreate = async () => {
    if (!supabase || !user?.id || !isAdmin) return;
    setCreating(true);
    try {
      const seed = buildSeedItinerary();
      const { data, error } = await supabase.rpc('create_trip', {
        p_title: 'LeBron World Tour',
        p_board_json: seed,
      });
      if (error) throw error;
      const trip = Array.isArray(data) ? data[0] : data;
      if (!trip?.id) throw new Error('No se pudo crear el viaje');
      if (onInfo) onInfo('Viaje creado');
      onOpenTrip(trip.id);
    } catch (error) {
      if (onError) onError(error.message || 'No se pudo crear el viaje');
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      if (onError) onError(error.message || 'No se pudo cerrar sesión');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 1.5, sm: 3 },
        py: { xs: 2, md: 3 },
        background:
          'radial-gradient(ellipse at 10% 0%, rgba(85,37,131,0.55), transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(253,185,39,0.2), transparent 45%), linear-gradient(160deg, #0b0b0b 0%, #161016 55%, #0b0b0b 100%)',
      }}
    >
      <Stack spacing={2.5} sx={{ maxWidth: 720, mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack spacing={0.5}>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
                letterSpacing: 2,
                color: '#FDB927',
                fontSize: { xs: '2.2rem', sm: '3rem' },
                lineHeight: 1,
              }}
            >
              Tus viajes
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {user?.email}
              {isAdmin ? ' · admin (puedes crear viajes)' : ' · miembro'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                disabled={creating}
                sx={{
                  bgcolor: '#FDB927',
                  color: '#111',
                  fontWeight: 700,
                  minHeight: 40,
                  '&:hover': { bgcolor: '#ffe08a' },
                }}
              >
                {creating ? 'Creando…' : 'Crear viaje'}
              </Button>
            )}
            <Button
              variant="text"
              startIcon={<LogoutIcon />}
              onClick={handleSignOut}
              sx={{ color: 'rgba(255,255,255,0.7)', minHeight: 40 }}
            >
              Salir
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#FDB927' }} />
          </Box>
        ) : null}

        {!loading && loadError ? (
          <Stack spacing={1.5} sx={{ py: 4 }}>
            <Typography sx={{ color: '#ff8a80' }}>{loadError}</Typography>
            <Button
              variant="outlined"
              onClick={loadTrips}
              sx={{
                alignSelf: 'flex-start',
                color: '#FDB927',
                borderColor: 'rgba(253,185,39,0.5)',
                minHeight: 40,
              }}
            >
              Reintentar
            </Button>
          </Stack>
        ) : null}

        {!loading && !loadError && trips.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', py: 4 }}>
            {isAdmin
              ? 'Aún no tienes viajes. Crea uno para empezar.'
              : 'Aún no eres miembro de ningún viaje. Pídele al admin el enlace de invitación.'}
          </Typography>
        ) : null}

        {!loading && !loadError && trips.length > 0 ? (
          <Stack spacing={1.25}>
            {trips.map((trip) => (
              <Box
                key={trip.id}
                component="button"
                type="button"
                onClick={() => onOpenTrip(trip.id)}
                sx={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: '1px solid rgba(253,185,39,0.3)',
                  bgcolor: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  p: { xs: 1.5, sm: 2 },
                  minHeight: 56,
                  font: 'inherit',
                  '&:hover': { bgcolor: 'rgba(253,185,39,0.12)' },
                }}
              >
                <Typography fontWeight={700} sx={{ color: '#FDB927' }}>
                  {trip.title || 'LeBron World Tour'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                  Actualizado
                  {' '}
                  {trip.updated_at ? new Date(trip.updated_at).toLocaleString() : '—'}
                  {trip.owner_id === user?.id ? ' · eres owner' : ''}
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

TripHome.propTypes = {
  onOpenTrip: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onInfo: PropTypes.func,
};

TripHome.defaultProps = {
  onError: null,
  onInfo: null,
};

export default TripHome;
