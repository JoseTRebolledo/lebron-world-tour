/* eslint-disable import/prefer-default-export */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CropOriginalIcon from '@mui/icons-material/CropOriginal';
import BrokenImageOutlinedIcon from '@mui/icons-material/BrokenImageOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ActivityCard } from './ActivityCard';
import { PromptDialog } from './PromptDialog';
import {
  IMAGE_POSITIONS,
  LEBRON_SEASONS,
  formatCost,
  getSeasonForDayIndex,
  normalizeImagePosition,
  sumActivitiesCost,
} from '../helpers/constants';

export function DayColumn({
  day,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onDeleteDay,
  onRenameDay,
  onChangeImagePosition,
  onResetDayImage,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: day.id,
    data: { type: 'column', dayId: day.id },
  });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [imageBroken, setImageBroken] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  // Clear sticky error state when the URL changes (e.g. "Restaurar fotos").
  useEffect(() => {
    setImageBroken(false);
  }, [day.imageUrl]);

  const activityIds = (day.activities || []).map((activity) => activity.id);
  const dayTotal = sumActivitiesCost(day.activities);
  const imagePosition = normalizeImagePosition(day.imagePosition);
  const defaultSeason = LEBRON_SEASONS.find((season) => season.id === day.seasonId)
    || getSeasonForDayIndex(day.order || 0);
  const isCustomImage = Boolean(day.imageUrl && day.imageUrl !== defaultSeason.imageUrl);

  return (
    <Paper
      elevation={0}
      sx={{
        width: { xs: 260, sm: 280, md: 300 },
        minWidth: { xs: 260, sm: 280, md: 300 },
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isOver ? 'rgba(253, 185, 39, 0.18)' : 'rgba(255,255,255,0.08)',
        border: '1px solid',
        borderColor: isOver ? '#FDB927' : 'rgba(255,255,255,0.12)',
        borderRadius: 2.5,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', height: { xs: 110, sm: 140 }, flexShrink: 0 }}>
        <Box
          component="img"
          key={day.imageUrl || day.id}
          src={day.imageUrl || defaultSeason.imageUrl}
          alt={day.seasonLabel || day.label}
          onError={() => setImageBroken(true)}
          onLoad={() => setImageBroken(false)}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: imagePosition,
            display: imageBroken ? 'none' : 'block',
            bgcolor: '#222',
          }}
        />
        {imageBroken ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={0.5}
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: '#1a1a1a',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            <BrokenImageOutlinedIcon />
            <Typography variant="caption">Foto no cargó</Typography>
          </Stack>
        ) : null}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 100%)',
            pointerEvents: 'none',
          }}
        />
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          {(isCustomImage || imageBroken) ? (
            <Tooltip title="Restaurar foto default (ESPN)">
              <IconButton
                size="small"
                onClick={() => {
                  setImageBroken(false);
                  onResetDayImage(day.id);
                }}
                sx={{
                  bgcolor: imageBroken ? '#FDB927' : 'rgba(0,0,0,0.55)',
                  color: imageBroken ? '#111' : '#FDB927',
                  '&:hover': {
                    bgcolor: imageBroken ? '#ffe08a' : 'rgba(0,0,0,0.75)',
                  },
                }}
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          <Tooltip title="Posición de la foto">
            <IconButton
              size="small"
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={{
                bgcolor: 'rgba(0,0,0,0.55)',
                color: '#FDB927',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              }}
            >
              <CropOriginalIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          {IMAGE_POSITIONS.map((option) => (
            <MenuItem
              key={option.id}
              selected={option.value === imagePosition}
              onClick={() => {
                onChangeImagePosition(day.id, option.value);
                setMenuAnchor(null);
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
        <Stack
          direction="row"
          alignItems="flex-end"
          justifyContent="space-between"
          sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, px: 1.5, pb: 1.25 }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => setRenameOpen(true)}
            sx={{
              border: 0,
              background: 'transparent',
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer',
              p: 0,
              flex: 1,
              minWidth: 0,
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} noWrap>
              {day.label}
            </Typography>
            <Typography variant="caption" sx={{ color: '#FDB927', fontWeight: 700 }}>
              {day.seasonLabel || 'Temporada LeBron'}
            </Typography>
            <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {day.activities?.length || 0}
              {' '}
              actividades ·
              {' '}
              {formatCost(dayTotal)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => onDeleteDay(day.id)} sx={{ color: '#ff8a80' }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Stack
        ref={setNodeRef}
        spacing={1.25}
        sx={{
          p: 1.25,
          flex: 1,
          overflowY: 'auto',
          minHeight: 120,
        }}
      >
        <SortableContext items={activityIds} strategy={verticalListSortingStrategy}>
          {(day.activities || []).map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              imagePosition={imagePosition}
              onEdit={(item) => onEditActivity(day.id, item)}
              onDelete={(activityId) => onDeleteActivity(day.id, activityId)}
            />
          ))}
        </SortableContext>
      </Stack>

      <Box sx={{ p: 1.25, pt: 0 }}>
        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => onAddActivity(day.id)}
          sx={{
            color: '#FDB927',
            border: '1px dashed rgba(253,185,39,0.5)',
            '&:hover': { borderColor: '#FDB927', bgcolor: 'rgba(253,185,39,0.08)' },
          }}
        >
          Agregar actividad
        </Button>
      </Box>

      <PromptDialog
        open={renameOpen}
        title="Renombrar día"
        label="Nombre del día"
        initialValue={day.label}
        confirmLabel="Guardar"
        onCancel={() => setRenameOpen(false)}
        onConfirm={(next) => {
          onRenameDay(day.id, next);
          setRenameOpen(false);
        }}
      />
    </Paper>
  );
}

DayColumn.propTypes = {
  day: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    order: PropTypes.number,
    seasonId: PropTypes.string,
    imageUrl: PropTypes.string,
    imagePosition: PropTypes.string,
    seasonLabel: PropTypes.string,
    activities: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      notes: PropTypes.string,
      location: PropTypes.string,
      imageUrl: PropTypes.string,
      cost: PropTypes.number,
      order: PropTypes.number,
    })),
  }).isRequired,
  onAddActivity: PropTypes.func.isRequired,
  onEditActivity: PropTypes.func.isRequired,
  onDeleteActivity: PropTypes.func.isRequired,
  onDeleteDay: PropTypes.func.isRequired,
  onRenameDay: PropTypes.func.isRequired,
  onChangeImagePosition: PropTypes.func.isRequired,
  onResetDayImage: PropTypes.func.isRequired,
};

export default DayColumn;
