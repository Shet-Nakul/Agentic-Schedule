import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const ConfirmDialog = ({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onClose, loading = false }) => {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={loading}>{cancelText}</Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
