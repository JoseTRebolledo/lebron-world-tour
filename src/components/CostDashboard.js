/* eslint-disable import/prefer-default-export */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  computeTripFixedCosts,
  formatCost,
  parseCost,
  sumActivitiesCost,
} from '../helpers/constants';

const StatBlock = ({ label, value, accent }) => (
  <Stack spacing={0.25} sx={{ minWidth: { xs: 96, sm: 120 } }}>
    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: 1 }}>
      {label}
    </Typography>
    <Typography
      variant="h5"
      sx={{
        color: accent || '#fff',
        fontWeight: 800,
        fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
        letterSpacing: 1,
        lineHeight: 1,
      }}
    >
      {value}
    </Typography>
  </Stack>
);

StatBlock.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accent: PropTypes.string,
};

StatBlock.defaultProps = {
  accent: '#fff',
};

const MetaField = ({ label, helper, value, onChange }) => (
  <TextField
    label={label}
    value={value === 0 || value ? String(value) : ''}
    onChange={(event) => onChange(parseCost(event.target.value))}
    type="number"
    inputProps={{ min: 0, step: '0.01' }}
    fullWidth
    size="small"
    helperText={helper}
    sx={{
      '& .MuiInputBase-root': { bgcolor: 'rgba(0,0,0,0.25)' },
      '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.45)' },
    }}
  />
);

MetaField.propTypes = {
  label: PropTypes.string.isRequired,
  helper: PropTypes.string,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

MetaField.defaultProps = {
  helper: '',
};

export function CostDashboard({ days, meta, onChangeMeta }) {
  const summary = useMemo(() => {
    const dayRows = (days || []).map((day) => {
      const total = sumActivitiesCost(day.activities);
      const activityCount = (day.activities || []).length;
      return {
        id: day.id,
        label: day.label,
        seasonLabel: day.seasonLabel || '',
        imageUrl: day.imageUrl,
        total,
        activityCount,
      };
    });

    const activitiesTotal = dayRows.reduce((sum, day) => sum + day.total, 0);
    const activityCount = dayRows.reduce((sum, day) => sum + day.activityCount, 0);
    const daysWithSpend = dayRows.filter((day) => day.total > 0).length;
    const dayCount = dayRows.length;
    const fixed = computeTripFixedCosts(meta, dayCount);
    const grandTotal = activitiesTotal + fixed.fixedTotal;
    const avgPerDay = dayCount ? grandTotal / dayCount : 0;
    const maxDayTotal = Math.max(0, ...dayRows.map((day) => day.total));

    const topActivities = (days || [])
      .flatMap((day) => (day.activities || []).map((activity) => ({
        id: activity.id,
        title: activity.title,
        dayLabel: day.label,
        cost: parseCost(activity.cost),
      })))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return {
      activitiesTotal,
      activityCount,
      dayCount,
      daysWithSpend,
      avgPerDay,
      maxDayTotal,
      dayRows,
      topActivities,
      fixed,
      grandTotal,
    };
  }, [days, meta]);

  const handleMetaField = (field) => (value) => {
    onChangeMeta({ ...meta, [field]: value });
  };

  return (
    <Box
      sx={{
        borderTop: '1px solid rgba(253,185,39,0.25)',
        pt: 2.5,
        pb: 1,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'flex-end' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Bebas Neue", "Oswald", Impact, sans-serif',
              color: '#FDB927',
              letterSpacing: 2,
              lineHeight: 1,
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
            }}
          >
            Dashboard de costos
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
            Resumen del viaje en USD · actividades + comida/hotel/pasajes
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={{ xs: 2, sm: 3 }}
          flexWrap="wrap"
          useFlexGap
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <StatBlock label="TOTAL VIAJE" value={formatCost(summary.grandTotal)} accent="#81c784" />
          <StatBlock label="SOLO ACTIVIDADES" value={formatCost(summary.activitiesTotal)} />
          <StatBlock label="PROMEDIO / DÍA" value={formatCost(summary.avgPerDay)} accent="#FDB927" />
          <StatBlock label="DÍAS" value={summary.dayCount} />
          <StatBlock label="ACTIVIDADES" value={summary.activityCount} />
        </Stack>
      </Stack>

      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2,
          p: 2,
          mb: 2.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: '#FDB927', mb: 1.5, fontWeight: 700 }}>
          Costos fijos del viaje (metadata)
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <MetaField
            label="Comida por día (USD)"
            helper={`Total comida: ${formatCost(summary.fixed.foodTotal)} (${summary.dayCount} días)`}
            value={meta.foodPerDay}
            onChange={handleMetaField('foodPerDay')}
          />
          <MetaField
            label="Alojamiento por día (USD)"
            helper={`Total hotel: ${formatCost(summary.fixed.lodgingTotal)} (${summary.dayCount} días)`}
            value={meta.lodgingPerDay}
            onChange={handleMetaField('lodgingPerDay')}
          />
          <MetaField
            label="Pasajes ida y vuelta (USD)"
            helper={`Total pasajes: ${formatCost(summary.fixed.ticketsTotal)}`}
            value={meta.roundTripTickets}
            onChange={handleMetaField('roundTripTickets')}
          />
        </Stack>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1.5 }}>
          Fijos subtotal:
          {' '}
          <Box component="span" sx={{ color: '#81c784', fontWeight: 700 }}>
            {formatCost(summary.fixed.fixedTotal)}
          </Box>
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} alignItems="stretch">
        <Box
          sx={{
            flex: 1.4,
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            p: 2,
            minWidth: 0,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#FDB927', mb: 1.5, fontWeight: 700 }}>
            Costo de actividades por día
          </Typography>
          {summary.dayRows.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Sin días todavía.
            </Typography>
          ) : (
            <Stack spacing={1.25} sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
              {summary.dayRows.map((day) => {
                const pct = summary.maxDayTotal > 0
                  ? Math.round((day.total / summary.maxDayTotal) * 100)
                  : 0;
                return (
                  <Stack key={day.id} spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                        {day.imageUrl ? (
                          <Box
                            component="img"
                            src={day.imageUrl}
                            alt=""
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              objectFit: 'cover',
                              objectPosition: 'top',
                              flexShrink: 0,
                              bgcolor: '#333',
                            }}
                          />
                        ) : null}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" noWrap fontWeight={700}>
                            {day.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }} noWrap>
                            {day.activityCount}
                            {' '}
                            act.
                            {day.seasonLabel ? ` · ${day.seasonLabel}` : ''}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#81c784', fontWeight: 700, flexShrink: 0 }}>
                        {formatCost(day.total)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 6,
                        borderRadius: 99,
                        bgcolor: 'rgba(255,255,255,0.08)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#FDB927',
                          borderRadius: 99,
                        },
                      }}
                    />
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            p: 2,
            minWidth: 0,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#FDB927', mb: 1.5, fontWeight: 700 }}>
            Actividades más caras
          </Typography>
          {summary.topActivities.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Sin actividades con costo.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {summary.topActivities.map((activity, index) => (
                <Stack
                  key={activity.id}
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    py: 0.75,
                    borderBottom: index === summary.topActivities.length - 1
                      ? 0
                      : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {index + 1}
                      .
                      {' '}
                      {activity.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }} noWrap>
                      {activity.dayLabel}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#81c784', fontWeight: 700, flexShrink: 0 }}>
                    {formatCost(activity.cost)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

CostDashboard.propTypes = {
  days: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    seasonLabel: PropTypes.string,
    imageUrl: PropTypes.string,
    activities: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      cost: PropTypes.number,
    })),
  })).isRequired,
  meta: PropTypes.shape({
    foodPerDay: PropTypes.number,
    lodgingPerDay: PropTypes.number,
    roundTripTickets: PropTypes.number,
  }).isRequired,
  onChangeMeta: PropTypes.func.isRequired,
};

export default CostDashboard;
