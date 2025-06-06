import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ActivitiesTab = () => {
  const { isAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: 'academic',
    organizer: '',
    location: '',
    start_date: '',
    end_date: '',
    budget_needed: '',
    participant_count: ''
  });

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Determine which endpoint to use
      const endpoint = isAdmin() ? '/admin/activities' : '/activities';
      const response = await api.get(endpoint);
      
      // Check response structure and extract data
      if (response.data) {
        const activities = response.data.data || response.data;
        setActivities(Array.isArray(activities) ? activities : []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch activities';
      setError(errorMessage);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        budget_needed: formData.budget_needed ? parseFloat(formData.budget_needed) : 0,
        participant_count: formData.participant_count ? parseInt(formData.participant_count) : 0
      };
      
      let response;
      if (editingActivity) {
        response = await api.put(`/activities/${editingActivity.id}`, submitData);
        setSuccess('Activity updated successfully');
      } else {
        response = await api.post('/activities', submitData);
        setSuccess('Activity created successfully');
      }
      
      setShowModal(false);
      setEditingActivity(null);
      resetForm();
      await fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save activity';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (activityId) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/activities/${activityId}/approve`, {
        approval_notes: 'Activity approved'
      });
      setSuccess('Activity approved successfully');
      await fetchActivities();
    } catch (error) {
      console.error('Error approving activity:', error);
      setError(error.response?.data?.message || 'Failed to approve activity');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (activityId) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/activities/${activityId}/reject`, {
        rejection_reason: 'Activity rejected'
      });
      setSuccess('Activity rejected successfully');
      await fetchActivities();
    } catch (error) {
      console.error('Error rejecting activity:', error);
      setError(error.response?.data?.message || 'Failed to reject activity');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      activity_type: 'academic',
      organizer: '',
      location: '',
      start_date: '',
      end_date: '',
      budget_needed: '',
      participant_count: ''
    });
  };

  const openModal = (activity = null) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        activity_type: activity.activity_type || 'academic',
        organizer: activity.organizer || '',
        location: activity.location || '',
        start_date: activity.start_date ? new Date(activity.start_date).toISOString().slice(0, 16) : '',
        end_date: activity.end_date ? new Date(activity.end_date).toISOString().slice(0, 16) : '',
        budget_needed: activity.budget_needed || '',
        participant_count: activity.participant_count || ''
      });
    } else {
      setEditingActivity(null);
      resetForm();
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingActivity(null);
    resetForm();
    setError('');
    setSuccess('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      completed: 'info'
    };
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed'
    };
    return <Badge bg={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-header-top">
          <div>
            <h1>Student Activities</h1>
            <p className="content-breadcrumb">Dashboard • Activities • Management</p>
          </div>
          <div className="activity-header-actions">
            <button 
              className="btn-create-activity"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-plus-circle"></i>
              Create Activity
            </button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          <i className="bi bi-exclamation-triangle"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          <i className="bi bi-check-circle"></i>
          {success}
        </Alert>
      )}

      <div className="content-card">
        <div className="content-card-header">
          <div className="content-card-header-content">
            <div className="content-card-icon primary">
              <i className="bi bi-calendar-event"></i>
            </div>
            <div className="content-card-text">
              <h5>Student Activities</h5>
              <p>Manage and organize all student activities</p>
            </div>
          </div>
        </div>
        <div className="content-card-body" style={{ padding: 0 }}>
          <Table responsive className="table-hover">
            <thead>
              <tr>
                <th>Activity Details</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-4">
                    <div className="loading-spinner"></div>
                    <div className="mt-2">Loading activities...</div>
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4">
                    <div className="empty-state">
                      <i className="bi bi-calendar-x"></i>
                      <h5>No Activities Found</h5>
                      <p>Start by creating your first activity</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id}>
                    <td data-label="Activity Details">
                      <div>
                        <strong>{activity.title}</strong>
                        <br />
                        <small className="text-muted">{activity.organizer}</small>
                      </div>
                    </td>
                    <td data-label="Type">
                      <Badge bg={activity.activity_type === 'academic' ? 'primary' : 'info'}>
                        {activity.activity_type === 'academic' ? 'Academic' : 'Non Academic'}
                      </Badge>
                    </td>
                    <td data-label="Schedule">
                      <div>
                        <small className="d-block">{formatDate(activity.start_date)}</small>
                        <small className="text-muted">{activity.location}</small>
                      </div>
                    </td>
                    <td data-label="Budget">{formatCurrency(activity.budget_needed)}</td>
                    <td data-label="Status">{getStatusBadge(activity.status)}</td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openModal(activity)}
                          disabled={loading}
                          title="Edit Activity"
                        >
                          <i className="bi bi-pencil"></i>
                          <span className="mobile-only ms-1">Edit</span>
                        </Button>
                        {isAdmin() && activity.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => handleApprove(activity.id)}
                              disabled={loading}
                              title="Approve Activity"
                            >
                              <i className="bi bi-check"></i>
                              <span className="mobile-only ms-1">Approve</span>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleReject(activity.id)}
                              disabled={loading}
                              title="Reject Activity"
                            >
                              <i className="bi bi-x"></i>
                              <span className="mobile-only ms-1">Reject</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Activity Modal */}
      <Modal show={showModal} onHide={closeModal} size="lg" centered className="activities-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-calendar-event"></i>
            {editingActivity ? 'Edit Activity' : 'Create New Activity'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger" className="mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}
            
            <div className="activities-form-section">
              <div className="activities-form-section-title">
                <i className="bi bi-info-circle"></i>
                Basic Information
              </div>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="required">Activity Title</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      placeholder="Enter activity title"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Activity Type</Form.Label>
                    <Form.Select
                      value={formData.activity_type}
                      onChange={(e) => setFormData({...formData, activity_type: e.target.value})}
                    >
                      <option value="academic">Academic</option>
                      <option value="non_academic">Non Academic</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Organizer</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.organizer}
                      onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                      placeholder="Enter organizer name"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe the activity"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="activities-form-section">
              <div className="activities-form-section-title">
                <i className="bi bi-calendar"></i>
                Schedule & Location
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Enter event location"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="activities-form-section">
              <div className="activities-form-section-title">
                <i className="bi bi-cash"></i>
                Budget & Participants
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Budget Needed (IDR)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.budget_needed}
                      onChange={(e) => setFormData({...formData, budget_needed: e.target.value})}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Expected Participants</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={formData.participant_count}
                      onChange={(e) => setFormData({...formData, participant_count: e.target.value})}
                      placeholder="Number of participants"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal} disabled={loading}>
              <i className="bi bi-x-circle me-2"></i>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {editingActivity ? 'Update Activity' : 'Create Activity'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ActivitiesTab;
