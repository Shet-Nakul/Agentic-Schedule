import React, { useState } from 'react';
import BaseTable from './BaseTable';
import FormModal from './FormModal';
import apiService from '../../services/api';
import { Button } from '@mui/material';
import ConfirmDialog from '../ConfirmDialog';
import FeedbackDialog from '../FeedbackDialog';

const ShiftsTable = ({ data, onRefresh }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  const tableName = 'Shifts';
  
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  const formFields = [
    { name: 'shiftName', type: 'text', label: 'Shift Name' },
    { 
      name: 'shiftCode', 
      type: 'select', 
      label: 'Shift Code',
      options: [
        { value: 'D', label: 'D - Day' },
        { value: 'L', label: 'L - Late' },
        { value: 'N', label: 'N - Night' },
        { value: 'DL', label: 'DL - Double Late' },
        { value: 'E', label: 'E - Early' },
        { value: 'DH', label: 'DH - Double Night' }
      ]
    },
    { name: 'startTime', type: 'time', label: 'Start Time' },
    { name: 'endTime', type: 'time', label: 'End Time' }
  ];
  
  const requiredFields = ['shiftName', 'shiftCode', 'startTime', 'endTime'];
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [feedback, setFeedback] = useState({ open: false, title: '', message: '' });
  
  const handleView = (id) => {
    const row = (data || []).find(r => r.ShiftID === id);
    if (!row) return alert('Shift not found');
    setSelectedId(id);
    setFormData({
      shiftName: row.ShiftName ?? '',
      shiftCode: row.ShiftCode ?? '',
      startTime: row.StartTime ?? '',
      endTime: row.EndTime ?? ''
    });
    setFormErrors({});
    setViewModalOpen(true);
  };

  const handleEdit = (id) => {
    const row = (data || []).find(r => r.ShiftID === id);
    if (!row) return alert('Shift not found');
    setSelectedId(id);
    setFormData({
      shiftName: row.ShiftName ?? '',
      shiftCode: row.ShiftCode ?? '',
      startTime: row.StartTime ?? '',
      endTime: row.EndTime ?? ''
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Shift',
      message: 'Are you sure you want to delete this shift?',
      onConfirm: async () => {
        try {
          await apiService.deleteRecord(tableName, id);
          setFeedback({ open: true, title: 'Success', message: 'Shift deleted successfully!' });
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error deleting shift: ${error.message}` });
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
    setFormData(prev => ({ ...prev, [field]: value }));
    
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

    // Additional validation for time format
    if (formData.startTime && formData.endTime) {
      const start = new Date(`1970-01-01T${formData.startTime}:00`);
      const end = new Date(`1970-01-01T${formData.endTime}:00`);
      
      if (start >= end) {
        errors.endTime = 'End time must be after start time';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;
    setConfirmDialog({
      open: true,
      title: 'Add Shift',
      message: 'Confirm adding this shift?',
      onConfirm: async () => {
        try {
          await apiService.createRecord(tableName, formData);
          setFeedback({ open: true, title: 'Success', message: 'Shift created successfully!' });
          handleCreateClose();
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error creating shift: ${error.message}` });
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
        shiftName: formData.shiftName,
        shiftCode: formData.shiftCode,
        startTime: formData.startTime,
        endTime: formData.endTime
      };
      await apiService.updateRecord(tableName, selectedId, payload);
      setFeedback({ open: true, title: 'Success', message: 'Shift updated successfully!' });
      setEditModalOpen(false);
      setSelectedId(null);
      onRefresh();
    } catch (error) {
      setFeedback({ open: true, title: 'Error', message: `Error updating shift: ${error.message}` });
    }
  };

  return (
    <>
      <Button 
        id="Shifts-create-button" 
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
        open={createModalOpen}
        onClose={handleCreateClose}
        title={`Add New Shift`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleCreateSubmit}
        submitButtonText="Create Shift"
      />

      <FormModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`View Shift`}
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
        onClose={() => { setEditModalOpen(false); setSelectedId(null); }}
        title={`Edit Shift`}
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

export default ShiftsTable;
