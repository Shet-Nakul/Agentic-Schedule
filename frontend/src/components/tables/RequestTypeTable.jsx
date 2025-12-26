import React, { useState } from 'react';
import BaseTable from './BaseTable';
import FormModal from './FormModal';
import apiService from '../../services/api';
import { Button } from '@mui/material';
import ConfirmDialog from '../ConfirmDialog';
import FeedbackDialog from '../FeedbackDialog';

const RequestTypeTable = ({ data, onRefresh }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  const tableName = 'RequestType';
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  const formFields = [
    { name: 'RequestTypeName', type: 'text', label: 'Request Type Name' },
    { name: 'RequestTypeDesc', type: 'text', label: 'Description' }
  ];
  
  const requiredFields = ['RequestTypeName'];
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [feedback, setFeedback] = useState({ open: false, title: '', message: '' });

  const handleView = (id) => {
    const row = (data || []).find(r => r.RequestTypeID === id);
    if (!row) return;
    setFormData({ RequestTypeName: row.RequestTypeName, RequestTypeDesc: row.RequestTypeDesc || '' });
    setFormErrors({});
    setViewModalOpen(true);
  };

  const handleEdit = (id) => {
    const row = (data || []).find(r => r.RequestTypeID === id);
    if (!row) return alert('Request type not found');
    setSelectedId(id);
    setFormData({ RequestTypeName: row.RequestTypeName || '', RequestTypeDesc: row.RequestTypeDesc || '' });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Request Type',
      message: 'Are you sure you want to delete this request type?',
      onConfirm: async () => {
        try {
          await apiService.deleteRecord(tableName, id);
          setFeedback({ open: true, title: 'Success', message: 'Request type deleted successfully!' });
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error deleting request type: ${error.message}` });
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
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;
    setConfirmDialog({
      open: true,
      title: 'Add Request Type',
      message: 'Confirm adding this request type?',
      onConfirm: async () => {
        try {
          await apiService.createRecord(tableName, formData);
          setFeedback({ open: true, title: 'Success', message: 'Request type created successfully!' });
          handleCreateClose();
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error creating request type: ${error.message}` });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    try {
      const res = await apiService.createRecord(tableName, {
        RequestTypeName: formData.RequestTypeName,
        RequestTypeDesc: formData.RequestTypeDesc || ''
      });
      const newId = res?.payload?.requestTypeIds?.[0];
      if (!newId) throw new Error('Failed to create new request type');

      const dayOff = await apiService.getTableData('DayOffRequests');
      const shiftOff = await apiService.getTableData('ShiftOffRequests');

      const migrateRequests = async (requests, isShift) => {
        for (const r of requests.filter(x => x.RequestTypeID === selectedId)) {
          await apiService.deleteRecord(isShift ? 'ShiftOffRequests' : 'DayOffRequests', r.RequestID);
          const payload = {
            employeeId: r.EmployeeID,
            requestDate: r.RequestDate,
            requestTypeId: newId,
            ...(isShift ? { shift: r.Shift } : {})
          };
          await apiService.createRecord(isShift ? 'ShiftOffRequests' : 'DayOffRequests', payload);
        }
      };

      await migrateRequests(dayOff, false);
      await migrateRequests(shiftOff, true);

      await apiService.deleteRecord(tableName, selectedId);

      setFeedback({ open: true, title: 'Success', message: 'Request type updated successfully!' });
      setEditModalOpen(false);
      setSelectedId(null);
      onRefresh();
    } catch (error) {
      setFeedback({ open: true, title: 'Error', message: `Error updating request type: ${error.message}` });
    }
  };

  return (
    <>
      <Button 
        id="RequestType-create-button" 
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
        title={`View Request Type`}
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
        title={`Add New Request Type`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleCreateSubmit}
        submitButtonText="Create Request Type"
      />

      <FormModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedId(null); }}
        title={`Edit Request Type`}
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

export default RequestTypeTable;
