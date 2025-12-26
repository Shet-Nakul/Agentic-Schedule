import React, { useState } from 'react';
import BaseTable from './BaseTable';
import FormModal from './FormModal';
import apiService from '../../services/api';
import { Button } from '@mui/material';
import ConfirmDialog from '../ConfirmDialog';
import FeedbackDialog from '../FeedbackDialog';

const ContractsTable = ({ data, onRefresh }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [feedback, setFeedback] = useState({ open: false, title: '', message: '' });
  
  const tableName = 'ContractsDetails';
  
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  const handleCreateClick = () => {
    setFormData({});
    setFormErrors({});
    setCreateModalOpen(true);
  };
  
  const formFields = [
    { name: 'ContractID', type: 'number', label: 'Contract ID' },
    { name: 'Description', type: 'text', label: 'Description' },
    { name: 'SingleAssignmentPerDay', type: 'boolean', label: 'Single Assignment Per Day' },
    { name: 'MaxNumAssignments', type: 'number', label: 'Max Assignments' },
    { name: 'MinNumAssignments', type: 'number', label: 'Min Assignments' },
    { name: 'MaxConsecutiveWorkingDays', type: 'number', label: 'Max Consecutive Working Days' },
    { name: 'MinConsecutiveWorkingDays', type: 'number', label: 'Min Consecutive Working Days' },
    { name: 'MaxConsecutiveFreeDays', type: 'number', label: 'Max Consecutive Free Days' },
    { name: 'MinConsecutiveFreeDays', type: 'number', label: 'Min Consecutive Free Days' },
    { name: 'MaxConsecutiveWorkingWeekends', type: 'number', label: 'Max Consecutive Working Weekends' },
    { name: 'MinConsecutiveWorkingWeekends', type: 'number', label: 'Min Consecutive Working Weekends' },
    { name: 'MaxWorkingWeekendsInFourWeeks', type: 'number', label: 'Max Working Weekends in 4 Weeks' },
    { name: 'WeekendDefinition', type: 'text', label: 'Weekend Definition' },
    { name: 'CompleteWeekends', type: 'boolean', label: 'Complete Weekends' },
    { name: 'IdenticalShiftTypesDuringWeekend', type: 'boolean', label: 'Identical Shift Types During Weekend' },
    { name: 'NoNightShiftBeforeFreeWeekend', type: 'boolean', label: 'No Night Shift Before Free Weekend' },
    { name: 'AlternativeSkillCategory', type: 'boolean', label: 'Alternative Skill Category' },
    { name: 'UnwantedPatterns', type: 'text', label: 'Unwanted Patterns' }
  ];
  
  const requiredFields = ['ContractID', 'Description'];
  
  const handleView = (id) => {
    console.log(`View contract with ID: ${id}`);
    alert(`View functionality will be implemented with a detail modal`);
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleEdit = (id) => {
    const row = (data || []).find(r => r.ContractID === id);
    if (!row) return alert('Contract not found');
    setSelectedId(id);
    setFormData({
      ContractID: row.ContractID ?? '',
      Description: row.Description ?? '',
      SingleAssignmentPerDay: !!row.SingleAssignmentPerDay,
      MaxNumAssignments: row.MaxNumAssignments ?? '',
      MinNumAssignments: row.MinNumAssignments ?? '',
      MaxConsecutiveWorkingDays: row.MaxConsecutiveWorkingDays ?? '',
      MinConsecutiveWorkingDays: row.MinConsecutiveWorkingDays ?? '',
      MaxConsecutiveFreeDays: row.MaxConsecutiveFreeDays ?? '',
      MinConsecutiveFreeDays: row.MinConsecutiveFreeDays ?? '',
      MaxConsecutiveWorkingWeekends: row.MaxConsecutiveWorkingWeekends ?? '',
      MinConsecutiveWorkingWeekends: row.MinConsecutiveWorkingWeekends ?? '',
      MaxWorkingWeekendsInFourWeeks: row.MaxWorkingWeekendsInFourWeeks ?? '',
      WeekendDefinition: row.WeekendDefinition ?? '',
      CompleteWeekends: !!row.CompleteWeekends,
      IdenticalShiftTypesDuringWeekend: !!row.IdenticalShiftTypesDuringWeekend,
      NoNightShiftBeforeFreeWeekend: !!row.NoNightShiftBeforeFreeWeekend,
      AlternativeSkillCategory: !!row.AlternativeSkillCategory,
      UnwantedPatterns: row.UnwantedPatterns ?? ''
    });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Contract',
      message: 'Are you sure you want to delete this contract?',
      onConfirm: async () => {
        try {
          await apiService.deleteRecord(tableName, id);
          setFeedback({ open: true, title: 'Success', message: 'Contract deleted successfully!' });
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error deleting contract: ${error.message}` });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };
  
  // const handleCreateClick = () => {
  //   setFormData({});
  //   setFormErrors({});
  //   setCreateModalOpen(true);
  // };

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
      title: 'Add Contract',
      message: 'Confirm adding this contract?',
      onConfirm: async () => {
        try {
          await apiService.createRecord(tableName, formData);
          setFeedback({ open: true, title: 'Success', message: 'Contract created successfully!' });
          handleCreateClose();
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error creating contract: ${error.message}` });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    try {
      const payload = { ...formData };
      delete payload.ContractID;
      await apiService.updateRecord(tableName, selectedId, payload);
      setFeedback({ open: true, title: 'Success', message: 'Contract updated successfully!' });
      setEditModalOpen(false);
      setSelectedId(null);
      onRefresh();
    } catch (error) {
      setFeedback({ open: true, title: 'Error', message: `Error updating contract: ${error.message}` });
    }
  };

  return (
    <>
      <Button 
        id="ContractsDetails-create-button" 
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
        title={`Add New Contract`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleCreateSubmit}
        submitButtonText="Create Contract"
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

      <FormModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedId(null); }}
        title={`Edit Contract`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleEditSubmit}
        submitButtonText="Save Changes"
      />
    </>
  );
};

export default ContractsTable;
