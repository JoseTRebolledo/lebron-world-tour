/* eslint-disable import/prefer-default-export */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

export function PromptDialog({
  open,
  title,
  label,
  initialValue,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    if (open) setValue(initialValue || '');
  }, [open, initialValue]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          color: '#fff',
          border: '1px solid rgba(253,185,39,0.35)',
          minWidth: { xs: '90%', sm: 360 },
        },
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': { borderColor: 'rgba(253,185,39,0.4)' },
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!value.trim()}
          sx={{ bgcolor: '#FDB927', color: '#111', fontWeight: 700, '&:hover': { bgcolor: '#ffe08a' } }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PromptDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  label: PropTypes.string,
  initialValue: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

PromptDialog.defaultProps = {
  label: 'Valor',
  initialValue: '',
  confirmLabel: 'Guardar',
  cancelLabel: 'Cancelar',
};

export default PromptDialog;
