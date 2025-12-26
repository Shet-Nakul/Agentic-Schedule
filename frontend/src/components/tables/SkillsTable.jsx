import React, { useState } from 'react';
import BaseTable from './BaseTable';
import FormModal from './FormModal';
import apiService from '../../services/api';
import { Button } from '@mui/material';
import ConfirmDialog from '../ConfirmDialog';
import FeedbackDialog from '../FeedbackDialog';

const SkillsTable = ({ data, onRefresh }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  const tableName = 'Skills';
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  const formFields = [{ name: 'skillName', type: 'text', label: 'Skill Name' }];
  const requiredFields = ['skillName'];
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [feedback, setFeedback] = useState({ open: false, title: '', message: '' });

  const handleView = (id) => {
    const row = (data || []).find(r => r.SkillID === id);
    if (!row) return;
    setFormData({ skillName: row.SkillName });
    setFormErrors({});
    setViewModalOpen(true);
  };

  const handleEdit = (id) => {
    const row = (data || []).find(r => r.SkillID === id);
    if (!row) return alert('Skill not found');
    setSelectedId(id);
    setFormData({ skillName: row.SkillName || '' });
    setFormErrors({});
    setEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Skill',
      message: 'Are you sure you want to delete this skill?',
      onConfirm: async () => {
        try {
          await apiService.deleteRecord(tableName, id);
          setFeedback({ open: true, title: 'Success', message: 'Skill deleted successfully!' });
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error deleting skill: ${error.message}` });
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
      title: 'Add Skill',
      message: 'Confirm adding this skill?',
      onConfirm: async () => {
        try {
          await apiService.createRecord(tableName, formData);
          setFeedback({ open: true, title: 'Success', message: 'Skill created successfully!' });
          handleCreateClose();
          onRefresh();
        } catch (error) {
          setFeedback({ open: true, title: 'Error', message: `Error creating skill: ${error.message}` });
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    try {
      await apiService.updateRecord(tableName, selectedId, { skillName: formData.skillName });
      alert('Skill updated successfully!');
      setEditModalOpen(false);
      setSelectedId(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating skill:', error);
      alert(`Error updating skill: ${error.message}`);
    }
  };

  return (
    <>
      <Button 
        id="Skills-create-button" 
        onClick={handleCreateClick} 
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
        title={`View Skill`}
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
        title={`Add New Skill`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleCreateSubmit}
        submitButtonText="Create Skill"
      />

      <FormModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedId(null); }}
        title={`Edit Skill`}
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

export default SkillsTable;
