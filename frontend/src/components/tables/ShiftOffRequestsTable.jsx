import React, { useState, useEffect } from 'react';
import BaseTable from './BaseTable';
import FormModal from './FormModal';
import apiService from '../../services/api';
import { Button } from '@mui/material';
import ConfirmDialog from '../ConfirmDialog';
import FeedbackDialog from '../FeedbackDialog';

const ShiftOffRequestsTable = ({ data, staffData, requestTypeData, shiftsData, onRefresh }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  const tableName = 'ShiftOffRequests';
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  const toOptions = (list) => (list || []).map(s => ({ value: s.ShiftCode, label: `${s.ShiftName} (${s.ShiftCode})` }));
  const [shiftOptionsState, setShiftOptionsState] = useState([...toOptions(shiftsData), { value: '__ADD__', label: 'Add New Shift…' }]);

  useEffect(() => {
    setShiftOptionsState([...toOptions(shiftsData), { value: '__ADD__', label: 'Add New Shift…' }]);
  }, [shiftsData]);

  const formFields = [
    { 
      name: 'EmployeeID', 
      type: 'select', 
      label: 'Employee', 
      options: staffData?.map(s => ({ value: s.StaffID, label: s.Name })) || [] 
    },
    { name: 'RequestDate', type: 'date', label: 'Request Date' },
    { 
      name: 'RequestTypeID', 
      type: 'select', 
      label: 'Request Type', 
      options: requestTypeData?.map(r => ({ value: r.RequestTypeID, label: r.RequestTypeName })) || [] 
    },
    { name: 'Shift', type: 'select', label: 'Shift', options: shiftOptionsState }
  ];
  
  const requiredFields = ['EmployeeID', 'RequestDate', 'RequestTypeID', 'Shift'];
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [feedback, setFeedback] = useState({ open: false, title: '', message: '' });

  const handleView = (id) => {
    const row = (data || []).find(r => r.RequestID === id);
    if (!row) return;
    setFormData({
      EmployeeID: row.EmployeeID,
      RequestDate: row.RequestDate,
      RequestTypeID: row.RequestTypeID,
      Shift: row.Shift,
    });
    setFormErrors({});
    setViewModalOpen(true);
  };

  const handleEdit = (id) => {
    const row = (data || []).find(r => r.RequestID === id);
    if (!row) return alert('Request not found');
    setSelectedId(id);
    setFormData({
      EmployeeID: row.EmployeeID,
      RequestDate: row.RequestDate,
      RequestTypeID: row.RequestTypeID,
      Shift: row.Shift,
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Shift Off Request',
      message: 'Are you sure you want to delete this request?',
      onConfirm: async () => {
        try {
          await apiService.deleteRecord(tableName, id);
          setFeedback({ open: true, title: 'Success', message: 'Request deleted successfully!' });
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error deleting request: ${error.message}` });
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

  const handleFormChange = (field, value) => {
    if (field === 'Shift' && value === '__ADD__') {
      setAddShiftOpen(true);
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    const exists = shiftOptionsState.some(opt => opt.value === code);
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
      setShiftOptionsState(prev => [{ value: '__ADD__', label: 'Add New Shift…' }, ...prev.filter(o => o.value !== '__ADD__'), newOpt].filter((v, i, a) => a.findIndex(x => x.value === v.value) === i).concat());
      setAddShiftOpen(false);
      setAddShiftData({ shiftName: '', shiftCode: '', startTime: '', endTime: '' });
      setAddShiftErrors({});
      setFormData(prev => ({ ...prev, Shift: payload.shiftCode }));
      setFeedback({ open: true, title: 'Success', message: 'Shift added. You can now select it.' });
    } catch (error) {
      setFeedback({ open: true, title: 'Error', message: `Error adding shift: ${error.message}` });
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
      title: 'Add Shift Off Request',
      message: 'Confirm adding this request?',
      onConfirm: async () => {
        try {
          const payload = {
            employeeId: formData.EmployeeID,
            requestDate: formData.RequestDate,
            requestTypeId: formData.RequestTypeID,
            shift: formData.Shift,
          };
          await apiService.createRecord(tableName, payload);
          setFeedback({ open: true, title: 'Success', message: 'Shift off request created successfully!' });
          handleCreateClose();
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error creating shift off request: ${error.message}` });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    try {
      await apiService.deleteRecord(tableName, selectedId);
      const payload = {
        employeeId: formData.EmployeeID,
        requestDate: formData.RequestDate,
        requestTypeId: formData.RequestTypeID,
        shift: formData.Shift,
      };
      await apiService.createRecord(tableName, payload);
      setFeedback({ open: true, title: 'Success', message: 'Shift off request updated successfully!' });
      setEditModalOpen(false);
      setSelectedId(null);
      onRefresh();
    } catch (error) {
      setFeedback({ open: true, title: 'Error', message: `Error updating shift off request: ${error.message}` });
    }
  };

  return (
    <>
      <Button 
        id="ShiftOffRequests-create-button" 
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
        data={data || []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <FormModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setFormData({});
          setFormErrors({});
        }}
        title={`View Shift Off Request`}
        formData={formData}
        formErrors={{}}
        formFields={formFields}
        onFormChange={() => {}}
        onSubmit={() => {}}
        submitButtonText=""
        readOnly={true}
      />

      <FormModal
        open={createModalOpen}
        onClose={handleCreateClose}
        title={`Add New Shift Off Request`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleCreateSubmit}
        submitButtonText="Create Shift Off Request"
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
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedId(null); }}
        title={`Edit Shift Off Request`}
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
  );
};

export default ShiftOffRequestsTable;
