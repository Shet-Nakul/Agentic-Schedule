import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
  Box,
  Typography,
  Card,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import apiService from '../services/api';
import {
  Users,
  Shield,
  Briefcase,
  Coffee,
  Sunset,
  Moon,
  Sun,
  Sunrise,
  Filter,
  X
} from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const ScheduleView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedShiftEvent, setSelectedShiftEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('sample');

  const theme = useTheme();

  // Shift mappings
  const shiftConfig = {
    'L': { 
      name: 'Late Shift', 
      type: 'evening', 
      time: '14:00-22:00',
      color: '#8e24aa',
      icon: Users,
      description: 'Late afternoon and evening operations',
    },
    'N': { 
      name: 'Night Shift', 
      type: 'night', 
      time: '22:00-06:00',
      color: '#3f51b5',
      icon: Shield,
      description: 'Overnight operations and security',
    },
    'D': { 
      name: 'Day Shift', 
      type: 'day', 
      time: '09:00-17:00',
      color: '#2196f3',
      icon: Briefcase,
      description: 'Regular business hours operations',
    },
    'E': { 
      name: 'Early Shift', 
      type: 'morning', 
      time: '06:00-14:00',
      color: '#ff9800',
      icon: Coffee,
      description: 'Early morning operations and setup',
    },
    'DH': { 
      name: 'Day Holiday', 
      type: 'day', 
      time: '09:00-17:00',
      color: '#4caf50',
      icon: Briefcase,
      description: 'Holiday day shift operations',
    }
  };

  useEffect(() => {
    handleLoadSample();
  }, []);

  useEffect(() => {
    if (viewMode === 'live') {
      handleLoadLive();
    } else {
      handleLoadSample();
    }
  }, [viewMode, date]);

  const parseShiftTime = (dateStr, timeRange) => {
    if (!timeRange) return { start: new Date(dateStr), end: new Date(dateStr) };
    const [startStr, endStr] = timeRange.split('-');
    
    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const start = new Date(dateStr);
    start.setHours(startHour, startMin, 0, 0);

    const end = new Date(dateStr);
    end.setHours(endHour, endMin, 0, 0);

    // Handle overnight shifts (e.g., 22:00 - 06:00)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    return { start, end };
  };

  const normalizeRow = (row) => {
    const out = {
      date: row.date ?? row.Date,
      employee_id: row.employee_id ?? row.EmployeeID,
      shift: row.shift ?? row.Shift,
      working: row.working ?? row.Working
    };
    if (typeof out.working === 'number') out.working = out.working === 1;
    if (typeof out.working === 'string') out.working = out.working === '1' || out.working.toLowerCase() === 'true';
    return out;
  };

  const handleLoadLive = async () => {
    try {
      setLoading(true);
      setError(null);
      const startBoundary = new Date(date.getFullYear(), date.getMonth(), 1);
      const endBoundary = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const startStr = startBoundary.toISOString().split('T')[0];
      const endStr = endBoundary.toISOString().split('T')[0];
      const res = await apiService.getEmployeeScheduleByDateRange(startStr, endStr);
      const rows = res?.payload?.schedules ?? (Array.isArray(res) ? res : []);
      const normalized = rows.map(normalizeRow);
      const transformed = transformAssignmentsData(normalized);
      setEvents(transformed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remapToCurrentMonthDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length < 3) return null;
    const day = Number(parts[2]);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Keep the day, but move to current month/year for demo purposes
    // Be careful with days not in current month (e.g. 31st in Feb)
    const maxDays = new Date(year, month + 1, 0).getDate();
    const validDay = Math.min(day, maxDays);
    
    const d = new Date(year, month, validDay);
    return d.toISOString().split('T')[0];
  };

  const transformAssignmentsData = (rawData) => {
    const aggregated = new Map();
    const employeesMap = new Map();

    rawData.forEach(item => {
      if (!item.working) return;
      const { date, employee_id, shift } = item;
      const remappedDateStr = remapToCurrentMonthDate(date);
      if (!remappedDateStr) return;
      const key = `${remappedDateStr}-${shift}`;
      const config = shiftConfig[shift] || shiftConfig['D'];
      const empId = `EMP${String(employee_id).padStart(3, '0')}`;
      const empName = `Employee ${employee_id}`;
      if (!employeesMap.has(empId)) {
        employeesMap.set(empId, { id: empId, name: empName });
      }
      if (!aggregated.has(key)) {
        const { start, end } = parseShiftTime(remappedDateStr, config.time);
        aggregated.set(key, {
          id: key,
          title: `${config.name}`,
          start,
          end,
          resource: {
            employees: [],
            shiftType: shift,
            role: config.type
          }
        });
      }
      const evt = aggregated.get(key);
      evt.resource.employees.push({ id: empId, name: empName });
    });

    setAllEmployees(Array.from(employeesMap.values()));
    return Array.from(aggregated.values());
  };

  const handleLoadSample = async () => {
    try {
      setLoading(true);
      setError(null);
      const base = import.meta.env.BASE_URL || '/';
      const candidates = [
        `${base}scheduler_response.json`,
        `${base}sampleJson.json`,
        'sampleJson.json',
        './sampleJson.json'
      ];

      let raw = null;
      for (const url of candidates) {
        try {
          const resp = await fetch(url, { cache: 'no-store' });
          if (resp.ok) {
            const ct = resp.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              raw = await resp.json();
              break;
            } else {
              const text = await resp.text();
              if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                raw = JSON.parse(text);
                break;
              }
            }
          }
        } catch (e) {
          console.warn('Failed to load from', url, e);
        }
      }

      if (!raw) {
        // Fallback dummy data if file not found
        raw = generateDummyData();
      }

      const transformed = Array.isArray(raw) ? transformAssignmentsData(raw) : []; 
      // If raw is object (scheduler response), we might need different logic, 
      // but requirement says "Mock shift data structure".
      // Let's ensure we have something.
      if (transformed.length === 0 && !Array.isArray(raw)) {
         // Maybe it is the scheduler response format with 'requirements' but we need 'assignments'
         // For now, let's use a generator if empty
         const dummy = generateDummyData();
         setEvents(transformAssignmentsData(dummy));
      } else {
        setEvents(transformed);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const generateDummyData = () => {
     const data = [];
     const shifts = ['D', 'E', 'L', 'N'];
     const today = new Date();
     const year = today.getFullYear();
     const month = today.getMonth();
     
     for (let i = 1; i <= 28; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        // 5 employees per day
        for (let e = 1; e <= 5; e++) {
           data.push({
             date: dateStr,
             employee_id: e,
             working: true,
             shift: shifts[Math.floor(Math.random() * shifts.length)]
           });
        }
     }
     return data;
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (selectedEmployee && !event.resource.employees?.some(e => e.id === selectedEmployee)) return false;
      if (selectedRole && event.resource.role !== selectedRole) return false;
      return true;
    });
  }, [events, selectedEmployee, selectedRole]);

  const eventPropGetter = (event) => {
    const shiftCode = event.resource.shiftType;
    const config = shiftConfig[shiftCode];
    return {
      style: {
        backgroundColor: config?.color || '#3174ad',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const onSelectEvent = (event) => {
    setSelectedShiftEvent(event);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header & Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 0, borderBottom: '1px solid #e0e0e0' }} elevation={1}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight="600" color="text.primary">
            Staff Schedule
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
            >
              <ToggleButton value="sample">Sample</ToggleButton>
              <ToggleButton value="live">Live</ToggleButton>
            </ToggleButtonGroup>
            <Chip
              label={viewMode === 'sample' ? 'Sample Data' : 'Live Data'}
              size="small"
              variant="outlined"
            />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ minWidth: { md: 400 }, width: { xs: '100%', md: 'auto' } }}>
             <FormControl size="small" fullWidth>
                <InputLabel>Filter by Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Filter by Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  startAdornment={<Users size={16} style={{ marginRight: 8, color: '#666' }} />}
                >
                  <MenuItem value=""><em>All Employees</em></MenuItem>
                  {allEmployees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
                  ))}
                </Select>
             </FormControl>

             <FormControl size="small" fullWidth>
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={selectedRole}
                  label="Shift Type"
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <MenuItem value=""><em>All Shifts</em></MenuItem>
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="evening">Evening</MenuItem>
                  <MenuItem value="night">Night</MenuItem>
                </Select>
             </FormControl>
          </Stack>
        </Stack>
      </Paper>

      {/* Calendar Area */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden' }}>
        <Paper sx={{ height: '100%', p: 2, borderRadius: 2 }} elevation={0}>
          {viewMode === 'live' && filteredEvents.length === 0 ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">No schedule to display</Typography>
            </Box>
          ) : (
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              eventPropGetter={eventPropGetter}
              components={{
                event: ({ event }) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {event.title}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      ({event.resource.employees?.length || 0})
                    </Typography>
                  </Box>
                )
              }}
              onSelectEvent={onSelectEvent}
              popup
            />
          )}
        </Paper>
      </Box>
      <Dialog
        open={dialogOpen && !!selectedShiftEvent}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedShiftEvent?.title}
        </DialogTitle>
        <DialogContent dividers>
          {selectedShiftEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Shift: ${selectedShiftEvent.resource.shiftType}`} />
                <Chip label={`Employees: ${selectedShiftEvent.resource.employees?.length || 0}`} />
                <Chip label={`Start: ${format(selectedShiftEvent.start, 'p')}`} />
                <Chip label={`End: ${format(selectedShiftEvent.end, 'p')}`} />
              </Box>
              <Stack spacing={1}>
                {(selectedShiftEvent.resource.employees || []).map(emp => (
                  <Box key={emp.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 28, height: 28 }}>{emp.name.charAt(0)}</Avatar>
                    <Typography variant="body2">{emp.name}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleView;
