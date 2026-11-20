/* eslint-disable import/prefer-default-export */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  CircularProgress,
  CssBaseline,
  Stack,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { arrayMove } from '@dnd-kit/sortable';
import useAuth from './hooks/useAuth';
import useSnackBars from './hooks/useSnackBars';
import useTripBoard from './hooks/useTripBoard';
import { AuthGate } from './components/AuthGate';
import { BoardToolbar } from './components/BoardToolbar';
import { TravelBoard } from './components/TravelBoard';
import { CostDashboard } from './components/CostDashboard';
import { AddActivityDialog } from './components/AddActivityDialog';
import { TripHome } from './components/TripHome';
import { TripMembersPanel } from './components/TripMembersPanel';
import { buildEmptyItinerary, buildSeedItinerary } from './helpers/seedItinerary';
import {
  DEFAULT_IMAGE_POSITION,
  LEBRON_SEASONS,
  computeTripFixedCosts,
  createId,
  formatCost,
  formatSeasonLabel,
  getSeasonForDayIndex,
  normalizeImagePosition,
  normalizeTripMeta,
  parseCost,
  parsePriority,
  sumActivitiesCost,
} from './helpers/constants';
import { exportBoardToExcel, importBoardFromExcel } from './helpers/excel';
import { supabase } from './lib/supabase';

const lebronTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FDB927' },
    secondary: { main: '#552583' },
    background: { default: '#0b0b0b', paper: '#1a1a1a' },
  },
  typography: {
    fontFamily: '"Oswald", "Bebas Neue", "Helvetica Neue", Arial, sans-serif',
  },
});

const findDayIdByActivityId = (days, activityId) => {
  const day = days.find((item) => item.activities.some((activity) => activity.id === activityId));
  return day?.id;
};

const sortDays = (days) => [...days].sort((a, b) => a.order - b.order);

const getShareTokenFromUrl = () => {
  try {
    return new URLSearchParams(window.location.search).get('share');
  } catch (error) {
    return null;
  }
};

const clearShareFromUrl = () => {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('share')) return;
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch (error) {
    // ignore
  }
};

function TripBoardView({ tripId, onBackToTrips }) {
  const { addAlert } = useSnackBars();
  const { user, signOut } = useAuth();

  const onError = useCallback((message) => {
    addAlert({ id: `trip-error-${Date.now()}`, severity: 'error', message });
  }, [addAlert]);

  const onInfo = useCallback((message) => {
    addAlert({ id: `trip-info-${Date.now()}`, severity: 'info', message });
  }, [addAlert]);

  const {
    board,
    setBoard,
    loading,
    saving,
    isOwner,
    shareUrl,
    enableSharing,
    disableSharing,
  } = useTripBoard({
    userId: user?.id || null,
    tripId,
    onError,
  });

  const [activeActivity, setActiveActivity] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [dialogState, setDialogState] = useState({
    open: false,
    dayId: null,
    activity: null,
  });

  useEffect(() => {
    const href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;600;700&display=swap';
    if (document.querySelector(`link[href="${href}"]`)) return undefined;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return undefined;
  }, []);

  const days = useMemo(() => sortDays(board?.days || []), [board]);
  const meta = useMemo(() => normalizeTripMeta(board?.meta), [board]);
  const tripTotal = useMemo(() => {
    const activitiesTotal = days.reduce(
      (total, day) => total + sumActivitiesCost(day.activities),
      0,
    );
    const fixed = computeTripFixedCosts(meta, days.length);
    return formatCost(activitiesTotal + fixed.fixedTotal);
  }, [days, meta]);

  const updateDays = useCallback((updater) => {
    setBoard((prev) => {
      const nextDays = typeof updater === 'function' ? updater(sortDays(prev?.days || [])) : updater;
      return {
        ...prev,
        meta: normalizeTripMeta(prev?.meta),
        days: nextDays.map((day, index) => ({
          ...day,
          order: index,
          activities: (day.activities || []).map((activity, activityIndex) => ({
            ...activity,
            order: activityIndex,
          })),
        })),
      };
    });
  }, [setBoard]);

  const handleChangeMeta = useCallback((nextMeta) => {
    setBoard((prev) => ({
      ...prev,
      days: prev?.days || [],
      meta: normalizeTripMeta(nextMeta),
    }));
  }, [setBoard]);

  const handleAddDay = () => {
    updateDays((prev) => {
      const season = getSeasonForDayIndex(prev.length);
      return [
        ...prev,
        {
          id: createId('day'),
          label: `Día ${prev.length + 1}`,
          order: prev.length,
          seasonId: season.id,
          seasonLabel: formatSeasonLabel(season),
          imageUrl: season.imageUrl,
          imagePosition: DEFAULT_IMAGE_POSITION,
          activities: [],
        },
      ];
    });
  };

  const handleDeleteDay = (dayId) => {
    updateDays((prev) => prev.filter((day) => day.id !== dayId));
  };

  const handleRenameDay = (dayId, label) => {
    updateDays((prev) => prev.map((day) => (day.id === dayId ? { ...day, label } : day)));
  };

  const handleChangeImagePosition = (dayId, imagePosition) => {
    updateDays((prev) => prev.map((day) => (
      day.id === dayId
        ? { ...day, imagePosition: normalizeImagePosition(imagePosition) }
        : day
    )));
  };

  const withDefaultDayImage = (day) => {
    const season = LEBRON_SEASONS.find((item) => item.id === day.seasonId)
      || getSeasonForDayIndex(day.order || 0);
    const defaultImageUrl = season.imageUrl;
    return {
      ...day,
      imageUrl: defaultImageUrl,
      activities: (day.activities || []).map((activity) => ({
        ...activity,
        imageUrl: defaultImageUrl,
      })),
    };
  };

  const handleResetDayImage = (dayId) => {
    updateDays((prev) => prev.map((day) => (
      day.id === dayId ? withDefaultDayImage(day) : day
    )));
  };

  const handleResetAllDayImages = () => {
    updateDays((prev) => prev.map((day) => withDefaultDayImage(day)));
    addAlert({
      id: `lebron-reset-images-ok-${Date.now()}`,
      severity: 'success',
      message: 'Fotos restauradas a las default ESPN',
    });
  };

  const handleOpenAdd = (dayId) => {
    setDialogState({ open: true, dayId, activity: null });
  };

  const handleOpenEdit = (dayId, activity) => {
    setDialogState({ open: true, dayId, activity });
  };

  const handleDeleteActivity = (dayId, activityId) => {
    updateDays((prev) => prev.map((day) => (
      day.id === dayId
        ? { ...day, activities: day.activities.filter((activity) => activity.id !== activityId) }
        : day
    )));
  };

  const handleSaveActivity = (payload) => {
    const { dayId } = dialogState;
    updateDays((prev) => prev.map((day) => {
      if (day.id !== dayId) return day;
      if (payload.id) {
        return {
          ...day,
          activities: day.activities.map((activity) => (
            activity.id === payload.id
              ? {
                ...activity,
                ...payload,
                cost: parseCost(payload.cost),
                priority: parsePriority(payload.priority),
              }
              : activity
          )),
        };
      }
      return {
        ...day,
        activities: [
          ...day.activities,
          {
            id: createId('activity'),
            title: payload.title,
            notes: payload.notes || '',
            location: payload.location || '',
            cost: parseCost(payload.cost),
            priority: parsePriority(payload.priority),
            imageUrl: payload.imageUrl || day.imageUrl || getSeasonForDayIndex(0).imageUrl,
            order: day.activities.length,
          },
        ],
      };
    }));
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const activity = active.data.current?.activity;
    if (activity) setActiveActivity(activity);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    updateDays((prev) => {
      const activeDayId = findDayIdByActivityId(prev, activeId);
      const overDayId = over.data.current?.type === 'column'
        ? over.id
        : findDayIdByActivityId(prev, overId);

      if (!activeDayId || !overDayId || activeDayId === overDayId) return prev;

      const sourceDay = prev.find((day) => day.id === activeDayId);
      const targetDay = prev.find((day) => day.id === overDayId);
      if (!sourceDay || !targetDay) return prev;

      const moving = sourceDay.activities.find((activity) => activity.id === activeId);
      if (!moving) return prev;

      const moved = {
        ...moving,
        imageUrl: targetDay.imageUrl || moving.imageUrl,
      };

      const overIndex = over.data.current?.type === 'column'
        ? targetDay.activities.length
        : targetDay.activities.findIndex((activity) => activity.id === overId);

      return prev.map((day) => {
        if (day.id === activeDayId) {
          return {
            ...day,
            activities: day.activities.filter((activity) => activity.id !== activeId),
          };
        }
        if (day.id === overDayId) {
          const nextActivities = [...day.activities];
          const insertAt = overIndex < 0 ? nextActivities.length : overIndex;
          nextActivities.splice(insertAt, 0, moved);
          return { ...day, activities: nextActivities };
        }
        return day;
      });
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveActivity(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    updateDays((prev) => {
      const activeDayId = findDayIdByActivityId(prev, activeId);
      const overDayId = over.data.current?.type === 'column'
        ? over.id
        : findDayIdByActivityId(prev, overId);

      if (!activeDayId || !overDayId || activeDayId !== overDayId) return prev;
      if (activeId === overId) return prev;

      return prev.map((day) => {
        if (day.id !== activeDayId) return day;
        const oldIndex = day.activities.findIndex((activity) => activity.id === activeId);
        const newIndex = over.data.current?.type === 'column'
          ? day.activities.length - 1
          : day.activities.findIndex((activity) => activity.id === overId);
        if (oldIndex < 0 || newIndex < 0) return day;
        return { ...day, activities: arrayMove(day.activities, oldIndex, newIndex) };
      });
    });
  };

  const handleExport = () => {
    try {
      exportBoardToExcel({ days, meta });
      addAlert({ id: 'lebron-export-ok', severity: 'success', message: 'Excel exportado' });
    } catch (error) {
      addAlert({
        id: 'lebron-export-error',
        severity: 'error',
        message: error.message || 'No se pudo exportar el Excel',
      });
    }
  };

  const handleImportFile = async (file) => {
    try {
      const nextBoard = await importBoardFromExcel(file);
      setBoard(nextBoard);
      addAlert({ id: 'lebron-import-ok', severity: 'success', message: 'Itinerario importado' });
    } catch (error) {
      addAlert({
        id: 'lebron-import-error',
        severity: 'error',
        message: error.message || 'No se pudo importar el Excel',
      });
    }
  };

  const handleClearActivities = () => {
    if (window.confirm('¿Vaciar todas las actividades? Se mantienen los días para que armes tu plan.')) {
      setBoard(buildEmptyItinerary(meta));
      addAlert({ id: 'lebron-clear-ok', severity: 'info', message: 'Actividades vaciadas' });
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Resetear el itinerario al viaje demo de Japón?')) {
      setBoard(buildSeedItinerary());
      addAlert({ id: 'lebron-reset-ok', severity: 'info', message: 'Itinerario reiniciado' });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      addAlert({
        id: 'signout-error',
        severity: 'error',
        message: error.message || 'No se pudo cerrar sesión',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#0b0b0b' }}>
        <CircularProgress sx={{ color: '#FDB927' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 1.25, sm: 2, md: 3 },
        py: { xs: 1.5, sm: 2, md: 3 },
        background:
          'radial-gradient(ellipse at 10% 0%, rgba(85,37,131,0.55), transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(253,185,39,0.2), transparent 45%), linear-gradient(160deg, #0b0b0b 0%, #161016 55%, #0b0b0b 100%)',
      }}
    >
      <Stack spacing={{ xs: 1.5, md: 2.5 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ lg: 'center' }}>
          <BoardToolbar
            onExport={handleExport}
            onImportFile={handleImportFile}
            onReset={handleReset}
            onClearActivities={handleClearActivities}
            onResetAllDayImages={handleResetAllDayImages}
            onAddDay={handleAddDay}
            tripTotal={tripTotal}
            userEmail={user?.email || null}
            onSignOut={handleSignOut}
            onOpenMembers={() => setMembersOpen(true)}
            onBackToTrips={onBackToTrips}
            isOwner={isOwner}
            saving={saving}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ ml: { lg: 'auto' }, display: { xs: 'none', md: 'flex' } }}
          >
            {LEBRON_SEASONS.slice(0, 4).map((season) => (
              <Box key={season.id} sx={{ textAlign: 'center' }}>
                <Box
                  component="img"
                  src={season.imageUrl}
                  alt={season.label}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                    border: '2px solid #FDB927',
                    display: 'block',
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Stack>

        <Box sx={{ height: { xs: '52vh', sm: '58vh', md: '62vh' }, minHeight: { xs: 280, sm: 360 } }}>
          <TravelBoard
            days={days}
            activeActivity={activeActivity}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onAddActivity={handleOpenAdd}
            onEditActivity={handleOpenEdit}
            onDeleteActivity={handleDeleteActivity}
            onDeleteDay={handleDeleteDay}
            onRenameDay={handleRenameDay}
            onChangeImagePosition={handleChangeImagePosition}
            onResetDayImage={handleResetDayImage}
          />
        </Box>

        <CostDashboard days={days} meta={meta} onChangeMeta={handleChangeMeta} />
      </Stack>

      <AddActivityDialog
        open={dialogState.open}
        dayLabel={days.find((day) => day.id === dialogState.dayId)?.label}
        defaultImageUrl={days.find((day) => day.id === dialogState.dayId)?.imageUrl}
        defaultSeasonId={days.find((day) => day.id === dialogState.dayId)?.seasonId}
        initialActivity={dialogState.activity}
        onClose={() => setDialogState({ open: false, dayId: null, activity: null })}
        onSave={handleSaveActivity}
      />

      <TripMembersPanel
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        tripId={tripId}
        isOwner={isOwner}
        shareUrl={shareUrl}
        onEnableShare={enableSharing}
        onDisableShare={disableSharing}
        onError={onError}
        onInfo={onInfo}
      />
    </Box>
  );
}

TripBoardView.propTypes = {
  tripId: PropTypes.string.isRequired,
  onBackToTrips: PropTypes.func.isRequired,
};

function LeBronWorldTourApp() {
  const { addAlert } = useSnackBars();
  const { user } = useAuth();
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [joining, setJoining] = useState(Boolean(getShareTokenFromUrl()));

  const onError = useCallback((message) => {
    addAlert({ id: `home-error-${Date.now()}`, severity: 'error', message });
  }, [addAlert]);

  const onInfo = useCallback((message) => {
    addAlert({ id: `home-info-${Date.now()}`, severity: 'info', message });
  }, [addAlert]);

  useEffect(() => {
    let cancelled = false;
    const token = getShareTokenFromUrl();
    if (!token || !user?.id || !supabase) {
      setJoining(false);
      return undefined;
    }

    const join = async () => {
      setJoining(true);
      try {
        const { data, error } = await supabase.rpc('join_trip_by_share_token', {
          p_token: token,
        });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row?.id) throw new Error('Invite link inválido o desactivado');
        if (cancelled) return;
        clearShareFromUrl();
        setSelectedTripId(row.id);
        addAlert({
          id: 'join-ok',
          severity: 'success',
          message: 'Te uniste al viaje',
        });
      } catch (error) {
        if (!cancelled) {
          onError(error.message || 'No se pudo unir al viaje');
          clearShareFromUrl();
        }
      } finally {
        if (!cancelled) setJoining(false);
      }
    };

    join();
    return () => {
      cancelled = true;
    };
  }, [user?.id, addAlert, onError]);

  if (joining) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#0b0b0b' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: '#FDB927' }} />
          <Box sx={{ color: 'rgba(255,255,255,0.7)' }}>Uniéndote al viaje…</Box>
        </Stack>
      </Box>
    );
  }

  if (selectedTripId) {
    return (
      <TripBoardView
        tripId={selectedTripId}
        onBackToTrips={() => setSelectedTripId(null)}
      />
    );
  }

  return (
    <TripHome
      onOpenTrip={setSelectedTripId}
      onError={onError}
      onInfo={onInfo}
    />
  );
}

export function LeBronWorldTour() {
  return (
    <ThemeProvider theme={lebronTheme}>
      <CssBaseline />
      <AuthGate>
        <LeBronWorldTourApp />
      </AuthGate>
    </ThemeProvider>
  );
}
