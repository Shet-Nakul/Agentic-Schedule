import React, { useState } from 'react';
import BaseTable from './BaseTable';
import FormModal from './FormModal';
import apiService from '../../services/api';
import { Button } from '@mui/material';

const ShiftRequirementsTable = ({ data, skillsData, onRefresh }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  const tableName = 'ShiftRequirements';
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
  
  const formFields = [
    { 
      name: 'dayOfWeek', 
      type: 'select', 
      label: 'Day of Week', 
      options: [
        { value: 'Monday', label: 'Monday' },
        { value: 'Tuesday', label: 'Tuesday' },
        { value: 'Wednesday', label: 'Wednesday' },
        { value: 'Thursday', label: 'Thursday' },
        { value: 'Friday', label: 'Friday' },
        { value: 'Saturday', label: 'Saturday' },
        { value: 'Sunday', label: 'Sunday' }
      ]
    },
    { name: 'shift', type: 'text', label: 'Shift' },
    { 
      name: 'skillId', 
      type: 'select', 
      label: 'Skill', 
      options: skillsData?.map(s => ({ value: s.SkillID, label: s.SkillName })) || [] 
    },
    { name: 'preferred', type: 'number', label: 'Preferred' }
  ];
  
  const requiredFields = ['dayOfWeek', 'shift', 'skillId'];
  
  const handleView = (id) => {
    console.log(`View shift requirement with ID: ${id}`);
    alert(`View functionality will be implemented with a detail modal`);
  };

  const handleEdit = (id) => {
    console.log(`Edit shift requirement with ID: ${id}`);
    alert(`Edit functionality will be implemented with a form modal`);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this shift requirement?`)) {
      try {
        await apiService.deleteRecord(tableName, id);
        alert('Shift requirement deleted successfully!');
        onRefresh();
      } catch (error) {
        console.error('Error deleting shift requirement:', error);
        alert(`Error deleting shift requirement: ${error.message}`);
      }
    }
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
    try {
      await apiService.createRecord(tableName, formData);
      alert('Shift requirement created successfully!');
      handleCreateClose();
      onRefresh();
    } catch (error) {
      console.error('Error creating shift requirement:', error);
      alert(`Error creating shift requirement: ${error.message}`);
    }
  };

  return (
    <>
      <Button 
        id="ShiftRequirements-create-button" 
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
        title={`Add New Shift Requirement`}
        formData={formData}
        formErrors={formErrors}
        formFields={formFields}
        onFormChange={handleFormChange}
        onSubmit={handleCreateSubmit}
        submitButtonText="Create Shift Requirement"
      />
    </>
  );
};

export default ShiftRequirementsTable;