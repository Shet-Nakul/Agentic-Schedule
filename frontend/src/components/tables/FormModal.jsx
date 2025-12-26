import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Box,
  Typography
} from '@mui/material';

const FormModal = ({
  open,
  onClose,
  title,
  formData,
  formErrors,
  formFields,
  onFormChange,
  onSubmit,
  submitButtonText
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {formFields.map((field) => (
            <Box key={field.name}>
              {field.type === 'text' && (
                <TextField
                  fullWidth
                  size="small"
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => onFormChange(field.name, e.target.value)}
                  error={!!formErrors[field.name]}
                  helperText={formErrors[field.name]}
                  variant="outlined"
                />
              )}
              {field.type === 'number' && (
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => onFormChange(field.name, parseInt(e.target.value) || '')}
                  error={!!formErrors[field.name]}
                  helperText={formErrors[field.name]}
                  variant="outlined"
                />
              )}
              {field.type === 'date' && (
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => onFormChange(field.name, e.target.value)}
                  error={!!formErrors[field.name]}
                  helperText={formErrors[field.name]}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              )}
              {field.type === 'time' && (
                <TextField
                  fullWidth
                  size="small"
                  type="time"
                  label={field.label}
                  value={formData[field.name] || ''}
                  onChange={(e) => onFormChange(field.name, e.target.value)}
                  error={!!formErrors[field.name]}
                  helperText={formErrors[field.name]}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              )}
              {field.type === 'select' && (
                <FormControl fullWidth size="small" error={!!formErrors[field.name]}>
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    multiple={field.multiple || false}  // ✅ Handle multiple selection
                    value={
                      field.multiple 
                        ? (formData[field.name] || [])     // ✅ Use empty array for multiple
                        : (formData[field.name] || '')     // ✅ Use empty string for single
                    }
                    onChange={(e) => onFormChange(field.name, e.target.value)}
                    label={field.label}
                    renderValue={
                      field.multiple 
                        ? (selected) => {
                            // Show selected labels instead of values
                            const selectedLabels = selected
                              .map(value => field.options?.find(option => option.value == value)?.label)
                              .filter(Boolean);
                            return selectedLabels.join(', ');
                          }
                        : undefined
                    }
                  >
                    {!field.multiple && (
                      <MenuItem value="">
                        <em>Select {field.label}</em>
                      </MenuItem>
                    )}
                    {field.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors[field.name] && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {formErrors[field.name]}
                    </Typography>
                  )}
                </FormControl>
              )}
              {field.type === 'boolean' && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData[field.name] || false}
                      onChange={(e) => onFormChange(field.name, e.target.checked)}
                    />
                  }
                  label={field.label}
                />
              )}
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={onSubmit} variant="contained">
          {submitButtonText || 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormModal;