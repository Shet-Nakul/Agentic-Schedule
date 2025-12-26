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
  DialogContent,
  Button,
  Chip,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Divider,
  Stack,
  Avatar
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  FileText,
  User,
  X,
  Calendar,
  Briefcase,
  Shield,
  Coffee,
  Sunrise,
  Sun,
  Moon,
  Sunset,
  Save,
  Trash2
} from 'lucide-react';

const SchedulePreview = ({ assignments, staffData, onAccept, onDiscard }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(null);
  const [showShiftDetails, setShowShiftDetails] = useState(false);
  const [calendarView, setCalendarView] = useState('month');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Shift mappings (reused from ScheduleView)
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

  const transformAssignmentsData = React.useCallback((rawData) => {
    // Create staff map
    const staffMap = {};
    if (staffData && Array.isArray(staffData)) {
      staffData.forEach(s => {
        // Handle both possible field names depending on API response format
        const id = s.StaffID || s.id;
        const name = s.Name || s.name;
        if (id) staffMap[id] = name;
      });
    }

    const grouped = {};
    
    // Group by date and shift
    if (Array.isArray(rawData)) {
      rawData.forEach(item => {
        // Ensure working is boolean true or missing (default true)
        if (item.working === false) return; 
        
        const date = item.date || item.Day || item.day || item.shift_date;
        const employee_id = item.employee_id || item.EmployeeID || item.staffId;
        const shift = item.shift || item.Shift || item.shiftCode;
        
        // Skip if date is missing or shift is null/empty (indicates day off)
        if (!date || !shift) return;
        
        const dateKey = date.split('T')[0];
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = {};
        }
        
        if (!grouped[dateKey][shift]) {
          grouped[dateKey][shift] = [];
        }
        
        grouped[dateKey][shift].push({
          id: `EMP${String(employee_id).padStart(3, '0')}`,
          name: staffMap[employee_id] || `Employee ${employee_id}`,
          employee_id: employee_id
        });
      });
    }

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
          const required = people.length; // In preview, allocated is what we have
          
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
  }, [staffData]);

  const shiftsData = React.useMemo(() => {
    return transformAssignmentsData(assignments);
  }, [assignments, transformAssignmentsData]);

  useEffect(() => {
    if (assignments && assignments.length > 0) {
      // Set current date to the first date in the assignment
      // Note: dates in assignment might be just YYYY-MM-DD
      const dates = assignments
        .map(a => a.date || a.Day || a.day || a.shift_date)
        .filter(d => d)
        .sort();
      
      if (dates.length > 0) {
        const firstDate = new Date(dates[0]);
        // Only update if month is different to avoid constant resets
        const newDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
        setCurrentDate(prev => {
          if (prev.getFullYear() === newDate.getFullYear() && prev.getMonth() === newDate.getMonth()) {
            return prev;
          }
          return newDate;
        });
      }
    }
  }, [assignments]); // Removed staffData dependency to avoid reset on staff load

  const remapToCurrentMonthDate = (dateStr) => {
    if (!dateStr) return null;
    return dateStr;
    // We don't remap for preview, we show the actual dates
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
              {shift.allocated} Staff
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
        maxWidth="md"
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
              Assigned Personnel ({selectedShift.people ? selectedShift.people.length : 0})
            </Typography>
            <Grid container spacing={1}>
              {selectedShift.people && selectedShift.people.map((person, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Chip 
                    avatar={<Avatar>{person.name ? person.name.charAt(0) : '?'}</Avatar>}
                    label={person.name}
                    variant="outlined"
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const weekDays = getWeekDays(currentDate);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', p: 3 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Card sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, #2196f3 0%, #9c27b0 100%)', borderRadius: 2, color: 'white' }}>
                <Calendar size={32} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  Schedule Preview
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Review and accept the generated schedule
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 />}
                onClick={onDiscard}
              >
                Discard
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Save />}
                onClick={onAccept}
              >
                Accept Schedule
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(-1)}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h6">
               {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton onClick={() => navigate(1)}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Card>

        {/* Calendar View */}
        <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'hidden' }}>
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
                          minHeight: 150,
                          p: 1.5,
                          borderRight: '1px solid',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: !date ? 'grey.50' : 'background.paper',
                          ...(isToday && { border: '2px solid', borderColor: 'success.main' })
                        }}
                      >
                        {date && (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" fontWeight="bold">
                                {date.getDate()}
                              </Typography>
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

            {/* Week and Day views omitted for brevity, reusing structure logic */}
            {calendarView === 'week' && (
              <Grid container>
                {weekDays.map((date, index) => {
                  const dayShifts = getShiftsForDate(date);
                  return (
                    <Grid item sx={{ flexBasis: `${100/7}%`, maxWidth: `${100/7}%` }} key={index}>
                      <Paper sx={{ minHeight: 200, p: 1.5, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
                         <Typography variant="h6">{date.getDate()}</Typography>
                         {dayShifts.map(shift => <ShiftCard key={shift.id} shift={shift} onClick={handleShiftClick} />)}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
            
            {calendarView === 'day' && (
               <Box sx={{ p: 2 }}>
                  <Typography variant="h5">{currentDate.toDateString()}</Typography>
                  {getShiftsForDate(currentDate).map(shift => <ShiftCard key={shift.id} shift={shift} onClick={handleShiftClick} />)}
               </Box>
            )}

          </Box>
        </Card>
      </Container>
      {showShiftDetails && selectedShift && <ShiftDetails />}
    </Box>
  );
};

export default SchedulePreview;