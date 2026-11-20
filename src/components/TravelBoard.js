/* eslint-disable import/prefer-default-export */
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack } from '@mui/material';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { DayColumn } from './DayColumn';
import { ActivityCardContent } from './ActivityCard';

export function TravelBoard({
  days,
  activeActivity,
  onDragStart,
  onDragOver,
  onDragEnd,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onDeleteDay,
  onRenameDay,
  onChangeImagePosition,
  onResetDayImage,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <Stack
        direction="row"
        spacing={{ xs: 1.25, sm: 2 }}
        alignItems="flex-start"
        sx={{
          overflowX: 'auto',
          overflowY: 'hidden',
          pb: 2,
          height: '100%',
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
          mx: { xs: -0.5, sm: 0 },
          px: { xs: 0.5, sm: 0 },
        }}
      >
        {days.map((day) => (
          <DayColumn
            key={day.id}
            day={day}
            onAddActivity={onAddActivity}
            onEditActivity={onEditActivity}
            onDeleteActivity={onDeleteActivity}
            onDeleteDay={onDeleteDay}
            onRenameDay={onRenameDay}
            onChangeImagePosition={onChangeImagePosition}
            onResetDayImage={onResetDayImage}
          />
        ))}
      </Stack>

      <DragOverlay>
        {activeActivity ? (
          <Box sx={{ width: 280 }}>
            <ActivityCardContent
              activity={activeActivity}
              isDragging
              showActions={false}
            />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

const activityShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  notes: PropTypes.string,
  location: PropTypes.string,
  imageUrl: PropTypes.string,
  cost: PropTypes.number,
  order: PropTypes.number,
});

const dayShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  order: PropTypes.number,
  seasonId: PropTypes.string,
  seasonLabel: PropTypes.string,
  imageUrl: PropTypes.string,
  imagePosition: PropTypes.string,
  activities: PropTypes.arrayOf(activityShape),
});

TravelBoard.propTypes = {
  days: PropTypes.arrayOf(dayShape).isRequired,
  activeActivity: activityShape,
  onDragStart: PropTypes.func.isRequired,
  onDragOver: PropTypes.func.isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onAddActivity: PropTypes.func.isRequired,
  onEditActivity: PropTypes.func.isRequired,
  onDeleteActivity: PropTypes.func.isRequired,
  onDeleteDay: PropTypes.func.isRequired,
  onRenameDay: PropTypes.func.isRequired,
  onChangeImagePosition: PropTypes.func.isRequired,
  onResetDayImage: PropTypes.func.isRequired,
};

TravelBoard.defaultProps = {
  activeActivity: null,
};

export default TravelBoard;
