import React, { useEffect, useState } from 'react';
import BaseTable from './BaseTable';
import FormModal from './FormModal';
import apiService from '../../services/api';
import { Button } from '@mui/material';
import ConfirmDialog from '../ConfirmDialog';
import FeedbackDialog from '../FeedbackDialog';

const StaffTable = ({ data, contractsData, skillsData, onRefresh }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [shiftOptions, setShiftOptions] = useState([]);
  const sentinel = { value: '__ADD__', label: 'Add New Shift…' };
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [feedback, setFeedback] = useState({ open: false, title: '', message: '' });
  
  const tableName = 'Staff';
  
  const [displayRows, setDisplayRows] = useState([]);
  
  useEffect(() => {
    let cancelled = false;
    const buildDisplayRows = async () => {
      const contractMap = new Map((contractsData || []).map(c => [c.ContractID, c.Description]));
      const staffList = Array.isArray(data) ? data : [];
      const promises = staffList.map(row => apiService.request(`/staff/${row.StaffID}`).catch(() => null));
      const details = await Promise.all(promises);
      const byId = {};
      details.forEach(d => {
        const s = d && d.payload && d.payload.staff ? d.payload.staff : null;
        if (s && s.StaffID != null) byId[s.StaffID] = s;
      });
      const rows = staffList.map(row => {
        const contractName = contractMap.get(row.ContractID) ?? row.ContractID ?? null;
        const detailed = byId[row.StaffID];
        const skillNames = Array.isArray(detailed?.skills)
          ? detailed.skills.map(s => s.name ?? s.SkillName ?? '').filter(Boolean).join(', ')
          : Array.isArray(row.skills)
            ? row.skills.map(s => s.name ?? s.SkillName ?? '').filter(Boolean).join(', ')
            : '';
        return {
          StaffID: row.StaffID,
          Name: row.Name ?? '',
          Contract: contractName ?? '',
          Skills: skillNames
        };
      });
      if (!cancelled) setDisplayRows(rows);
    };
    buildDisplayRows();
    return () => { cancelled = true; };
  }, [data, contractsData]);
  
  const columns = displayRows && displayRows.length > 0 ? Object.keys(displayRows[0]) : [];
  
const formFields = [
    { name: 'name', type: 'text', label: 'Staff Name' },
    { 
      name: 'contractId', 
      type: 'select', 
      label: 'Contract', 
      options: contractsData?.map(c => ({ value: c.ContractID, label: c.Description })) || [] 
    },
    { 
      name: 'skills', 
      type: 'select', 
      label: 'Skills', 
      multiple: true, 
      options: skillsData?.map(s => ({ value: s.SkillID, label: s.SkillName })) || [] 
    },
    { 
      name: 'shifts', 
      type: 'select', 
      label: 'Shifts', 
      multiple: true, 
      options: shiftOptions
    }
  ];
  
  const requiredFields = ['name', 'contractId'];

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const shifts = await apiService.getTableData('Shifts');
        const options = (shifts || []).map(s => ({
          value: s.ShiftCode,
          label: `${s.ShiftName} (${s.ShiftCode})`
        }));
        setShiftOptions([...options, sentinel]);
      } catch (err) {
        console.error('Failed to fetch shifts for staff form:', err);
        setShiftOptions([sentinel]);
      }
    };
    fetchShifts();
  }, []);
  
  const handleView = (id) => {
    const row = (data || []).find(r => r.StaffID === id);
    if (!row) return alert('Staff not found');
    setSelectedId(id);
    setFormData({
      name: row.Name ?? '',
      contractId: row.ContractID ?? '',
      skills: Array.isArray(row.skills) ? row.skills.map(s => s.id) : [],
      shifts: Array.isArray(row.shifts) ? row.shifts : []
    });
    setFormErrors({});
    setViewModalOpen(true);
  };

  const handleEdit = (id) => {
    const row = (data || []).find(r => r.StaffID === id);
    if (!row) return alert('Staff not found');
    setSelectedId(id);
    setFormData({
      name: row.Name ?? '',
      contractId: row.ContractID ?? '',
      skills: Array.isArray(row.skills) ? row.skills.map(s => s.id) : [],
      shifts: Array.isArray(row.shifts) ? row.shifts : []
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Staff',
      message: 'Are you sure you want to delete this staff member?',
      onConfirm: async () => {
        try {
          await apiService.deleteRecord(tableName, id);
          setFeedback({ open: true, title: 'Success', message: 'Staff member deleted successfully!' });
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error deleting staff member: ${error.message}` });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };
  
  const handleCreateClick = () => {
    setFormData({});
    setFormErrors({});
    setCreateModalOpen(true);
  };

  const handleCreateClose = () => {
    setCreateModalOpen(false);
    setFormData({});
    setFormErrors({});
  };

  const handleViewClose = () => {
    setViewModalOpen(false);
    setSelectedId(null);
    setFormErrors({});
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedId(null);
    setFormErrors({});
  };

const [addShiftOpen, setAddShiftOpen] = useState(false);
const [addShiftData, setAddShiftData] = useState({ shiftName: '', shiftCode: '', startTime: '', endTime: '' });
const [addShiftErrors, setAddShiftErrors] = useState({});

const addShiftFields = [
  { name: 'shiftName', type: 'text', label: 'Shift Name' },
  { name: 'shiftCode', type: 'text', label: 'Shift Code' },
  { name: 'startTime', type: 'time', label: 'Start Time' },
  { name: 'endTime', type: 'time', label: 'End Time' }
];

const handleAddShiftChange = (field, value) => {
  setAddShiftData(prev => ({ ...prev, [field]: value }));
  if (addShiftErrors[field]) {
    setAddShiftErrors(prev => ({ ...prev, [field]: '' }));
  }
};

const validateAddShift = () => {
  const errs = {};
  const code = (addShiftData.shiftCode || '').trim();
  const name = (addShiftData.shiftName || '').trim();
  if (!name) errs.shiftName = 'Shift Name is required';
  if (!code) errs.shiftCode = 'Shift Code is required';
  else if (!/^[A-Z]$/.test(code)) errs.shiftCode = 'Use a single uppercase letter';
  const exists = shiftOptions.some(opt => opt.value === code);
  if (exists) errs.shiftCode = 'Shift code already exists';
  setAddShiftErrors(errs);
  return Object.keys(errs).length === 0;
};

const handleAddShiftSubmit = async () => {
  if (!validateAddShift()) return;
  try {
    const payload = {
      shiftName: addShiftData.shiftName.trim(),
      shiftCode: addShiftData.shiftCode.trim(),
      startTime: addShiftData.startTime || '',
      endTime: addShiftData.endTime || ''
    };
    await apiService.createRecord('Shifts', payload);
    const newOpt = { value: payload.shiftCode, label: `${payload.shiftName} (${payload.shiftCode})` };
    const withoutSentinel = shiftOptions.filter(o => o.value !== '__ADD__');
    setShiftOptions([...withoutSentinel, newOpt, sentinel]);
    setAddShiftOpen(false);
    setAddShiftData({ shiftName: '', shiftCode: '', startTime: '', endTime: '' });
    setAddShiftErrors({});
    setFormData(prev => ({ ...prev, shifts: [ ...(prev.shifts || []), payload.shiftCode ] }));
    setFeedback({ open: true, title: 'Success', message: 'Shift added. You can now select it.' });
  } catch (error) {
    setFeedback({ open: true, title: 'Error', message: `Error adding shift: ${error.message}` });
  }
};

const handleFormChange = (field, value) => {
  if (field === 'shifts') {
    const arr = Array.isArray(value) ? value : [];
    if (arr.includes('__ADD__')) {
      const filtered = arr.filter(v => v !== '__ADD__');
      setFormData(prev => ({ ...prev, shifts: filtered }));
      setAddShiftOpen(true);
    } else {
      setFormData(prev => ({ ...prev, shifts: arr }));
    }
  } else {
    setFormData(prev => ({ ...prev, [field]: value }));
  }
  
  if (formErrors[field]) {
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  }
};

  const validateForm = () => {
    const errors = {};
    
    requiredFields.forEach(field => {
      if (!formData[field] && formData[field] !== 0) {
        errors[field] = `${field} is required`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;
    setConfirmDialog({
      open: true,
      title: 'Add Staff Member',
      message: 'Confirm adding this staff member?',
      onConfirm: async () => {
        try {
          await apiService.createRecord(tableName, formData);
          setFeedback({ open: true, title: 'Success', message: 'Staff member created successfully!' });
          handleCreateClose();
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error creating staff member: ${error.message}` });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    try {
      const payload = {
        name: formData.name,
        contractId: formData.contractId,
        skills: formData.skills || [],
        shifts: formData.shifts || []
      };
      await apiService.updateRecord(tableName, selectedId, payload);
      setFeedback({ open: true, title: 'Success', message: 'Staff updated successfully!' });
      handleEditClose();
      onRefresh();
    } catch (error) {
      setFeedback({ open: true, title: 'Error', message: `Error updating staff: ${error.message}` });
    }
  };

  return (
    <>
      <Button 
        id="Staff-create-button" 
        onClick={() => {
          setFormData({});
          setFormErrors({});
          setCreateModalOpen(true);
        }} 
        style={{ display: 'none' }}
      >
        Create
      </Button>
      <BaseTable
        tableName={tableName}
        data={displayRows || []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <FormModal
        open={createModalOpen}
        onClose={handleCreateClose}
        title={`Add New Staff Member`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleCreateSubmit}
        submitButtonText="Create Staff Member"
      />

      <FormModal
        open={addShiftOpen}
        onClose={() => { setAddShiftOpen(false); setAddShiftErrors({}); }}
        title={`Add New Shift`}
        formData={addShiftData}
        formErrors={addShiftErrors}
        formFields={addShiftFields}
        onFormChange={handleAddShiftChange}
        onSubmit={handleAddShiftSubmit}
        submitButtonText="Add Shift"
      />

      <FormModal
        open={viewModalOpen}
        onClose={handleViewClose}
        title={`View Staff Member`}
        formData={formData}
        formErrors={{}}
        formFields={formFields}
        onFormChange={() => {}}
        onSubmit={() => {}}
        submitButtonText=""
        readOnly
      />

      <FormModal
        open={editModalOpen}
        onClose={handleEditClose}
        title={`Edit Staff Member`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleEditSubmit}
        submitButtonText="Save Changes"
      />

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
    </>
)};

export default StaffTable;
