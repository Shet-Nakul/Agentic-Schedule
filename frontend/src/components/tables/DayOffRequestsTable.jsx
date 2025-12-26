import React, { useState } from 'react';
import BaseTable from './BaseTable';
import FormModal from './FormModal';
import apiService from '../../services/api';
import { Button } from '@mui/material';
import ConfirmDialog from '../ConfirmDialog';
import FeedbackDialog from '../FeedbackDialog';

const DayOffRequestsTable = ({ data, staffData, requestTypeData, onRefresh }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  const tableName = 'DayOffRequests';
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  
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
    }
  ];
  
  const requiredFields = ['EmployeeID', 'RequestDate', 'RequestTypeID'];
  
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
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Day Off Request',
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
      title: 'Add Day Off Request',
      message: 'Confirm adding this request?',
      onConfirm: async () => {
        try {
          const payload = {
            employeeId: formData.EmployeeID,
            requestDate: formData.RequestDate,
            requestTypeId: formData.RequestTypeID,
          };
          await apiService.createRecord(tableName, payload);
          setFeedback({ open: true, title: 'Success', message: 'Day off request created successfully!' });
          handleCreateClose();
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error creating day off request: ${error.message}` });
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
      };
      await apiService.createRecord(tableName, payload);
      setFeedback({ open: true, title: 'Success', message: 'Day off request updated successfully!' });
      setEditModalOpen(false);
      setSelectedId(null);
      onRefresh();
    } catch (error) {
      setFeedback({ open: true, title: 'Error', message: `Error updating day off request: ${error.message}` });
    }
  };

  return (
    <>
      <Button 
        id="DayOffRequests-create-button" 
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
        title={`View Day Off Request`}
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
        title={`Add New Day Off Request`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleCreateSubmit}
        submitButtonText="Create Day Off Request"
      />

      <FormModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedId(null); }}
        title={`Edit Day Off Request`}
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

export default DayOffRequestsTable;
