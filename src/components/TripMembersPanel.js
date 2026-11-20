/* eslint-disable import/prefer-default-export */
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import IosShareIcon from '@mui/icons-material/IosShare';
import { supabase } from '../lib/supabase';

export function TripMembersPanel({
  open,
  onClose,
  tripId,
  isOwner,
  shareUrl,
  onEnableShare,
  onDisableShare,
  onError,
  onInfo,
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!open || !tripId || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('list_trip_members', {
        p_trip_id: tripId,
      });
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      if (onError) onError(error.message || 'No se pudieron cargar integrantes');
    } finally {
      setLoading(false);
    }
  }, [open, tripId, onError]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const copyShare = async () => {
    setBusy(true);
    try {
      let url = shareUrl;
      if (!url) {
        url = await onEnableShare();
      }
      if (window.navigator?.clipboard?.writeText) {
        await window.navigator.clipboard.writeText(url);
        if (onInfo) onInfo('Link de invitación copiado');
      } else if (onInfo) {
        onInfo('Copia el enlace mostrado abajo');
      }
    } catch (error) {
      if (onError) onError(error.message || 'No se pudo copiar el link');
    } finally {
      setBusy(false);
    }
  };

  const revokeShare = async () => {
    setBusy(true);
    try {
      await onDisableShare();
      if (onInfo) onInfo('Link de invitación revocado');
    } catch (error) {
      if (onError) onError(error.message || 'No se pudo revocar el link');
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId) => {
    if (!supabase || !isOwner) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('remove_trip_member', {
        p_trip_id: tripId,
        p_user_id: userId,
      });
      if (error) throw error;
      if (onInfo) onInfo('Miembro eliminado');
      await loadMembers();
    } catch (error) {
      if (onError) onError(error.message || 'No se pudo eliminar al miembro');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={false}
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          color: '#fff',
          border: '1px solid rgba(253,185,39,0.35)',
          m: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 16px)', sm: '100%' },
        },
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        Perfil del viaje
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.7)' }}
          aria-label="Cerrar"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Stack spacing={2.5}>
          {isOwner && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#FDB927', mb: 1, fontWeight: 700 }}>
                Link de invitación
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 1.5 }}>
                Solo el propietario (owner) puede generar este enlace. Quien lo abra con sesión
                iniciada se une como editor.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={shareUrl ? <ContentCopyIcon /> : <IosShareIcon />}
                  onClick={copyShare}
                  disabled={busy}
                  sx={{
                    bgcolor: '#FDB927',
                    color: '#111',
                    fontWeight: 700,
                    minHeight: 40,
                    '&:hover': { bgcolor: '#ffe08a' },
                  }}
                >
                  {shareUrl ? 'Copiar link' : 'Generar y copiar link'}
                </Button>
                {shareUrl && (
                  <Button
                    variant="outlined"
                    startIcon={<LinkOffIcon />}
                    onClick={revokeShare}
                    disabled={busy}
                    sx={{ borderColor: '#ff8a80', color: '#ff8a80', minHeight: 40 }}
                  >
                    Revocar link
                  </Button>
                )}
              </Stack>
              {shareUrl && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    color: 'rgba(255,255,255,0.45)',
                    wordBreak: 'break-all',
                  }}
                >
                  {shareUrl}
                </Typography>
              )}
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ color: '#FDB927', mb: 1, fontWeight: 700 }}>
              Integrantes
            </Typography>
            {loading ? (
              <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
                <CircularProgress size={28} sx={{ color: '#FDB927' }} />
              </Box>
            ) : (
              <Stack spacing={1}>
                {members.map((member) => (
                  <Stack
                    key={member.user_id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      py: 1,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {member.email || member.user_id}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {member.role}
                      </Typography>
                    </Box>
                    {isOwner && member.role !== 'owner' && (
                      <IconButton
                        size="small"
                        onClick={() => removeMember(member.user_id)}
                        disabled={busy}
                        aria-label="Eliminar"
                        sx={{ color: '#ff8a80' }}
                      >
                        <PersonRemoveIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                ))}
                {members.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Sin integrantes.
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

TripMembersPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tripId: PropTypes.string,
  isOwner: PropTypes.bool,
  shareUrl: PropTypes.string,
  onEnableShare: PropTypes.func.isRequired,
  onDisableShare: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onInfo: PropTypes.func,
};

TripMembersPanel.defaultProps = {
  tripId: null,
  isOwner: false,
  shareUrl: null,
  onError: null,
  onInfo: null,
};

export default TripMembersPanel;
