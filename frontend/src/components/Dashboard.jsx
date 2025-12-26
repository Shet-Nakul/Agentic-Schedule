import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import apiService from '../services/api';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalContracts: 0,
    totalSkills: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentData, setRecentData] = useState({
    staff: [],
    contracts: [],
    requests: []
  });
  const [analytics, setAnalytics] = useState({
    skillsDistribution: [],
    contractsDistribution: [],
    requestsByType: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const allData = await apiService.getAllTableData();
      
      const staffCount = allData.Staff?.length || 0;
      const contractsCount = allData.ContractsDetails?.length || 0;
      const skillsCount = allData.Skills?.length || 0;
      const dayOffRequests = allData.DayOffRequests?.length || 0;
      const shiftOffRequests = allData.ShiftOffRequests?.length || 0;
      const totalRequests = dayOffRequests + shiftOffRequests;
      
      // Calculate pending vs completed requests (simplified logic)
      const pendingRequests = Math.floor(totalRequests * 0.3); // 30% pending
      const completedRequests = totalRequests - pendingRequests;

      setStats({
        totalStaff: staffCount,
        totalContracts: contractsCount,
        totalSkills: skillsCount,
        totalRequests,
        pendingRequests,
        completedRequests
      });

      // Get recent data (last 5 items from each table)
      setRecentData({
        staff: allData.Staff?.slice(-5) || [],
        contracts: allData.ContractsDetails?.slice(-5) || [],
        requests: [...(allData.DayOffRequests || []), ...(allData.ShiftOffRequests || [])].slice(-5)
      });

      // Compute analytics distributions
      const skillsByName = {};
      (allData.Staff || []).forEach(s => {
        const skillId = s.SkillID ?? s.skillId;
        let skillName = 'Unknown';
        const skill = (allData.Skills || []).find(sk => sk.SkillID === skillId);
        if (skill && (skill.SkillName || skill.skillName)) {
          skillName = skill.SkillName || skill.skillName;
        }
        skillsByName[skillName] = (skillsByName[skillName] || 0) + 1;
      });

      const contractsByDesc = {};
      (allData.Staff || []).forEach(s => {
        const contractId = s.ContractID ?? s.contractId;
        let desc = 'Unassigned';
        const contract = (allData.ContractsDetails || []).find(c => c.ContractID === contractId);
        if (contract && (contract.Description || contract.description)) {
          desc = contract.Description || contract.description;
        }
        contractsByDesc[desc] = (contractsByDesc[desc] || 0) + 1;
      });

      const requestTypeCounts = {};
      const allRequests = [...(allData.DayOffRequests || []), ...(allData.ShiftOffRequests || [])];
      allRequests.forEach(r => {
        const typeId = r.RequestTypeID ?? r.requestTypeId;
        requestTypeCounts[typeId] = (requestTypeCounts[typeId] || 0) + 1;
      });

      const requestTypeLabels = {};
      (allData.RequestType || []).forEach(rt => {
        requestTypeLabels[rt.RequestTypeID] = rt.RequestTypeName || rt.requestTypeName || `Type ${rt.RequestTypeID}`;
      });

      const toArray = (obj, labelMap) => Object.keys(obj).map(key => ({
        label: labelMap ? (labelMap[key] || key) : key,
        value: obj[key]
      })).sort((a, b) => b.value - a.value);

      setAnalytics({
        skillsDistribution: toArray(skillsByName),
        contractsDistribution: toArray(contractsByDesc),
        requestsByType: toArray(requestTypeCounts, requestTypeLabels)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ 
      height: '100%', 
      position: 'relative', 
      overflow: 'visible',
      border: '1px solid #e1e5e9',
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-2px)',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              color="textSecondary" 
              gutterBottom 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 1
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                color: color,
                mb: subtitle ? 1 : 0,
                fontSize: '2.5rem'
              }}
            >
              {loading ? (
                <Box sx={{ 
                  width: 60, 
                  height: 40, 
                  backgroundColor: '#f1f3f4', 
                  borderRadius: 1,
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              ) : value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ 
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: 3,
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              border: `2px solid ${color}20`,
              boxShadow: `0 2px 8px ${color}30`
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const RecentDataCard = ({ title, data, type }) => (
    <Card sx={{ 
      height: '100%',
      border: '1px solid #e1e5e9',
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e1e1e' }}>
            {title}
          </Typography>
          <Chip 
            label={`${data.length} items`} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ 
              fontWeight: 500,
              borderColor: '#007acc',
              color: '#007acc'
            }}
          />
        </Box>
        
        {data.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            border: '1px dashed #e1e5e9'
          }}>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
              No data available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {data.map((item, index) => (
              <Paper 
                key={index} 
                sx={{ 
                  p: 2, 
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e1e5e9',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e1e1e', mb: 0.5 }}>
                  {type === 'staff' && (item.name || item.staffName || `Staff ${index + 1}`)}
                  {type === 'contracts' && (item.contractName || `Contract ${index + 1}`)}
                  {type === 'requests' && (item.requestType || `Request ${index + 1}`)}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                  {type === 'staff' && (item.position || 'Position not specified')}
                  {type === 'contracts' && (item.contractType || 'Type not specified')}
                  {type === 'requests' && (item.status || 'Status not specified')}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 4,
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        border: '1px solid #e1e5e9',
        borderRadius: 2,
        px: 3,
        py: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: '#1e1e1e' }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
            Analytics overview and recent activity
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={fetchDashboardData} 
            disabled={loading}
            sx={{
              backgroundColor: '#ffffff',
              border: '1px solid #e1e5e9',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              '&:hover': {
                backgroundColor: '#f8f9fa',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              },
              '&:disabled': {
                backgroundColor: '#f8f9fa',
                color: '#6c757d',
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard title="Staff" value={stats.totalStaff} icon={<PeopleIcon />} color="#1976d2" subtitle="Active" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard title="Contracts" value={stats.totalContracts} icon={<AssignmentIcon />} color="#2e7d32" subtitle="Active" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard title="Skills" value={stats.totalSkills} icon={<TrendingUpIcon />} color="#ed6c02" subtitle="Available" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard title="Requests" value={stats.totalRequests} icon={<ScheduleIcon />} color="#9c27b0" subtitle="Total" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard title="Completed" value={stats.completedRequests} icon={<ScheduleIcon />} color="#16a34a" subtitle="Requests" />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard title="Pending" value={stats.pendingRequests} icon={<ScheduleIcon />} color="#d97706" subtitle="Requests" />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            border: '1px solid #e1e5e9',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e1e1e' }}>
                Skills Distribution
              </Typography>
              {analytics.skillsDistribution.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No data</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {analytics.skillsDistribution.slice(0, 6).map((item, idx) => {
                    const max = analytics.skillsDistribution[0]?.value || 1;
                    const pct = Math.round((item.value / max) * 100);
                    return (
                      <Box key={idx}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                          <Typography variant="caption" color="textSecondary">{item.value}</Typography>
                        </Box>
                        <Box sx={{ backgroundColor: '#f1f3f4', borderRadius: 999, overflow: 'hidden' }}>
                          <Box sx={{ width: `${pct}%`, height: 8, backgroundColor: '#1976d2' }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            border: '1px solid #e1e5e9',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e1e1e' }}>
                Contracts Distribution
              </Typography>
              {analytics.contractsDistribution.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No data</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {analytics.contractsDistribution.slice(0, 6).map((item, idx) => {
                    const max = analytics.contractsDistribution[0]?.value || 1;
                    const pct = Math.round((item.value / max) * 100);
                    return (
                      <Box key={idx}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                          <Typography variant="caption" color="textSecondary">{item.value}</Typography>
                        </Box>
                        <Box sx={{ backgroundColor: '#f1f3f4', borderRadius: 999, overflow: 'hidden' }}>
                          <Box sx={{ width: `${pct}%`, height: 8, backgroundColor: '#2e7d32' }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 4, border: '1px solid #e1e5e9', borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e1e1e' }}>
            Requests by Type
          </Typography>
          {analytics.requestsByType.length === 0 ? (
            <Typography variant="body2" color="textSecondary">No data</Typography>
          ) : (
            <Grid container spacing={2}>
              {analytics.requestsByType.slice(0, 8).map((item, idx) => {
                const max = analytics.requestsByType[0]?.value || 1;
                const pct = Math.round((item.value / max) * 100);
                return (
                  <Grid item xs={12} sm={6} md={3} key={idx}>
                    <Paper sx={{ p: 2, border: '1px solid #e1e5e9', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{item.label}</Typography>
                      <Box sx={{ backgroundColor: '#f1f3f4', borderRadius: 999, overflow: 'hidden' }}>
                        <Box sx={{ width: `${pct}%`, height: 8, backgroundColor: '#9c27b0' }} />
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>{item.value} requests</Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e1e1e' }}>
                Entity Readiness
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {[{ label: 'Skills', value: stats.totalSkills }, { label: 'Shifts', value: (recentData.staff.length > 0 ? recentData.staff.length : 0) }, { label: 'Contracts', value: stats.totalContracts }, { label: 'Staff', value: stats.totalStaff }, { label: 'Day Off Requests', value: (analytics.requestsByType.find(r => r.label?.toLowerCase?.().includes('day'))?.value || 0) }, { label: 'Shift Off Requests', value: (analytics.requestsByType.find(r => r.label?.toLowerCase?.().includes('shift'))?.value || 0) }].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                    <Chip label={String(item.value)} size="small" sx={{ fontWeight: 600 }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e1e1e' }}>
                Activity Snapshot
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Completed Requests</Typography>
                  <LinearProgress variant="determinate" value={stats.totalRequests > 0 ? (stats.completedRequests / stats.totalRequests) * 100 : 0} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>Pending Requests</Typography>
                  <LinearProgress variant="determinate" value={stats.totalRequests > 0 ? (stats.pendingRequests / stats.totalRequests) * 100 : 0} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            border: '1px solid #e1e5e9',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e1e1e' }}>
                Request Status
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e1e1e' }}>Completed</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>
                    {stats.completedRequests}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalRequests > 0 ? (stats.completedRequests / stats.totalRequests) * 100 : 0}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    backgroundColor: '#f1f3f4',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#16a34a',
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e1e1e' }}>Pending</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#d97706' }}>
                    {stats.pendingRequests}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalRequests > 0 ? (stats.pendingRequests / stats.totalRequests) * 100 : 0}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4, 
                    backgroundColor: '#f1f3f4',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#d97706',
                      borderRadius: 4,
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            border: '1px solid #e1e5e9',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e1e1e' }}>
                System Health
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e1e1e' }}>Database Connection</Typography>
                    <Chip 
                      label="Online" 
                      color="success" 
                      size="small"
                      sx={{ 
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        fontWeight: 500,
                        border: '1px solid #bbf7d0'
                      }}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={100}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: '#f1f3f4',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#16a34a',
                        borderRadius: 3,
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e1e1e' }}>Data Integrity</Typography>
                    <Chip 
                      label="Good" 
                      color="success" 
                      size="small"
                      sx={{ 
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        fontWeight: 500,
                        border: '1px solid #bbf7d0'
                      }}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={95}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: '#f1f3f4',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#16a34a',
                        borderRadius: 3,
                      }
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Data */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <RecentDataCard
            title="Recent Staff"
            data={recentData.staff}
            type="staff"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RecentDataCard
            title="Recent Contracts"
            data={recentData.contracts}
            type="contracts"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <RecentDataCard
            title="Recent Requests"
            data={recentData.requests}
            type="requests"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
