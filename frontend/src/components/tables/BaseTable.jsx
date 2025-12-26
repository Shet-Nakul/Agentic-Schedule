import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import { 
  Delete, 
  Edit, 
  Visibility
} from '@mui/icons-material';

const BaseTable = ({ 
  tableName, 
  data, 
  columns, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const getRowId = (row) => {
    const idKeyMap = {
      ContractsDetails: 'ContractID',
      Staff: 'StaffID',
      Skills: 'SkillID',
      Shifts: 'ShiftID',
      DayOffRequests: 'RequestID',
      ShiftOffRequests: 'RequestID',
      RequestType: 'RequestTypeID',
    };
    const explicitKey = idKeyMap[tableName];
    if (explicitKey && row[explicitKey] !== undefined && row[explicitKey] !== null) {
      return row[explicitKey];
    }
    if (row.ID !== undefined && row.ID !== null) {
      return row.ID;
    }
    const suffixKey = Object.keys(row).find((k) => /ID$/i.test(k));
    if (suffixKey) return row[suffixKey];
    return null;
  };
  const formatValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return '-';
    }
    return value.toString();
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {tableName} ({data.length} records)
        </Typography>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column, index) => (
                  <TableCell key={index}>
                    {column}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 120, textAlign: 'center' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} sx={{ textAlign: 'center', py: 4 }}>
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow key={rowIndex} hover>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {formatValue(row[column])}
                      </TableCell>
                    ))}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const id = getRowId(row);
                            onView(id ?? rowIndex);
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const id = getRowId(row);
                            onEdit(id ?? rowIndex);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            const id = getRowId(row);
                            onDelete(id ?? rowIndex);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default BaseTable;