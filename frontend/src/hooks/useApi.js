import { useState } from 'react';
import api, { proposalsAPI } from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get dashboard statistics
  const getStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [activitiesResponse, proposalsResponse, usersResponse] = await Promise.all([
        api.get('/admin/activities/stats'),
        api.get('/admin/proposals/stats'),
        api.get('/admin/users')
      ]);

      const usersData = usersResponse.data.data;
      const stats = {
        activities: activitiesResponse.data.data,
        proposals: proposalsResponse.data.data,
        users: {
          total: usersData.length,
          admins: usersData.filter(user => user.role === 'admin').length,
          students: usersData.filter(user => user.role === 'user').length
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch statistics';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get activities with proper filtering
  const getActivities = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.activity_type) params.append('activity_type', filters.activity_type);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      const response = await api.get(`/activities?${params.toString()}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch activities';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create activity
  const createActivity = async (activityData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/activities', activityData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create activity';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update activity
  const updateActivity = async (id, activityData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/activities/${id}`, activityData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update activity';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Approve activity (admin only)
  const approveActivity = async (id, approvalNotes = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/admin/activities/${id}/approve`, {
        approval_notes: approvalNotes
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to approve activity';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Reject activity (admin only)
  const rejectActivity = async (id, rejectionReason = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/admin/activities/${id}/reject`, {
        rejection_reason: rejectionReason
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reject activity';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get proposals with proper filtering
  const getProposals = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);
      
      const response = await api.get(`/proposals?${params.toString()}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch proposals';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create proposal (requires activity_id)
  const createProposal = async (proposalData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/proposals', proposalData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create proposal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Create proposal with file
  const createProposalWithFile = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/proposals/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create proposal with file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update proposal
  const updateProposal = async (id, proposalData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/proposals/${id}`, proposalData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update proposal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update proposal with file
  const updateProposalWithFile = async (id, formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/proposals/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update proposal with file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Submit proposal
  const submitProposal = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/proposals/${id}/submit`);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit proposal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Review proposal (admin only)
  const reviewProposal = async (id, status, reviewerComments = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/admin/proposals/${id}/review`, {
        status,
        reviewer_comments: reviewerComments
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to review proposal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get users (admin only)
  const getUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/admin/users');
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register student
  const registerStudent = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register/student', userData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to register student';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register admin
  const registerAdmin = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register/admin', userData);
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to register admin';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Download proposal file
  const downloadProposalFile = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the downloadFile method from proposalsAPI for proper API call
      const response = await proposalsAPI.downloadFile(id);
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `proposal-${id}.pdf`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, data: 'File downloaded successfully' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to download proposal file';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getStats,
    getActivities,
    createActivity,
    updateActivity,
    approveActivity,
    rejectActivity,
    getProposals,
    createProposal,
    createProposalWithFile,
    updateProposal,
    updateProposalWithFile,
    submitProposal,
    reviewProposal,
    downloadProposalFile,
    getUsers,
    registerStudent,
    registerAdmin
  };
};

export default useApi;
