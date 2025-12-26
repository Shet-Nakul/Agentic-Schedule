// ScheduleView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  FileText,
  User,
  Plus,
  X,
  Calendar,
  Briefcase,
  Shield,
  Coffee,
  Sunrise,
  Sun,
  Moon,
  Sunset
} from 'lucide-react';

  const ShiftCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(null);
  const [showShiftDetails, setShowShiftDetails] = useState(false);
  const [shiftsData, setShiftsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('sample');
  const [calendarView, setCalendarView] = useState('month');
  const [sampleStartDate, setSampleStartDate] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Shift mappings
  const shiftConfig = {
    'L': { 
      name: 'Late Shift', 
      type: 'evening', 
      time: '2:00 PM - 10:00 PM',
      gradient: 'linear-gradient(135deg, #8e24aa 0%, #ab47bc 100%)',
      bgColor: '#f3e5f5',
      borderColor: '#ce93d8',
      textColor: '#6a1b9a',
      icon: Users,
      description: 'Late afternoon and evening operations',
      overlayIcon: Sunset
    },
    'N': { 
      name: 'Night Shift', 
      type: 'night', 
      time: '10:00 PM - 6:00 AM',
      gradient: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
      bgColor: '#e8eaf6',
      borderColor: '#9fa8da',
      textColor: '#303f9f',
      icon: Shield,
      description: 'Overnight operations and security',
      overlayIcon: Moon
    },
    'D': { 
      name: 'Day Shift', 
      type: 'day', 
      time: '9:00 AM - 5:00 PM',
      gradient: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
      bgColor: '#e3f2fd',
      borderColor: '#90caf9',
      textColor: '#1565c0',
      icon: Briefcase,
      description: 'Regular business hours operations',
      overlayIcon: Sun
    },
    'E': { 
      name: 'Early Shift', 
      type: 'morning', 
      time: '6:00 AM - 2:00 PM',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
      bgColor: '#fff3e0',
      borderColor: '#ffcc02',
      textColor: '#e65100',
      icon: Coffee,
      description: 'Early morning operations and setup',
      overlayIcon: Sunrise
    },
    'DH': { 
      name: 'Day Holiday', 
      type: 'day', 
      time: '9:00 AM - 5:00 PM',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
      bgColor: '#e8f5e8',
      borderColor: '#a5d6a7',
      textColor: '#2e7d32',
      icon: Briefcase,
      description: 'Holiday day shift operations',
      overlayIcon: Sun
    }
  };

  useEffect(() => {
    handleLoadSample();
  }, []);

  const remapToCurrentMonthDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length < 3) return null;
    const day = Number(parts[2]);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const d = new Date(year, month, day);
    if (d.getMonth() !== month) return null;
    return d.toISOString().split('T')[0];
  };

  const transformAssignmentsData = (rawData) => {
    const grouped = {};
    
    // Group by date and shift
    rawData.forEach(item => {
      if (!item.working) return; // Skip non-working entries
      const { date, employee_id, shift } = item;
      const remappedDate = remapToCurrentMonthDate(date);
      if (!remappedDate) return;
      
      if (!grouped[remappedDate]) {
        grouped[remappedDate] = {};
      }
      
      if (!grouped[remappedDate][shift]) {
        grouped[remappedDate][shift] = [];
      }
      
      grouped[remappedDate][shift].push({
        id: `EMP${String(employee_id).padStart(3, '0')}`,
        name: `Employee ${employee_id}`,
        employee_id: employee_id
      });
    });

    // Convert to calendar format
    const calendarData = {};
    Object.keys(grouped).forEach(dateKey => {
      calendarData[dateKey] = [];
      
      // Define consistent shift order
      const shiftOrder = ['E', 'D', 'DH', 'L', 'N'];
      
      shiftOrder.forEach(shiftCode => {
        if (grouped[dateKey][shiftCode]) {
          const config = shiftConfig[shiftCode] || shiftConfig['D'];
          const people = grouped[dateKey][shiftCode];
          const allocated = people.length;
          // const required = Math.max(allocated, allocated + Math.floor(Math.random() * 3) + 1);
          const required = people.length;
          
          calendarData[dateKey].push({
            id: `${dateKey}-${shiftCode}`,
            name: config.name,
            time: config.time,
            allocated: allocated,
            required: required,
            people: people,
            description: config.description,
            shiftCode: shiftCode,
            ...config
          });
        }
      });
    });

    return calendarData;
  };

  const transformSampleSchedulerResponse = (raw) => {
    const reqs = Array.isArray(raw?.requirements) ? raw.requirements : [];
    const grouped = {};
    reqs.forEach(r => {
      const remappedDate = remapToCurrentMonthDate(r.date);
      if (!remappedDate) return;
      const shift = r.shift;
      const required = Number(r.preferred) || 0;
      if (!grouped[remappedDate]) grouped[remappedDate] = {};
      if (!grouped[remappedDate][shift]) grouped[remappedDate][shift] = { required, people: [] };
      grouped[remappedDate][shift].required = required;
    });

    const calendarData = {};
    Object.keys(grouped).forEach(dateKey => {
      calendarData[dateKey] = [];
      const shiftOrder = ['E', 'D', 'DH', 'L', 'N'];
      shiftOrder.forEach(shiftCode => {
        if (grouped[dateKey][shiftCode]) {
          const config = shiftConfig[shiftCode] || shiftConfig['D'];
          const required = grouped[dateKey][shiftCode].required;
          const allocated = required; // sample view: show same value
          const people = []; // leave empty; later mapping will populate real assignments
          calendarData[dateKey].push({
            id: `${dateKey}-${shiftCode}`,
            name: config.name,
            time: config.time,
            allocated,
            required,
            people,
            description: config.description,
            shiftCode: shiftCode,
            ...config
          });
        }
      });
    });

    return calendarData;
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
      let lastError = null;
      for (const url of candidates) {
        try {
          const resp = await fetch(url, { cache: 'no-store' });
          if (!resp.ok) {
            lastError = `Fetch failed ${resp.status}`;
            continue;
          }
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
            lastError = 'Not JSON content';
          }
        } catch (e) {
          lastError = e.message;
        }
      }

      if (!raw) {
        throw new Error('Failed to load shift data');
      }

      const transformed = Array.isArray(raw)
        ? transformAssignmentsData(raw)
        : transformSampleSchedulerResponse(raw);
      setShiftsData(transformed);

      const now = new Date();
      setSampleStartDate(raw?.start_date || null);
      setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
      setViewMode('sample');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDateKey = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };

  const getWeekDays = (date) => {
    const start = startOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  };

  const navigate = (direction) => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    } else if (calendarView === 'week') {
      const base = new Date(currentDate);
      base.setDate(base.getDate() + direction * 7);
      setCurrentDate(base);
    } else {
      const base = new Date(currentDate);
      base.setDate(base.getDate() + direction);
      setCurrentDate(base);
    }
  };

  

  const getShiftsForDate = (date) => {
    const dateKey = formatDateKey(date);
    return shiftsData[dateKey] || [];
  };

  const handleShiftClick = (shift) => {
    setSelectedShift(shift);
    setShowShiftDetails(true);
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: 3,
            maxWidth: 400
          }}
        >
          <CircularProgress size={48} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Loading shift data...
          </Typography>
        </Card>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            boxShadow: 3,
            maxWidth: 400
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'error.light',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <X size={32} color={theme.palette.error.main} />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
            Error Loading Data
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Make sure 'sampleJson.json' exists in your public folder
          </Typography>
        </Card>
      </Box>
    );
  }

  const ShiftCard = ({ shift, onClick }) => {
    const IconComponent = shift.icon;
    const OverlayIcon = shift.overlayIcon || Sun;

    return (
      <Card
        sx={{
          backgroundColor: shift.bgColor,
          border: `1px solid ${shift.borderColor}`,
          borderRadius: 2,
          p: 1.25,
          mb: 1,
          cursor: 'pointer',
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': { backgroundColor: 'action.hover' },
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => onClick(shift)}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <IconComponent size={16} color={shift.textColor || theme.palette.primary.main} />
            <Typography
              variant="body2"
              fontWeight="semibold"
              sx={{ color: shift.textColor || 'text.primary' }}
            >
              {shift.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Users size={12} color={shift.textColor || theme.palette.text.secondary} />
            <Typography
              variant="caption"
              sx={{ color: shift.textColor || 'text.secondary', opacity: 0.8 }}
            >
              {shift.allocated}/{shift.required}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ position: 'absolute', right: 8, bottom: 6, opacity: 0.15, pointerEvents: 'none' }}>
          <OverlayIcon size={72} color={shift.textColor || theme.palette.primary.main} />
        </Box>
      </Card>
    );
  };

  const ShiftDetails = () => {
    if (!selectedShift) return null;
    
    const IconComponent = selectedShift.icon;
    
    return (
      <Dialog
        open={showShiftDetails}
        onClose={() => setShowShiftDetails(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <Box
          sx={{
            background: selectedShift.gradient,
            p: 3,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.1)',
              zIndex: 1
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 2
                  }}
                >
                  <IconComponent size={32} color="white" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {selectedShift.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Clock size={20} color="rgba(255,255,255,0.9)" />
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      {selectedShift.time}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <IconButton
                onClick={() => setShowShiftDetails(false)}
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                <X size={24} />
              </IconButton>
            </Box>
          </Box>
        </Box>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    p: 2,
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Users size={20} color="#1976d2" />
                    <Typography variant="body2" fontWeight="semibold" color="primary">
                      Allocated
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {selectedShift.allocated}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                    p: 2,
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Users size={20} color="#2e7d32" />
                    <Typography variant="body2" fontWeight="semibold" color="success.main">
                      Required
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {selectedShift.required}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    background: selectedShift.allocated >= selectedShift.required
                      ? 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)'
                      : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                    p: 2,
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Shield size={20} color={selectedShift.allocated >= selectedShift.required ? '#2e7d32' : '#d32f2f'} />
                    <Typography 
                      variant="body2" 
                      fontWeight="semibold" 
                      color={selectedShift.allocated >= selectedShift.required ? 'success.main' : 'error.main'}
                    >
                      Status
                    </Typography>
                  </Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    color={selectedShift.allocated >= selectedShift.required ? 'success.main' : 'error.main'}
                  >
                    {selectedShift.allocated >= selectedShift.required ? 'Ready' : 'Short'}
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <Card sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <FileText size={20} color={theme.palette.text.secondary} style={{ marginTop: 2 }} />
              <Box>
                <Typography variant="body2" fontWeight="semibold" color="text.secondary" gutterBottom>
                  Description:
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {selectedShift.description}
                </Typography>
              </Box>
            </Box>
          </Card>
          
          <Box>
            <Typography variant="h6" fontWeight="semibold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <User size={20} />
              Assigned Personnel ({selectedShift.people.length})
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {selectedShift.people.map((person) => (
                <Grid item xs={12} sm={6} key={person.id}>
                  <Card
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      '&:hover': {
                        boxShadow: 2
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          background: 'linear-gradient(135deg, #9e9e9e 0%, #616161 100%)',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {person.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {person.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {selectedShift.allocated < selectedShift.required && (
              <Alert 
                severity="warning" 
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    animation: 'pulse 2s infinite'
                  }
                }}
              >
                <Typography variant="body2">
                  <strong>Alert:</strong> This shift needs {selectedShift.required - selectedShift.allocated} more person(s) to meet requirements.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const weekDays = getWeekDays(currentDate);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        p: 3
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Card
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            boxShadow: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          {/* Left: Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                background: 'linear-gradient(135deg, #2196f3 0%, #9c27b0 100%)',
                borderRadius: 2,
                color: 'white'
              }}
            >
              <Calendar size={32} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                Shift Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your team schedules efficiently
              </Typography>
            </Box>
          </Box>

          {/* Middle: Options */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant={viewMode === 'sample' ? 'contained' : 'outlined'}
              color="primary"
              size="small"
              onClick={handleLoadSample}
            >
              Sample Display
            </Button>
            <Divider flexItem orientation="vertical" sx={{ mx: 1 }} />
            <Button
              variant={calendarView === 'month' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setCalendarView('month')}
            >
              Month
            </Button>
            <Button
              variant={calendarView === 'week' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setCalendarView('week')}
            >
              Week
            </Button>
            <Button
              variant={calendarView === 'day' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setCalendarView('day')}
            >
              Day
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled
            >
              Get Schedule
            </Button>
          </Box>

          {/* Right: Month navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{
                p: 1.5,
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <ChevronLeft size={24} color={theme.palette.text.secondary} />
            </IconButton>
            <Box sx={{ textAlign: 'center', minWidth: 240 }}>
              {calendarView === 'month' && (
                <>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {monthNames[currentDate.getMonth()]}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {currentDate.getFullYear()}
                  </Typography>
                </>
              )}
              {calendarView === 'week' && (
                <>
                  <Typography variant="h6" fontWeight="bold" color="text.primary">
                    {new Date(startOfWeek(currentDate)).toLocaleDateString()}
                    {' — '}
                    {new Date(startOfWeek(currentDate)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) === new Date(weekDays[6]).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      ? new Date(weekDays[6]).toLocaleDateString()
                      : new Date(weekDays[6]).toLocaleDateString()}
                  </Typography>
                </>
              )}
              {calendarView === 'day' && (
                <>
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {currentDate.toLocaleDateString(undefined, { weekday: 'long' })}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {currentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </>
              )}
            </Box>
            <IconButton 
              onClick={() => navigate(1)}
              sx={{
                p: 1.5,
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <ChevronRight size={24} color={theme.palette.text.secondary} />
            </IconButton>
          </Box>
        </Box>

        </Card>

        {/* Calendar View */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 3,
            overflow: 'hidden'
          }}
        >
          <Box>
            {calendarView !== 'day' && (
              <Grid container sx={{ position: 'sticky', top: 0, zIndex: 5 }}>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <Grid item sx={{ flexBasis: `${100/7}%`, maxWidth: `${100/7}%` }} key={day}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: 'text.primary',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {day}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ display: { xs: 'block', sm: 'none' } }}>
                        {day.slice(0, 3)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {calendarView === 'month' && (
              <Grid container>
                {days.map((date, index) => {
                  const dayShifts = date ? getShiftsForDate(date) : [];
                  const isToday = date && date.toDateString() === today.toDateString();
                  return (
                    <Grid item sx={{ flexBasis: `${100/7}%`, maxWidth: `${100/7}%` }} key={index}>
                      <Paper
                        sx={{
                          minHeight: 180,
                          p: 1.5,
                          borderRight: '1px solid',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          position: 'relative',
                          transition: 'background-color 0.2s ease-in-out',
                          backgroundColor: !date ? 'grey.50' : 'background.paper',
                          '&:hover': { backgroundColor: !date ? 'grey.100' : 'action.hover' },
                          '&:last-child': { borderRight: 'none' },
                          ...(isToday && { border: '2px solid', borderColor: 'success.main' })
                        }}
                      >
                        {date && (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" fontWeight="bold" sx={{ color: isToday ? 'success.main' : 'text.primary' }}>
                                {date.getDate()}
                              </Typography>
                              {isToday && (
                                <Chip label="Today" size="small" color="success" sx={{ fontSize: '0.75rem', height: 20 }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {dayShifts.map((shift) => (
                                <ShiftCard key={shift.id} shift={shift} onClick={handleShiftClick} />
                              ))}
                            </Box>
                          </>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {calendarView === 'week' && (
              <Grid container>
                {weekDays.map((date, index) => {
                  const dayShifts = getShiftsForDate(date);
                  const isToday = date.toDateString() === today.toDateString();
                  return (
                    <Grid item sx={{ flexBasis: `${100/7}%`, maxWidth: `${100/7}%` }} key={index}>
                      <Paper
                        sx={{
                          minHeight: 240,
                          p: 1.5,
                          borderRight: '1px solid',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          position: 'relative',
                          transition: 'background-color 0.2s ease-in-out',
                          backgroundColor: 'background.paper',
                          '&:hover': { backgroundColor: 'action.hover' },
                          '&:last-child': { borderRight: 'none' },
                          ...(isToday && { border: '2px solid', borderColor: 'success.main' })
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: isToday ? 'success.main' : 'text.primary' }}>
                            {date.getDate()}
                          </Typography>
                          {isToday && (
                            <Chip label="Today" size="small" color="success" sx={{ fontSize: '0.75rem', height: 20 }} />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {dayShifts.map((shift) => (
                            <ShiftCard key={shift.id} shift={shift} onClick={handleShiftClick} />
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {calendarView === 'day' && (
              <Box sx={{ p: 2 }}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                      {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                    <Chip label="Today" size="small" color="success" sx={{ ml: 1, display: currentDate.toDateString() === today.toDateString() ? 'inline-flex' : 'none' }} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {getShiftsForDate(currentDate).map((shift) => (
                      <ShiftCard key={shift.id} shift={shift} onClick={handleShiftClick} />
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        </Card>

      </Container>

      {/* Shift Details Modal */}
      {showShiftDetails && selectedShift && <ShiftDetails />}
    </Box>
  );
};

export default ShiftCalendar;
