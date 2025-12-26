import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Upload as UploadIcon,
  TableChart as TableChartIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Map as MapIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { DATABASE_SCHEMA, validateHeaders, getTableNames } from '../config/databaseSchema';

const ExcelUploader = ({ initialTable = '', onImported }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [excelData, setExcelData] = useState(null);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(initialTable || '');
  const [validationResults, setValidationResults] = useState({});
  const [columnMappings, setColumnMappings] = useState({});
  const [openMappingDialog, setOpenMappingDialog] = useState(false);
  const [mappingColumn, setMappingColumn] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateTable, setTemplateTable] = useState('');

  // keep selected table synced with prop
  React.useEffect(() => {
    if (initialTable && !selectedTable) {
      setSelectedTable(initialTable);
    }
  }, [initialTable]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setValidationResults({});
    setColumnMappings({});
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          return {
            name: sheetName,
            data: jsonData
          };
        });

        setExcelData(sheets);
        setCurrentSheet(0);
        setCurrentStep(2);
        
        // Auto-detect table type based on sheet name
        const tableNames = getTableNames();
        const detectedTable = tableNames.find(tableName => 
          sheets[0].name.toLowerCase().includes(tableName.toLowerCase())
        );
        if (detectedTable) {
          setSelectedTable(detectedTable);
          validateSheetData(sheets[0].data, detectedTable);
          setCurrentStep(sheets.length > 1 ? 3 : 4);
        }
      } catch (err) {
        setError('Error reading Excel file. Please make sure it\'s a valid Excel file.');
        console.error('Error reading Excel file:', err);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const validateSheetData = (data, tableName) => {
    const headers = getTableHeaders(data);
    const validation = validateHeaders(headers, tableName);
    setValidationResults(validation);
    
    // Initialize column mappings for unmatched columns
    const mappings = {};
    if (validation.extra && validation.extra.length > 0) {
      validation.extra.forEach(column => {
        mappings[column] = null; // null means not mapped yet
      });
    }
    setColumnMappings(mappings);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentSheet(newValue);
    setValidationResults({});
    setColumnMappings({});
    setPreviewData([]);
    if (selectedTable && excelData && excelData[newValue]) {
      validateSheetData(excelData[newValue].data, selectedTable);
      setCurrentStep(4);
    }
  };

  const normalize = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val.trim().toLowerCase();
    if (val instanceof Date) return String(val.toISOString());
    return String(val).trim().toLowerCase();
  };

  const getNaturalKey = (tableName, record, source = 'new') => {
    try {
      switch (tableName) {
        case 'Skills': {
          const name = source === 'new' ? record?.skillName : record?.SkillName;
          return name ? `skill:${normalize(name)}` : null;
        }
        case 'Shifts': {
          const name = source === 'new' ? record?.shiftName : record?.ShiftName;
          const code = source === 'new' ? record?.shiftCode : record?.ShiftCode;
          if (!name && !code) return null;
          return `shift:${normalize(name)}|${normalize(code)}`;
        }
        case 'Staff': {
          const name = source === 'new' ? record?.name : record?.Name;
          const contract = source === 'new' ? record?.contractId : record?.ContractID;
          if (!name) return null;
          return `staff:${normalize(name)}|${normalize(contract ?? '')}`;
        }
        case 'ContractsDetails': {
          const desc = record?.Description;
          return desc ? `contract:${normalize(desc)}` : null;
        }
        case 'RequestType': {
          const name = record?.RequestTypeName;
          return name ? `requesttype:${normalize(name)}` : null;
        }
        case 'DayOffRequests': {
          const emp = source === 'new' ? record?.employeeId : record?.EmployeeID;
          const date = source === 'new' ? record?.requestDate : record?.RequestDate;
          const type = source === 'new' ? record?.requestTypeId : record?.RequestTypeID;
          if (emp === undefined || date === undefined || type === undefined) return null;
          return `dayoff:${normalize(emp)}|${normalize(date)}|${normalize(type)}`;
        }
        case 'ShiftOffRequests': {
          const emp = source === 'new' ? record?.employeeId : record?.EmployeeID;
          const date = source === 'new' ? record?.requestDate : record?.RequestDate;
          const type = source === 'new' ? record?.requestTypeId : record?.RequestTypeID;
          const shift = source === 'new' ? record?.shift : record?.Shift;
          if (emp === undefined || date === undefined || type === undefined || shift === undefined) return null;
          return `shiftoff:${normalize(emp)}|${normalize(date)}|${normalize(type)}|${normalize(shift)}`;
        }
        default:
          return null;
      }
    } catch (_) {
      return null;
    }
  };

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    if (excelData && excelData[currentSheet]) {
      validateSheetData(excelData[currentSheet].data, tableName);
      setCurrentStep(excelData.length > 1 ? 3 : 4);
    }
  };

  const getTableHeaders = (data) => {
    if (!data || data.length === 0) return [];
    return data[0] || [];
  };

  const getTableRows = (data) => {
    if (!data || data.length <= 1) return [];
    return data.slice(1);
  };

  const getCellColor = (header) => {
    if (!selectedTable || !validationResults.valid) return 'inherit';
    
    if (validationResults.valid.includes(header)) {
      return '#4caf50'; // Green for valid columns
    } else if (validationResults.extra.includes(header)) {
      return columnMappings[header] ? '#ff9800' : '#f44336'; // Orange if mapped, red if not
    } else {
      return '#f44336'; // Red for missing columns
    }
  };

  const getHeaderBackgroundColor = (header) => {
    if (!selectedTable || !validationResults.valid) return 'inherit';
    
    if (validationResults.valid.includes(header)) {
      return '#e8f5e8'; // Light green background
    } else if (validationResults.extra.includes(header)) {
      return columnMappings[header] ? '#fff3e0' : '#ffebee'; // Light orange if mapped, light red if not
    }
    return 'inherit';
  };

  const handleColumnMapping = (columnName) => {
    setMappingColumn(columnName);
    setOpenMappingDialog(true);
  };

  const confirmColumnMapping = (mappedTo) => {
    setColumnMappings(prev => ({
      ...prev,
      [mappingColumn]: mappedTo
    }));
    setOpenMappingDialog(false);
    setMappingColumn(null);
  };

  const getValidationSummary = () => {
    if (!selectedTable || !validationResults.valid) return null;

    const { valid, extra } = validationResults;
    const tableCols = DATABASE_SCHEMA[selectedTable]?.columns || [];
    const requiredCols = tableCols.filter(col => col.required).map(col => col.name);
    // Count required columns present, considering mapped targets
    const mappedTargets = Object.values(columnMappings).filter(Boolean);
    const presentWithMappings = new Set([...(valid || []), ...mappedTargets]);
    const missingRequired = requiredCols.filter(col => !presentWithMappings.has(col));
    const totalExpected = requiredCols.length; // focus on required only
    const totalFound = requiredCols.filter(col => presentWithMappings.has(col)).length;
    const totalExtra = (extra || []).length;
    const mappedColumns = mappedTargets.length;

    return {
      totalExpected,
      totalFound,
      totalExtra,
      totalMissing: missingRequired.length,
      missingRequired,
      mappedColumns,
      // Enable import when no required columns are missing; mapping extras is optional
      isValid: missingRequired.length === 0
    };
  };

  const generatePreviewData = () => {
    if (!excelData || !excelData[currentSheet]) return;

    const headers = getTableHeaders(excelData[currentSheet].data);
    const rows = getTableRows(excelData[currentSheet].data);
    
    // Apply column mappings
    const mappedData = rows.slice(0, 5).map(row => {
      const mappedRow = {};
      headers.forEach((header, index) => {
        if (validationResults.valid.includes(header)) {
          mappedRow[header] = row[index] || null;
        } else if (validationResults.extra.includes(header) && columnMappings[header]) {
          mappedRow[columnMappings[header]] = row[index] || null;
        }
      });
      return mappedRow;
    });

    setPreviewData(mappedData);
    setShowPreview(true);
  };

  const getTemplateAoA = (tableName) => {
    const cols = DATABASE_SCHEMA[tableName]?.columns || [];
    const headers = cols.map(c => c.name);
    const sample = cols.map(c => (c.example !== undefined ? c.example : ''));
    return [headers, sample];
  };

  const downloadTemplate = (tableName) => {
    if (!tableName) return;
    const wb = XLSX.utils.book_new();
    const aoa = getTemplateAoA(tableName);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, tableName);
    XLSX.writeFile(wb, `${tableName}_template.xlsx`);
  };

  const downloadAllTemplates = () => {
    const wb = XLSX.utils.book_new();
    getTableNames().forEach((t) => {
      const aoa = getTemplateAoA(t);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, t);
    });
    XLSX.writeFile(wb, `AgenticSchedule_Templates.xlsx`);
  };

  // Transform mapped object keys to backend API payload shape per table
  const transformToBackendPayload = (tableName, obj) => {
    if (!obj) return obj;
    const out = {};
    switch (tableName) {
      case 'Staff': {
        if (obj.Name !== undefined) out.name = obj.Name;
        if (obj.ContractID !== undefined) out.contractId = obj.ContractID;
        // map SkillID to skills array if provided
        if (obj.SkillID !== undefined && obj.SkillID !== null && obj.SkillID !== '') {
          out.skills = Array.isArray(obj.SkillID) ? obj.SkillID : [obj.SkillID];
        }
        // map Skills (names) to skills array if provided
        if (obj.Skills !== undefined && obj.Skills !== null && obj.Skills !== '') {
          const val = obj.Skills;
          if (Array.isArray(val)) {
            out.skills = val;
          } else if (typeof val === 'string') {
            const s = val.trim();
            try {
              const candidate = s.startsWith('[') ? s.replace(/'/g, '"') : `[${s}]`.replace(/'/g, '"');
              const arr = JSON.parse(candidate);
              out.skills = Array.isArray(arr) ? arr : [arr];
            } catch (_) {
              out.skills = s.split(',').map((x) => x.trim()).filter(Boolean);
            }
          } else {
            out.skills = [val];
          }
        }
        // optional shifts column mapping if present in Excel
        if (obj.Shifts !== undefined) {
          out.shifts = Array.isArray(obj.Shifts) ? obj.Shifts : [obj.Shifts];
        }
        return out;
      }
      case 'Skills': {
        if (obj.SkillName !== undefined) out.skillName = obj.SkillName;
        return out;
      }
      case 'Shifts': {
        if (obj.ShiftName !== undefined) out.shiftName = obj.ShiftName;
        if (obj.ShiftCode !== undefined) out.shiftCode = obj.ShiftCode;
        if (obj.StartTime !== undefined) out.startTime = obj.StartTime;
        if (obj.EndTime !== undefined) out.endTime = obj.EndTime;
        return out;
      }
      case 'DayOffRequests': {
        if (obj.EmployeeID !== undefined) out.employeeId = obj.EmployeeID;
        if (obj.RequestDate !== undefined) out.requestDate = obj.RequestDate;
        if (obj.RequestTypeID !== undefined) out.requestTypeId = obj.RequestTypeID;
        return out;
      }
      case 'ShiftOffRequests': {
        if (obj.EmployeeID !== undefined) out.employeeId = obj.EmployeeID;
        if (obj.RequestDate !== undefined) out.requestDate = obj.RequestDate;
        if (obj.RequestTypeID !== undefined) out.requestTypeId = obj.RequestTypeID;
        if (obj.Shift !== undefined) out.shift = obj.Shift;
        return out;
      }
      case 'ShiftRequirements': {
        if (obj.DayOfWeek !== undefined) out.dayOfWeek = obj.DayOfWeek;
        if (obj.Shift !== undefined) out.shift = obj.Shift;
        if (obj.SkillID !== undefined) out.skillId = obj.SkillID;
        if (obj.Preferred !== undefined) out.preferred = obj.Preferred;
        return out;
      }
      case 'RequestType': {
        // backend uses DB keys
        return obj;
      }
      case 'ContractsDetails': {
        // backend uses DB keys
        return obj;
      }
      default:
        return obj;
    }
  };

  const handlePushToDatabase = async () => {
    try {
      const apiService = (await import('../services/api')).default;
      
      const isConnected = await apiService.testConnection();
      if (!isConnected) {
        alert('Cannot connect to server. Please make sure the server is running on http://localhost:3001');
        return;
      }
      
      const dataRows = getTableRows(excelData[currentSheet].data);
      const headers = getTableHeaders(excelData[currentSheet].data);
      
      // Convert to objects with proper column names and mappings
      const importData = dataRows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          if (header) {
            let value = row[index] || null;
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            if (value === '') value = null;

            if (validationResults.valid?.includes(header)) {
              obj[header] = value;
            } else if (validationResults.extra?.includes(header) && columnMappings[header]) {
              obj[columnMappings[header]] = value;
            }
          }
        });
        // transform to backend payload shape
        return transformToBackendPayload(selectedTable, obj);
      });

      setLoading(true);
      
      // Fetch existing records to prevent duplicates
      const existing = await apiService.getTableData(selectedTable);
      const existingKeys = new Set();
      (existing || []).forEach((rec) => {
        const key = getNaturalKey(selectedTable, rec, 'existing');
        if (key) existingKeys.add(key);
      });

      const seenNew = new Set();
      const deduped = importData.filter((rec) => {
        const key = getNaturalKey(selectedTable, rec, 'new');
        if (!key) return true; // if no key, allow (cannot assess duplicate)
        if (seenNew.has(key) || existingKeys.has(key)) return false;
        seenNew.add(key);
        return true;
      });

      const skippedCount = importData.length - deduped.length;

      if (deduped.length === 0) {
        setLoading(false);
        alert('No records imported: all rows are duplicates of existing data or repeated in the file.');
        return;
      }

      const result = await apiService.importData(selectedTable, deduped);
      
      setLoading(false);
      alert(`Prepared ${importData.length} records. Skipped ${skippedCount} duplicates. Imported ${deduped.length} new records to ${selectedTable}.`);
      if (typeof onImported === 'function') {
        onImported(selectedTable, deduped.length, result);
      }
      
      // Clear the form after successful import
      setExcelData(null);
      setSelectedTable('');
      setValidationResults({});
      setColumnMappings({});
      setPreviewData([]);
      
    } catch (error) {
      setLoading(false);
      console.error('Error pushing data to database:', error);
      alert(`Error importing data: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Processing Excel file...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1e1e1e' }}>
            Import Data
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
            Upload Excel files and map columns to database schema
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => { setTemplateTable(selectedTable || getTableNames()[0]); setTemplateOpen(true); }}
          >
            View Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            onClick={() => downloadTemplate(selectedTable || getTableNames()[0])}
          >
            Download Template
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={downloadAllTemplates}
          >
            Download All Templates
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={currentStep - 1} alternativeLabel>
            {['Upload Excel Sheet', 'Select Data Model', 'Pick Worksheet', 'Compare & Match', 'Import to Database'].map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {currentStep === 1 && (
      <Card sx={{ 
        mb: 3,
        border: '1px solid #e1e5e9',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="excel-file-input"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="excel-file-input">
              <Button
                variant="contained"
                component="span"
                size="large"
                startIcon={<UploadIcon />}
                sx={{ 
                  px: 4, 
                  py: 2, 
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  backgroundColor: '#007acc',
                  boxShadow: '0 2px 4px rgba(0, 122, 204, 0.3)',
                  '&:hover': {
                    backgroundColor: '#005a9e',
                    boxShadow: '0 4px 8px rgba(0, 122, 204, 0.4)',
                  }
                }}
              >
                Choose Excel File
              </Button>
            </label>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 3, fontWeight: 500 }}>
              Supported formats: .xlsx, .xls
            </Typography>
          </Box>
        </CardContent>
      </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {excelData && currentStep >= 2 && (
      <Card sx={{ 
        mb: 3,
        border: '1px solid #e1e5e9',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1e1e1e', mb: 3 }}>
            Select Target Database Table
          </Typography>
          <FormControl fullWidth>
            <InputLabel sx={{ fontWeight: 500 }}>Database Table</InputLabel>
            <Select
              value={selectedTable}
              label="Database Table"
              onChange={(e) => handleTableSelect(e.target.value)}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e1e5e9',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007acc',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#007acc',
                }
              }}
            >
              {getTableNames().map((tableName) => (
                <MenuItem key={tableName} value={tableName} sx={{ fontWeight: 500 }}>
                  {tableName} - {DATABASE_SCHEMA[tableName].description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>
      )}

      {/* Examples for selected table */}
      {selectedTable && currentStep >= 2 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Expected Columns and Examples
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Required</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Example</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DATABASE_SCHEMA[selectedTable]?.columns.map((col, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{col.name}</TableCell>
                      <TableCell>{col.type}</TableCell>
                      <TableCell>{col.required ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{col.example !== undefined ? String(col.example) : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Alert severity="info" sx={{ mt: 2 }}>
              Use these column names as headers in your Excel file. Extra columns can be mapped.
            </Alert>
          </CardContent>
        </Card>
      )}

      {excelData && excelData.length > 0 && (
        <Box>
          {excelData.length > 1 && currentStep >= 3 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Excel Sheets
                </Typography>
                <Tabs value={currentSheet} onChange={handleTabChange} variant="scrollable">
                  {excelData.map((sheet, index) => (
                    <Tab key={index} label={sheet.name} />
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {currentStep >= 4 && selectedTable && getValidationSummary() && (
            <Card sx={{ 
              mb: 3,
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
                    Validation Summary for {selectedTable}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={generatePreviewData}
                      disabled={!getValidationSummary().isValid}
                      sx={{
                        borderColor: '#e1e5e9',
                        color: '#1e1e1e',
                        fontWeight: 500,
                        borderRadius: 2,
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
                      Preview Data
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => setCurrentStep(5)}
                      disabled={!getValidationSummary().isValid}
                      sx={{
                        backgroundColor: '#16a34a',
                        fontWeight: 600,
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
                        '&:hover': {
                          backgroundColor: '#15803d',
                          boxShadow: '0 4px 8px rgba(22, 163, 74, 0.4)',
                        },
                        '&:disabled': {
                          backgroundColor: '#6c757d',
                          color: '#ffffff',
                        }
                      }}
                    >
                      Proceed to Import
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 3, 
                      backgroundColor: '#e3f2fd',
                      borderRadius: 2,
                      border: '2px solid #bbdefb',
                      boxShadow: '0 2px 8px rgba(0, 122, 204, 0.3)'
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#007acc', mb: 1 }}>
                        {getValidationSummary().totalExpected}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#005a9e' }}>
                        Expected Columns
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 3, 
                      backgroundColor: '#dcfce7',
                      borderRadius: 2,
                      border: '2px solid #bbf7d0',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#16a34a', mb: 1 }}>
                        {getValidationSummary().totalFound}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#15803d' }}>
                        Valid Columns
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 3, 
                      backgroundColor: '#fef3c7',
                      borderRadius: 2,
                      border: '2px solid #fde68a',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706', mb: 1 }}>
                        {getValidationSummary().mappedColumns}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#b45309' }}>
                        Mapped Columns
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 3, 
                      backgroundColor: '#fef2f2',
                      borderRadius: 2,
                      border: '2px solid #fecaca',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)'
                    }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#dc2626', mb: 1 }}>
                        {getValidationSummary().totalMissing}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#b91c1c' }}>
                        Missing Columns
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Column Details */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Column Details
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Valid Columns */}
                      {validationResults.valid && validationResults.valid.length > 0 && (
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="success.main" gutterBottom>
                            Valid Columns ({validationResults.valid.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {validationResults.valid.map((column, index) => (
                              <Chip
                                key={index}
                                label={column}
                                color="success"
                                variant="outlined"
                                size="small"
                                icon={<CheckCircleIcon />}
                              />
                            ))}
                          </Box>
                        </Grid>
                      )}

                      {/* Extra Columns with Mapping */}
                      {validationResults.extra && validationResults.extra.length > 0 && (
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="warning.main" gutterBottom>
                            Extra Columns ({validationResults.extra.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {validationResults.extra.map((column, index) => (
                              <Chip
                                key={index}
                                label={columnMappings[column] ? `${column} → ${columnMappings[column]}` : column}
                                color={columnMappings[column] ? "warning" : "error"}
                                variant="outlined"
                                size="small"
                                icon={columnMappings[column] ? <CheckCircleIcon /> : <ErrorIcon />}
                                onClick={() => handleColumnMapping(column)}
                                sx={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Box>
                        </Grid>
                      )}

                      {/* Missing Required Columns Only */}
                      {getValidationSummary().missingRequired && getValidationSummary().missingRequired.length > 0 && (
                        <Grid item xs={12} md={4}>
                          <Typography variant="subtitle2" color="error.main" gutterBottom>
                            Missing Required Columns ({getValidationSummary().missingRequired.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {getValidationSummary().missingRequired.map((column, index) => {
                              const columnInfo = DATABASE_SCHEMA[selectedTable].columns.find(col => col.name === column);
                              return (
                                <Chip
                                  key={index}
                                  label={`${column}${columnInfo?.required ? ' (Required)' : ''}`}
                                  color="error"
                                  variant="outlined"
                                  size="small"
                                  icon={<ErrorIcon />}
                                />
                              );
                            })}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Status Alert */}
                {getValidationSummary().isValid ? (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    All required columns are present and extra columns are mapped! Data is ready for import.
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Please map all extra columns or add missing required columns to your Excel file.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && selectedTable && getValidationSummary() && (
            <Card sx={{ 
              mb: 3,
              border: '1px solid #e1e5e9',
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e1e1e' }}>
                    Import to Database
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setCurrentStep(4)}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={handlePushToDatabase}
                      disabled={!getValidationSummary().isValid}
                      sx={{
                        backgroundColor: '#16a34a',
                        fontWeight: 600,
                        borderRadius: 2
                      }}
                    >
                      Import to Database
                    </Button>
                  </Box>
                </Box>
                <Alert severity={getValidationSummary().isValid ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  {getValidationSummary().isValid ? 'Data is ready. Proceed to import.' : 'Fix validation issues before importing.'}
                </Alert>
              </CardContent>
            </Card>
          )}

          {currentStep >= 4 && showPreview && previewData.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Data Preview (First 5 rows)
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {Object.keys(previewData[0] || {}).map((header, index) => (
                          <TableCell key={index} sx={{ fontWeight: 'bold' }}>
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {Object.values(row).map((value, colIndex) => (
                            <TableCell key={colIndex}>
                              {value !== null && value !== undefined ? String(value) : ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {currentStep >= 4 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Excel Data Preview
              </Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {getTableHeaders(excelData[currentSheet].data).map((header, index) => (
                        <TableCell 
                          key={index} 
                          sx={{ 
                            fontWeight: 'bold',
                            color: getCellColor(header),
                            backgroundColor: getHeaderBackgroundColor(header),
                            cursor: validationResults.extra?.includes(header) ? 'pointer' : 'default',
                            '&:hover': validationResults.extra?.includes(header) ? {
                              backgroundColor: '#fff3e0',
                              opacity: 0.8
                            } : {}
                          }}
                          onClick={() => validationResults.extra?.includes(header) && handleColumnMapping(header)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {header || `Column ${index + 1}`}
                            {validationResults.extra?.includes(header) && (
                              <Tooltip title="Click to map this column">
                                <MapIcon fontSize="small" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getTableRows(excelData[currentSheet].data).slice(0, 10).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {getTableHeaders(excelData[currentSheet].data).map((header, colIndex) => (
                          <TableCell key={colIndex}>
                            {row[colIndex] || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Showing first 10 rows of {getTableRows(excelData[currentSheet].data).length} total rows
              </Typography>
            </CardContent>
          </Card>
          )}
        </Box>
      )}

      <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Excel Template</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Table</InputLabel>
                <Select
                  value={templateTable}
                  label="Table"
                  onChange={(e) => setTemplateTable(e.target.value)}
                >
                  {getTableNames().map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" startIcon={<CloudDownloadIcon />} onClick={() => downloadTemplate(templateTable || getTableNames()[0])}>
                  Download This Template
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Columns</Typography>
          <TableContainer sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Column</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Required</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(DATABASE_SCHEMA[templateTable || getTableNames()[0]]?.columns || []).map((col, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{col.name}</TableCell>
                    <TableCell>{col.type}</TableCell>
                    <TableCell>{col.required ? 'Yes' : 'No'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Template Preview</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {(DATABASE_SCHEMA[templateTable || getTableNames()[0]]?.columns || []).map((col, idx) => (
                    <TableCell key={idx} sx={{ fontWeight: 'bold' }}>{col.name}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {(DATABASE_SCHEMA[templateTable || getTableNames()[0]]?.columns || []).map((col, idx) => (
                    <TableCell key={idx}>{col.example !== undefined ? String(col.example) : ''}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Column Mapping Dialog */}
      <Dialog open={openMappingDialog} onClose={() => setOpenMappingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Map Column: {mappingColumn}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select which database column this Excel column should map to:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Map to Database Column</InputLabel>
            <Select
              value={columnMappings[mappingColumn] || ''}
              label="Map to Database Column"
              onChange={(e) => confirmColumnMapping(e.target.value)}
            >
              <MenuItem value={null}>Don't import this column</MenuItem>
              {DATABASE_SCHEMA[selectedTable]?.columns.map((column) => (
                <MenuItem key={column.name} value={column.name}>
                  {column.name} ({column.type}){column.required ? ' - Required' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMappingDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => confirmColumnMapping(null)} 
            variant="outlined"
          >
            Don't Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExcelUploader;
