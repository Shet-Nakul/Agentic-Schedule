import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Alert, 
  CircularProgress, 
  Chip, 
  Divider, 
  Grid, 
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Schedule as ScheduleIcon, 
  CalendarToday as CalendarIcon, 
  CheckCircle as CheckCircleIcon, 
  Warning as WarningIcon, 
  Refresh as RefreshIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import apiService from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import FeedbackDialog from './FeedbackDialog';
import ExcelUploader from './ExcelUploader';
import { Add as AddIcon, TableChart as TableChartIcon } from '@mui/icons-material';
import useEventResults from '../hooks/useEventResults';
import SchedulePreview from './SchedulePreview';

 

const Scheduler = () => {
  const [loading, setLoading] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [schedulePeriod, setSchedulePeriod] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [horizon, setHorizon] = useState(28);
  const [generatedAssignments, setGeneratedAssignments] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [shiftReqs, setShiftReqs] = useState([]);
  const [skillsOptions, setSkillsOptions] = useState([]);
  const [shiftsOptions, setShiftsOptions] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [feedback, setFeedback] = useState({
    open: false,
    title: '',
    message: ''
  });
  const [readiness, setReadiness] = useState({ ready: false, missing: [], stats: {} });
  const [reqForm, setReqForm] = useState({ dayOfWeek: '', shift: '', skillId: '', preferred: '' });
  const [reqErrors, setReqErrors] = useState({});
  const [editReqOpen, setEditReqOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  // Hook into the socket for staff_roster results
  const { eventResults } = useEventResults(
    import.meta.env.VITE_API_URL || 'http://localhost:3001',
    'staff_roster'
  );

  // Listen for new results from the socket
  useEffect(() => {
    if (eventResults && eventResults.length > 0) {
      // Get the latest result
      const latest = eventResults[eventResults.length - 1];
      
      // Check if it has payload data
      let payload = null;
      try {
        if (typeof latest.EventData === 'string') {
          payload = JSON.parse(latest.EventData);
        } else {
          payload = latest.EventData;
        }
      } catch (e) {
        console.error('Failed to parse socket event data', e);
      }

      if (payload && payload.assignments) {
        console.log('Received assignments from socket:', payload.assignments);
        setGeneratedAssignments(payload.assignments);
        setLoading(false);
        setSuccess('Schedule generated! Click "Preview Schedule" to review.');
        // Don't show preview immediately, let user click the button as per UX
      }
    }
  }, [eventResults]);

  useEffect(() => {
    calculateSchedulePeriod();
  }, []);

  useEffect(() => {
    if (schedulePeriod) {
      checkActiveSchedule();
      checkReadiness();
      loadShiftRequirements();
      loadSupportData();
    }
  }, [schedulePeriod]);

  const calculateSchedulePeriod = () => {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 28);

    setSchedulePeriod({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startDateFormatted: startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      endDateFormatted: endDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
  };

  const checkActiveSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!schedulePeriod) {
        setLoading(false);
        return;
      }

      const response = await apiService.getEmployeeScheduleByDateRange(
        schedulePeriod.startDate,
        schedulePeriod.endDate
      );

      const schedules = response?.payload?.schedules || [];

      if (Array.isArray(schedules) && schedules.length > 0) {
        setActiveSchedule({
          id: 'current',
          status: 'active'
        });
      }
    } catch (error) {
      console.error('Error checking active schedule:', error);
      setError('Failed to check for active schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractAssignments = (externalData) => {
    if (!externalData) return [];
    if (Array.isArray(externalData)) return externalData;
    if (Array.isArray(externalData.assignments)) return externalData.assignments;
    if (Array.isArray(externalData.shift_assignments)) return externalData.shift_assignments;
    if (Array.isArray(externalData.payload)) return externalData.payload;
    return [];
  };

  const checkReadiness = async () => {
    try {
      const sources = [
        { key: 'skills', table: 'Skills', label: 'Skills', required: true },
        { key: 'shifts', table: 'Shifts', label: 'Shifts', required: true },
        { key: 'contracts', table: 'ContractsDetails', label: 'Contracts', required: true },
        { key: 'staff', table: 'Staff', label: 'Staff', required: true },
        { key: 'dayOff', table: 'DayOffRequests', label: 'Day Off Requests', required: true },
        { key: 'shiftOff', table: 'ShiftOffRequests', label: 'Shift Off Requests', required: true },
        { key: 'shiftReq', table: 'ShiftRequirements', label: 'Shift Requirements', required: true },
      ];

      const results = await Promise.allSettled(
        sources.map(s => apiService.getTableData(s.table))
      );

      const stats = {};
      const missing = [];
      results.forEach((res, idx) => {
        const src = sources[idx];
        if (res.status === 'fulfilled') {
          const arr = Array.isArray(res.value) ? res.value : [];
          stats[src.key] = arr.length;
          if (src.required && arr.length === 0) missing.push(src.label || src.table);
        } else {
          stats[src.key] = 0;
          missing.push(`${src.label || src.table} (fetch failed)`);
        }
      });

      const requiredMissing = missing.filter(m => !m.endsWith('(fetch failed)'));
      const ready = requiredMissing.length === 0 && ['skills','shifts','contracts','staff','dayOff','shiftOff','shiftReq'].every(k => (stats[k] || 0) > 0);
      setReadiness({ ready, missing: requiredMissing, stats });
    } catch (_) {
      setReadiness({ ready: false, missing: ['Server connection'], stats: {} });
    }
  };

  const handleRequestSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!schedulePeriod) {
        setError('Schedule period not calculated. Please refresh the page.');
        setLoading(false);
        return;
      }

      if (!readiness.ready) {
        const items = readiness.missing.length > 0 ? readiness.missing.join(', ') : 'required data';
        setError(`Cannot request schedule. Missing: ${items}.`);
        setLoading(false);
        return;
      }

      if (activeSchedule) {
        setError('There is already an active schedule for this period. Cannot create a new one.');
        setLoading(false);
        return;
      }

      const res = await apiService.startEvent({
        eventName: 'staff roster',
        horizon,
        startDate: schedulePeriod.startDate,
        endDate: schedulePeriod.endDate
      });

      const external = res?.payload?.eventDetails?.externalApiResponse;
      const assignments = extractAssignments(external);

      if (!assignments || assignments.length === 0) {
        const externalError = (external && (external.error || external.details)) ? `${external.error}${external.details ? ` - ${external.details}` : ''}` : null;
        setError(externalError || 'Scheduler did not return any assignments.');
        setLoading(false);
        return;
      }

      setGeneratedAssignments(assignments);
      setSuccess('Schedule generated successfully. Review and save to database.');
    } catch (error) {
      console.error('Error requesting schedule:', error);
      setError('Failed to request schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!generatedAssignments || generatedAssignments.length === 0) return;

    try {
      const normalized = generatedAssignments.map(a => ({
        date: a.date || a.Day || a.day || a.shift_date,
        employee_id: Number(a.employee_id || a.EmployeeID || a.staffId),
        shift: a.shift || a.Shift || a.shiftCode,
        working: a.working !== undefined ? a.working : true
      }));

      // Filter out invalid entries (e.g. null shifts from solver)
      const validAssignments = normalized.filter(a => a.date && a.shift);

      await apiService.saveEmployeeSchedule(validAssignments);

      setFeedback({
        open: true,
        title: 'Success',
        message: 'Schedule saved successfully.'
      });

      setActiveSchedule({ id: 'current', status: 'active' });
      setShowPreview(false);
      setGeneratedAssignments([]);
    } catch (e) {
      setFeedback({
        open: true,
        title: 'Error',
        message: 'Failed to save schedule.'
      });
    }
  };

  const handleDiscardSchedule = () => {
    setConfirmDialog({
      open: true,
      title: 'Discard Schedule',
      message: 'Are you sure you want to discard this generated schedule?',
      onConfirm: () => {
        setGeneratedAssignments([]);
        setShowPreview(false);
        setSuccess(null);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const formatDateRange = () => {
    if (!schedulePeriod) return '';
    const start = new Date(schedulePeriod.startDate);
    const end = new Date(schedulePeriod.endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getStatusColor = () => {
    if (activeSchedule) return 'error';
    return 'success';
  };

  const getStatusIcon = () => {
    if (activeSchedule) return <WarningIcon />;
    return <CheckCircleIcon />;
  };

  const getStatusText = () => {
    if (activeSchedule) return 'Active Schedule Exists';
    return 'No Active Schedule';
  };

  const validateReqForm = () => {
    const errs = {};
    if (!reqForm.dayOfWeek) errs.dayOfWeek = 'Required';
    if (!reqForm.shift) errs.shift = 'Required';
    if (!reqForm.skillId) errs.skillId = 'Required';
    if (reqForm.preferred === '' || reqForm.preferred === null || reqForm.preferred === undefined) errs.preferred = 'Required';
    else if (Number.isNaN(Number(reqForm.preferred)) || Number(reqForm.preferred) < 0) errs.preferred = 'Invalid';
    setReqErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddRequirement = async () => {
    if (!validateReqForm()) return;
    try {
      const payload = {
        dayOfWeek: reqForm.dayOfWeek,
        shift: reqForm.shift,
        skillId: Number(reqForm.skillId),
        preferred: Number(reqForm.preferred)
      };
      await apiService.createRecord('ShiftRequirements', payload);
      await loadShiftRequirements();
      await checkReadiness();
      setReqForm({ dayOfWeek: '', shift: '', skillId: '', preferred: '' });
      setReqErrors({});
      setFeedback({ open: true, title: 'Success', message: 'Shift requirement added.' });
    } catch (e) {
      setFeedback({ open: true, title: 'Error', message: `Error adding shift requirement: ${e.message}` });
    }
  };

  const handleDeleteRequirement = async (id) => {
    try {
      await apiService.deleteRecord('ShiftRequirements', id);
      await loadShiftRequirements();
      await checkReadiness();
      setFeedback({ open: true, title: 'Success', message: 'Shift requirement deleted.' });
    } catch (e) {
      setFeedback({ open: true, title: 'Error', message: `Error deleting shift requirement: ${e.message}` });
    }
  };

  const openEditRequirement = (req) => {
    setEditingReqId(req.RequirementID);
    setReqForm({
      dayOfWeek: req.DayOfWeek || '',
      shift: req.Shift || '',
      skillId: req.SkillID || '',
      preferred: req.Preferred ?? ''
    });
    setEditReqOpen(true);
  };

  const handleEditRequirementSubmit = async () => {
    if (!validateReqForm()) return;
    try {
      const payload = {
        dayOfWeek: reqForm.dayOfWeek,
        shift: reqForm.shift,
        skillId: Number(reqForm.skillId),
        preferred: Number(reqForm.preferred)
      };
      await apiService.updateRecord('ShiftRequirements', editingReqId, payload);
      await loadShiftRequirements();
      await checkReadiness();
      setEditReqOpen(false);
      setEditingReqId(null);
      setReqForm({ dayOfWeek: '', shift: '', skillId: '', preferred: '' });
      setFeedback({ open: true, title: 'Success', message: 'Shift requirement updated.' });
    } catch (e) {
      setFeedback({ open: true, title: 'Error', message: `Error updating shift requirement: ${e.message}` });
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      checkActiveSchedule(),
      checkReadiness(),
      loadShiftRequirements(),
      loadSupportData()
    ]);
  };

  const loadSupportData = async () => {
    try {
      const [skills, shifts, staff] = await Promise.all([
        apiService.getTableData('Skills'),
        apiService.getTableData('Shifts'),
        apiService.getTableData('Staff')
      ]);
      setSkillsOptions((skills || []).map(s => ({ value: s.SkillID, label: s.SkillName })));
      setShiftsOptions((shifts || []).map(s => ({ value: s.ShiftCode, label: `${s.ShiftName} (${s.ShiftCode})` })));
      setStaffData(staff || []);
    } catch (e) {
      setSkillsOptions([]);
      setShiftsOptions([]);
      setStaffData([]);
    }
  };

  const loadShiftRequirements = async () => {
    try {
      const list = await apiService.getTableData('ShiftRequirements');
      setShiftReqs(Array.isArray(list) ? list : []);
    } catch (e) {
      setShiftReqs([]);
    }
  };

  if (showPreview) {
    return (
      <SchedulePreview 
        assignments={generatedAssignments} 
        staffData={staffData}
        onAccept={handleSaveSchedule}
        onDiscard={handleDiscardSchedule}
      />
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e1e1e', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 40 }} />
            Schedule Manager
          </Typography>
          <Typography variant="body1" sx={{ color: '#6c757d' }}>
            Request and manage 4-week staff schedules
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            borderColor: '#e1e5e9',
            color: '#1e1e1e',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#007acc',
              backgroundColor: '#f8f9fa',
            },
            '&:disabled': {
              borderColor: '#e1e5e9',
              color: '#6c757d',
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Main Schedule Card */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarIcon sx={{ fontSize: 32, color: '#007acc' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Schedule Period
                </Typography>
                <Typography variant="body2" sx={{ color: '#6c757d' }}>
                  {formatDateRange()} (4 weeks)
                </Typography>
              </Box>
            </Box>
            <Chip
              icon={getStatusIcon()}
              label={getStatusText()}
              color={getStatusColor()}
              sx={{ fontWeight: 500, px: 1 }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Schedule Period Details */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e1e5e9' }}>
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1 }}>
                  Start Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {schedulePeriod?.startDateFormatted}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e1e5e9' }}>
                <Typography variant="subtitle2" sx={{ color: '#6c757d', mb: 1 }}>
                  End Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {schedulePeriod?.endDateFormatted}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Status Section */}
          {activeSchedule && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Schedule ID: {activeSchedule.id}
              </Typography>
            </Alert>
          )}

          {/* Action Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ScheduleIcon />}
              onClick={handleRequestSchedule}
              disabled={loading || !!activeSchedule || !readiness.ready || generatedAssignments.length > 0}
              sx={{
                minWidth: 240,
                py: 2,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                backgroundColor: '#007acc',
                boxShadow: '0 2px 4px rgba(0, 122, 204, 0.3)',
                '&:hover': {
                  backgroundColor: '#005a9e',
                  boxShadow: '0 4px 8px rgba(0, 122, 204, 0.4)',
                },
                '&:disabled': {
                  backgroundColor: '#6c757d',
                  color: '#ffffff',
                }
              }}
            >
              {loading ? 'Processing...' : activeSchedule ? 'Schedule Already Active' : generatedAssignments.length > 0 ? 'Schedule Generated' : readiness.ready ? 'Request Schedule' : 'Complete Setup First'}
            </Button>

            {generatedAssignments.length > 0 && (
              <Button
                variant="contained"
                size="large"
                color="primary"
                startIcon={<CalendarIcon />}
                onClick={() => setShowPreview(true)}
                sx={{
                  minWidth: 240,
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Preview Schedule
              </Button>
            )}
          </Box>

          {/* Readiness Info */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Readiness</Typography>
            <Typography variant="caption" sx={{ color: '#6c757d' }}>API: {import.meta.env.VITE_API_URL || 'http://localhost:3001'}</Typography>
            <Paper sx={{ mt: 2, p: 2, border: '1px solid #e1e5e9', backgroundColor: '#f8f9fa' }}>
              <Stack spacing={1.25}>
                {[
                  { label: 'Skills', value: readiness.stats.skills, required: true },
                  { label: 'Shifts', value: readiness.stats.shifts, required: true },
                  { label: 'Contracts', value: readiness.stats.contracts, required: true },
                  { label: 'Staff', value: readiness.stats.staff, required: true },
                  { label: 'Day Off Requests', value: readiness.stats.dayOff || 0, required: true },
                  { label: 'Shift Off Requests', value: readiness.stats.shiftOff || 0, required: true },
                  { label: 'Shift Requirements', value: readiness.stats.shiftReq || 0, required: true },
                ].map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                      <Typography variant="caption" sx={{ color: '#6c757d' }}>{item.required ? 'Required' : 'Optional'}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={item.value > 0 ? `${item.value} available` : 'Missing'}
                      color={item.value > 0 ? 'success' : item.required ? 'error' : 'warning'}
                      variant="outlined"
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
            {(!readiness.ready) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please add missing data before requesting a schedule: {readiness.missing.join(', ')}.
              </Alert>
            )}
          </Box>

          {/* Additional Info */}
          {activeSchedule && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> There is already an active schedule for this 4-week period. 
                You cannot request a new schedule until the current period ends.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add Shift Requirement
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<TableChartIcon />}
              onClick={() => setBulkImportOpen(true)}
              size="small"
            >
              Bulk Import
            </Button>
          </Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" error={!!reqErrors.dayOfWeek}>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  label="Day of Week"
                  value={reqForm.dayOfWeek}
                  onChange={(e) => setReqForm(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Day</em></MenuItem>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Select>
                {reqErrors.dayOfWeek && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {reqErrors.dayOfWeek}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" error={!!reqErrors.shift}>
                <InputLabel>Shift</InputLabel>
                <Select
                  label="Shift"
                  value={reqForm.shift}
                  onChange={(e) => setReqForm(prev => ({ ...prev, shift: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Shift</em></MenuItem>
                  {shiftsOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                {reqErrors.shift && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {reqErrors.shift}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" error={!!reqErrors.skillId}>
                <InputLabel>Skill</InputLabel>
                <Select
                  label="Skill"
                  value={reqForm.skillId}
                  onChange={(e) => setReqForm(prev => ({ ...prev, skillId: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Skill</em></MenuItem>
                  {skillsOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                {reqErrors.skillId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {reqErrors.skillId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Preferred"
                value={reqForm.preferred}
                onChange={(e) => setReqForm(prev => ({ ...prev, preferred: e.target.value }))}
                error={!!reqErrors.preferred}
                helperText={reqErrors.preferred}
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleAddRequirement}>
              Add
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Shift Requirements ({shiftReqs.length})
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Day of Week</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>SkillID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Preferred</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shiftReqs.map((r) => (
                <TableRow key={r.RequirementID}>
                  <TableCell>{r.DayOfWeek}</TableCell>
                  <TableCell>{r.Shift}</TableCell>
                  <TableCell>{r.SkillID}</TableCell>
                  <TableCell>{r.Preferred}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => openEditRequirement(r)} sx={{ mr: 1 }}>Edit</Button>
                    <IconButton size="small" onClick={() => handleDeleteRequirement(r.RequirementID)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editReqOpen} onClose={() => setEditReqOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Shift Requirement</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!reqErrors.dayOfWeek}>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  label="Day of Week"
                  value={reqForm.dayOfWeek}
                  onChange={(e) => setReqForm(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Day</em></MenuItem>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Select>
                {reqErrors.dayOfWeek && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {reqErrors.dayOfWeek}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!reqErrors.shift}>
                <InputLabel>Shift</InputLabel>
                <Select
                  label="Shift"
                  value={reqForm.shift}
                  onChange={(e) => setReqForm(prev => ({ ...prev, shift: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Shift</em></MenuItem>
                  {shiftsOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!reqErrors.skillId}>
                <InputLabel>Skill</InputLabel>
                <Select
                  label="Skill"
                  value={reqForm.skillId}
                  onChange={(e) => setReqForm(prev => ({ ...prev, skillId: e.target.value }))}
                >
                  <MenuItem value=""><em>Select Skill</em></MenuItem>
                  {skillsOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Preferred"
                value={reqForm.preferred}
                onChange={(e) => setReqForm(prev => ({ ...prev, preferred: e.target.value }))}
                error={!!reqErrors.preferred}
                helperText={reqErrors.preferred}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditReqOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditRequirementSubmit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Instructions Card */}
      <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            How it works
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Click "Request Schedule" to generate a new 4-week schedule
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Only one active schedule is allowed per 4-week period
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              The system will automatically calculate the next 4 weeks from today
            </Typography>
            <Typography component="li" variant="body2">
              Once a schedule is active, you cannot request a new one until the period ends
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />

      <FeedbackDialog
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
      />

      {/* Bulk Import Modal */}
      <Dialog 
        open={bulkImportOpen} 
        onClose={() => setBulkImportOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Bulk Import Shift Requirements</DialogTitle>
        <DialogContent dividers>
          <ExcelUploader 
            initialTable="ShiftRequirements"
            onImported={() => {
              setBulkImportOpen(false);
              loadShiftRequirements();
              checkReadiness();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkImportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Scheduler;
