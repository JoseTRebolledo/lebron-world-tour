import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  formatCost,
  normalizeImagePosition,
  parseCost,
  parsePriority,
} from '../helpers/constants';

const activityShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  notes: PropTypes.string,
  location: PropTypes.string,
  imageUrl: PropTypes.string,
  cost: PropTypes.number,
  priority: PropTypes.number,
});

const PriorityDots = ({ priority }) => {
  const level = parsePriority(priority);
  return (
    <Stack direction="row" spacing={0.35} alignItems="center" aria-label={`Prioridad ${level}`}>
      {[1, 2, 3, 4, 5].map((dot) => (
        <Box
          key={dot}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: dot <= level ? '#FDB927' : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </Stack>
  );
};

PriorityDots.propTypes = {
  priority: PropTypes.number,
};

PriorityDots.defaultProps = {
  priority: 3,
};

const ActivityDetailTooltip = ({ activity }) => (
  <Stack spacing={0.75} sx={{ p: 0.5, maxWidth: 280 }}>
    <Typography variant="subtitle2" fontWeight={700}>
      {activity.title}
    </Typography>
    {activity.location ? (
      <Typography variant="caption" sx={{ color: '#FDB927' }}>
        {activity.location}
      </Typography>
    ) : null}
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Typography variant="caption" sx={{ color: '#81c784', fontWeight: 700 }}>
        {formatCost(parseCost(activity.cost))}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
        Prioridad
        {' '}
        {parsePriority(activity.priority)}
        /5
      </Typography>
    </Stack>
    {activity.notes ? (
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
        {activity.notes}
      </Typography>
    ) : (
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
        Sin notas
      </Typography>
    )}
  </Stack>
);

ActivityDetailTooltip.propTypes = {
  activity: activityShape.isRequired,
};

export const ActivityCardContent = ({
  activity,
  onEdit,
  onDelete,
  dragHandleProps,
  isDragging,
  showActions,
  imagePosition,
}) => (
  <Tooltip
    title={<ActivityDetailTooltip activity={activity} />}
    arrow
    placement="top"
    enterDelay={350}
    leaveDelay={100}
    componentsProps={{
      tooltip: {
        sx: {
          bgcolor: '#1a1a1a',
          border: '1px solid rgba(253,185,39,0.45)',
          maxWidth: 320,
          p: 1,
        },
      },
      arrow: { sx: { color: '#1a1a1a' } },
    }}
  >
    <Paper
      elevation={isDragging ? 8 : 2}
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: '#1a1a1a',
        color: '#fff',
        border: '1px solid',
        borderColor: isDragging ? '#FDB927' : 'rgba(253, 185, 39, 0.35)',
        opacity: isDragging ? 0.95 : 1,
        width: '100%',
        cursor: 'default',
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        '&:hover': {
          borderColor: '#FDB927',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        {dragHandleProps ? (
          <Box
            {...dragHandleProps}
            sx={{
              cursor: 'grab',
              color: '#FDB927',
              display: 'flex',
              pt: 0.25,
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        ) : null}
        <Box
          component="img"
          key={activity.imageUrl || activity.id}
          src={activity.imageUrl}
          alt=""
          sx={{
            width: 56,
            height: 56,
            borderRadius: 1.5,
            objectFit: 'cover',
            objectPosition: normalizeImagePosition(imagePosition),
            flexShrink: 0,
            bgcolor: '#333',
          }}
          onError={(event) => {
            const image = event.currentTarget;
            image.style.display = 'none';
          }}
          onLoad={(event) => {
            const image = event.currentTarget;
            image.style.display = 'block';
          }}
        />
        <Stack spacing={0.25} flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {activity.title}
          </Typography>
          {activity.location ? (
            <Typography variant="caption" sx={{ color: '#FDB927' }} noWrap>
              {activity.location}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" sx={{ color: '#81c784', fontWeight: 700 }}>
              {formatCost(parseCost(activity.cost))}
            </Typography>
            <PriorityDots priority={activity.priority} />
          </Stack>
          {activity.notes ? (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {activity.notes}
            </Typography>
          ) : null}
        </Stack>
        {showActions ? (
          <Stack direction="row" spacing={0}>
            <IconButton size="small" onClick={() => onEdit(activity)} sx={{ color: '#fff' }}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(activity.id)} sx={{ color: '#ff8a80' }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  </Tooltip>
);

ActivityCardContent.propTypes = {
  activity: activityShape.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  dragHandleProps: PropTypes.shape({}),
  isDragging: PropTypes.bool,
  showActions: PropTypes.bool,
  imagePosition: PropTypes.string,
};

ActivityCardContent.defaultProps = {
  onEdit: () => {},
  onDelete: () => {},
  dragHandleProps: null,
  isDragging: false,
  showActions: true,
  imagePosition: 'top',
};

export function ActivityCard({ activity, onEdit, onDelete, imagePosition }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id, data: { type: 'activity', activity } });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <ActivityCardContent
        activity={activity}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        showActions
        imagePosition={imagePosition}
      />
    </Box>
  );
}

ActivityCard.propTypes = {
  activity: activityShape.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  imagePosition: PropTypes.string,
};

ActivityCard.defaultProps = {
  imagePosition: 'top',
};
