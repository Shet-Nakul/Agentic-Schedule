import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Refresh, 
  Add as AddIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import apiService from '../services/api';

// Import table components
import ContractsTable from './tables/ContractsTable';
import StaffTable from './tables/StaffTable';
import SkillsTable from './tables/SkillsTable';
import ShiftsTable from './tables/ShiftsTable';
import DayOffRequestsTable from './tables/DayOffRequestsTable';
import RequestTypeTable from './tables/RequestTypeTable';
import ShiftOffRequestsTable from './tables/ShiftOffRequestsTable';
import ShiftRequirementsTable from './tables/ShiftRequirementsTable';
import ExcelUploader from './ExcelUploader';

const DataViewer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentTable, setCurrentTable] = useState('ContractsDetails');
  const [tableData, setTableData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState({});
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const tableNames = ['ContractsDetails', 'Staff', 'Shifts', 'Skills', 'DayOffRequests', 'RequestType', 'ShiftOffRequests', 'ShiftRequirements'];

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const isConnected = await apiService.testConnection();
      if (!isConnected) {
        setError('Cannot connect to server. Please make sure the server is running on http://localhost:3001');
        setLoading(false);
        return;
      }

      const data = await apiService.getAllTableData();
      setTableData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Error fetching data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    try {
      const data = await apiService.getTableData(tableName);
      setTableData(prev => ({ ...prev, [tableName]: data }));
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      setError(`Error fetching ${tableName}: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = {};
      Object.keys(tableData).forEach(tableName => {
        filtered[tableName] = tableData[tableName]?.filter(row => 
          Object.values(row).some(value => 
            value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        ) || [];
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(tableData);
    }
  }, [searchTerm, tableData]);

  const handleTabChange = (event, newValue) => {
    setCurrentTable(newValue);
  };

  const getTableData = (tableName) => {
    return filteredData[tableName] || tableData[tableName] || [];
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleCreateClick = () => {
    // This will be handled by individual table components
    const tableElement = document.getElementById(`${currentTable}-create-button`);
    if (tableElement) {
      tableElement.click();
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        p: 4
      }}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading data...
        </Typography>
      </Box>
    );
  }

  const renderCurrentTable = () => {
    switch (currentTable) {
      case 'ContractsDetails':
        return <ContractsTable data={getTableData('ContractsDetails')} onRefresh={() => fetchTableData('ContractsDetails')} />;
      case 'Staff':
        return <StaffTable 
          data={getTableData('Staff')} 
          contractsData={getTableData('ContractsDetails')} 
          skillsData={getTableData('Skills')} 
          onRefresh={() => fetchTableData('Staff')} 
        />;
      case 'Skills':
        return <SkillsTable data={getTableData('Skills')} onRefresh={() => fetchTableData('Skills')} />;
      case 'Shifts':
        return <ShiftsTable data={getTableData('Shifts')} onRefresh={() => fetchTableData('Shifts')} />;
      case 'DayOffRequests':
        return <DayOffRequestsTable 
          data={getTableData('DayOffRequests')} 
          staffData={getTableData('Staff')} 
          requestTypeData={getTableData('RequestType')} 
          onRefresh={() => fetchTableData('DayOffRequests')} 
        />;
      case 'RequestType':
        return <RequestTypeTable data={getTableData('RequestType')} onRefresh={() => fetchTableData('RequestType')} />;
      case 'ShiftOffRequests':
        return <ShiftOffRequestsTable 
          data={getTableData('ShiftOffRequests')} 
          staffData={getTableData('Staff')} 
          requestTypeData={getTableData('RequestType')} 
          shiftsData={getTableData('Shifts')}
          onRefresh={() => fetchTableData('ShiftOffRequests')} 
        />;
      case 'ShiftRequirements':
        return <ShiftRequirementsTable 
          data={getTableData('ShiftRequirements')} 
          skillsData={getTableData('Skills')}
          onRefresh={() => fetchTableData('ShiftRequirements')} 
        />;
      default:
        return <Typography>Select a table to view data</Typography>;
    }
  };

  return (
    <Box sx={{ 
      p: 3
    }}>
      {/* Simple Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Data Viewer
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            disabled={loading}
          >
            Add Record
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<TableChartIcon />}
            onClick={() => setBulkImportOpen(true)}
            disabled={loading}
          >
            Bulk Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Simple Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search across all tables and records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
        />
      </Box>

      {/* Simple Table Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Select Table
        </Typography>
        <Tabs 
          value={currentTable} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
        >
          {tableNames.map((tableName) => (
            <Tab 
              key={tableName} 
              label={`${tableName} (${getTableData(tableName).length})`}
              value={tableName} 
            />
          ))}
        </Tabs>
      </Box>

      {/* Render the current table component */}
      {renderCurrentTable()}

      {/* Bulk Import Modal */}
      <Dialog 
        open={bulkImportOpen} 
        onClose={() => setBulkImportOpen(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>Bulk Import into {currentTable}</DialogTitle>
        <DialogContent dividers>
          <ExcelUploader 
            initialTable={currentTable}
            onImported={() => {
              setBulkImportOpen(false);
              handleRefresh();
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

export default DataViewer;
