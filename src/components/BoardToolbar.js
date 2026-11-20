/* eslint-disable import/prefer-default-export */
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const btnSx = {
  borderColor: '#FDB927',
  color: '#FDB927',
  minHeight: 40,
};

export function BoardToolbar({
  onExport,
  onImportFile,
  onReset,
  onClearActivities,
  onResetAllDayImages,
  onAddDay,
  tripTotal,
  userEmail,
  onSignOut,
  onOpenMembers,
  onBackToTrips,
  isOwner,
  saving,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const secondaryActions = [
    { key: 'export', label: 'Exportar Excel', icon: <FileDownloadOutlinedIcon fontSize="small" />, onClick: onExport },
    {
      key: 'import',
      label: 'Importar Excel',
      icon: <FileUploadOutlinedIcon fontSize="small" />,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      key: 'photos',
      label: 'Restaurar fotos',
      icon: <BrokenImageOutlinedIcon fontSize="small" />,
      onClick: onResetAllDayImages,
    },
    {
      key: 'clear',
      label: 'Vaciar actividades',
      icon: <DeleteSweepIcon fontSize="small" />,
      onClick: onClearActivities,
      danger: true,
    },
    {
      key: 'reset',
      label: 'Reset',
      icon: <RestartAltIcon fontSize="small" />,
      onClick: onReset,
    },
  ];

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
      sx={{ width: '100%' }}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {onBackToTrips && (
            <IconButton
              onClick={onBackToTrips}
              aria-label="Volver a viajes"
              sx={{ color: '#FDB927', display: { xs: 'inline-flex', md: 'none' } }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
              letterSpacing: 2,
              color: '#FDB927',
              lineHeight: 1,
              fontSize: { xs: '1.85rem', sm: '2.4rem', md: '3.2rem' },
            }}
          >
            LeBron World Tour
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          Itinerario · sync en la nube · fotos ESPN / custom
        </Typography>
        <Typography variant="subtitle2" sx={{ color: '#81c784', fontWeight: 700 }}>
          Total viaje:
          {' '}
          {tripTotal}
          {saving ? ' · guardando…' : ''}
        </Typography>
        {userEmail && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
            {userEmail}
            {isOwner ? ' · owner' : ' · editor'}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        {onBackToTrips && (
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={onBackToTrips}
            sx={{ color: 'rgba(255,255,255,0.7)', minHeight: 40, display: { xs: 'none', md: 'inline-flex' } }}
          >
            Viajes
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddDay}
          sx={{
            bgcolor: '#FDB927',
            color: '#111',
            fontWeight: 700,
            minHeight: 40,
            '&:hover': { bgcolor: '#ffe08a' },
          }}
        >
          Agregar día
        </Button>
        {onOpenMembers && (
          <Button
            variant="outlined"
            startIcon={<GroupIcon />}
            onClick={onOpenMembers}
            sx={btnSx}
          >
            Integrantes
          </Button>
        )}

        {isMobile ? (
          <>
            <IconButton
              aria-label="Más acciones"
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={{ color: '#FDB927', border: '1px solid rgba(253,185,39,0.5)', minHeight: 40, minWidth: 40 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff' } }}
            >
              {secondaryActions.map((action) => (
                <MenuItem
                  key={action.key}
                  onClick={() => {
                    setMenuAnchor(null);
                    action.onClick();
                  }}
                  sx={{ color: action.danger ? '#ff8a80' : undefined }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    {action.icon}
                    <span>{action.label}</span>
                  </Stack>
                </MenuItem>
              ))}
              {onSignOut && (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    onSignOut();
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LogoutIcon fontSize="small" />
                    <span>Salir</span>
                  </Stack>
                </MenuItem>
              )}
            </Menu>
          </>
        ) : (
          <>
            {secondaryActions.map((action) => {
              let actionSx = btnSx;
              if (action.danger) {
                actionSx = { borderColor: 'rgba(255,138,128,0.7)', color: '#ff8a80', minHeight: 40 };
              } else if (action.key === 'reset') {
                actionSx = { color: 'rgba(255,255,255,0.7)', minHeight: 40 };
              }
              return (
                <Button
                  key={action.key}
                  variant={action.key === 'reset' ? 'text' : 'outlined'}
                  startIcon={action.icon}
                  onClick={action.onClick}
                  sx={actionSx}
                >
                  {action.label}
                </Button>
              );
            })}
            {onSignOut && (
              <Button
                variant="text"
                startIcon={<LogoutIcon />}
                onClick={onSignOut}
                sx={{ color: 'rgba(255,255,255,0.65)', minHeight: 40 }}
              >
                Salir
              </Button>
            )}
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          hidden
          onChange={(event) => {
            const input = event.target;
            const file = input.files?.[0];
            if (file) onImportFile(file);
            input.value = '';
          }}
        />
      </Stack>
    </Stack>
  );
}

BoardToolbar.propTypes = {
  onExport: PropTypes.func.isRequired,
  onImportFile: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onClearActivities: PropTypes.func.isRequired,
  onResetAllDayImages: PropTypes.func.isRequired,
  onAddDay: PropTypes.func.isRequired,
  tripTotal: PropTypes.string,
  userEmail: PropTypes.string,
  onSignOut: PropTypes.func,
  onOpenMembers: PropTypes.func,
  onBackToTrips: PropTypes.func,
  isOwner: PropTypes.bool,
  saving: PropTypes.bool,
};

BoardToolbar.defaultProps = {
  tripTotal: '$0',
  userEmail: null,
  onSignOut: null,
  onOpenMembers: null,
  onBackToTrips: null,
  isOwner: false,
  saving: false,
};

export default BoardToolbar;
