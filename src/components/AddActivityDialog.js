/* eslint-disable import/prefer-default-export */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import {
  DEFAULT_PRIORITY,
  LEBRON_SEASONS,
  PRIORITY_OPTIONS,
  formatSeasonLabel,
  parseCost,
  parsePriority,
} from '../helpers/constants';

const seasonFromImageUrl = (imageUrl) => (
  LEBRON_SEASONS.find((season) => season.imageUrl === imageUrl) || LEBRON_SEASONS[0]
);

export function AddActivityDialog({
  open,
  onClose,
  onSave,
  initialActivity,
  dayLabel,
  defaultImageUrl,
  defaultSeasonId,
}) {
  const [form, setForm] = useState({
    title: '',
    notes: '',
    location: '',
    cost: '',
    priority: DEFAULT_PRIORITY,
    seasonId: LEBRON_SEASONS[0].id,
  });

  useEffect(() => {
    if (!open) return;
    const fallbackSeason = defaultSeasonId
      ? LEBRON_SEASONS.find((season) => season.id === defaultSeasonId)
      : seasonFromImageUrl(defaultImageUrl);
    const season = initialActivity?.imageUrl
      ? seasonFromImageUrl(initialActivity.imageUrl)
      : (fallbackSeason || LEBRON_SEASONS[0]);

    setForm(
      initialActivity
        ? {
          title: initialActivity.title || '',
          notes: initialActivity.notes || '',
          location: initialActivity.location || '',
          cost: initialActivity.cost === 0 || initialActivity.cost
            ? String(initialActivity.cost)
            : '',
          priority: parsePriority(initialActivity.priority),
          seasonId: season.id,
        }
        : {
          title: '',
          notes: '',
          location: '',
          cost: '',
          priority: DEFAULT_PRIORITY,
          seasonId: season.id,
        },
    );
  }, [open, initialActivity, defaultImageUrl, defaultSeasonId]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    const season = LEBRON_SEASONS.find((item) => item.id === form.seasonId) || LEBRON_SEASONS[0];
    onSave({
      ...initialActivity,
      title: form.title.trim(),
      notes: form.notes.trim(),
      location: form.location.trim(),
      cost: parseCost(form.cost),
      priority: parsePriority(form.priority),
      imageUrl: season.imageUrl,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initialActivity ? 'Editar actividad' : 'Nueva actividad'}
        {dayLabel ? ` · ${dayLabel}` : ''}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Título"
            value={form.title}
            onChange={handleChange('title')}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Lugar / ciudad"
            value={form.location}
            onChange={handleChange('location')}
            fullWidth
          />
          <TextField
            label="Notas"
            value={form.notes}
            onChange={handleChange('notes')}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Costo (USD)"
            value={form.cost}
            onChange={handleChange('cost')}
            type="number"
            inputProps={{ min: 0, step: '0.01' }}
            fullWidth
            helperText="Dejá 0 o vacío si es gratis"
          />
          <TextField
            select
            label="Prioridad"
            value={form.priority}
            onChange={handleChange('priority')}
            fullWidth
            helperText="1 = baja · 5 = imprescindible"
          >
            {PRIORITY_OPTIONS.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
                {' '}
                {level === 1 ? '· Baja' : ''}
                {level === 3 ? '· Media' : ''}
                {level === 5 ? '· Imprescindible' : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Temporada LeBron"
            value={form.seasonId}
            onChange={handleChange('seasonId')}
            fullWidth
          >
            {LEBRON_SEASONS.map((season) => (
              <MenuItem key={season.id} value={season.id}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    component="img"
                    src={season.imageUrl}
                    alt={formatSeasonLabel(season)}
                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', objectPosition: 'top' }}
                  />
                  <span>{formatSeasonLabel(season)}</span>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!form.title.trim()}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AddActivityDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialActivity: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    notes: PropTypes.string,
    location: PropTypes.string,
    imageUrl: PropTypes.string,
    cost: PropTypes.number,
    priority: PropTypes.number,
  }),
  dayLabel: PropTypes.string,
  defaultImageUrl: PropTypes.string,
  defaultSeasonId: PropTypes.string,
};

AddActivityDialog.defaultProps = {
  initialActivity: null,
  dayLabel: '',
  defaultImageUrl: '',
  defaultSeasonId: '',
};

export default AddActivityDialog;
