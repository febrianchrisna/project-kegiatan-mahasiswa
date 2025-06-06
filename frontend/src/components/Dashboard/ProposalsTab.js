import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button, Table, Alert, Badge, Nav, Tab, Row, Col, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ProposalsTab = () => {
  const { isAdmin } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedFile, setSelectedFile] = useState(null);

  const [formData, setFormData] = useState({
    activity_id: '',
    title: '',
    background: '',
    objectives: '',
    target_audience: '',
    implementation_plan: '',
    timeline: {
      phase1: '',
      phase2: ''
    },
    budget_breakdown: {
      equipment: '',
      development: '',
      maintenance: ''
    },
    expected_outcomes: '',
    risk_assessment: '',
    evaluation_method: ''
  });

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = isAdmin() ? '/admin/proposals' : '/proposals';
      const response = await api.get(endpoint);
      
      if (response.data) {
        const proposals = response.data.data || response.data;
        setProposals(Array.isArray(proposals) ? proposals : []);
      } else {
        setProposals([]);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch proposals';
      setError(errorMessage);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchApprovedActivities = useCallback(async () => {
    try {
      const response = await api.get('/activities?status=approved');
      if (response.data) {
        const activities = response.data.data || response.data;
        setActivities(Array.isArray(activities) ? activities : []);
      }
    } catch (error) {
      console.error('Error fetching approved activities:', error);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
    fetchApprovedActivities();
  }, [fetchProposals, fetchApprovedActivities]);

  const retryRequest = async (requestFn, maxRetries = 3, delay = 2000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await requestFn();
        return result;
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${i + 1} failed:`, error.message);
        
        // Don't retry on client errors (4xx) except for timeout
        if (error.response?.status >= 400 && error.response?.status < 500 && error.code !== 'ECONNABORTED') {
          throw error;
        }
        
        // Don't retry on ERR_CONNECTION_REFUSED
        if (error.code === 'ERR_CONNECTION_REFUSED') {
          throw error;
        }
        
        if (i < maxRetries - 1) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Exponential backoff
        }
      }
    }
    
    throw lastError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if server is running first
    try {
      await api.get('/health');
    } catch (error) {
      setError('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Validate based on active tab
      if (activeTab === 'upload') {
        if (!selectedFile) {
          setError('Please select a PDF file to upload');
          return;
        }
        if (!formData.activity_id) {
          setError('Please select an activity');
          return;
        }
      } else {
        // Manual form validation
        if (!formData.activity_id || !formData.title || !formData.background || 
            !formData.objectives || !formData.target_audience || 
            !formData.implementation_plan || !formData.expected_outcomes) {
          setError('Please fill in all required fields');
          return;
        }
      }
      
      if (activeTab === 'upload' && selectedFile) {
        // Handle file upload with retry mechanism
        const fileFormData = new FormData();
        fileFormData.append('file', selectedFile);
        fileFormData.append('activity_id', formData.activity_id);
        fileFormData.append('title', formData.title || selectedFile.name.replace('.pdf', ''));
        
        console.log('Submitting file upload...', {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          activityId: formData.activity_id
        });
        
        const uploadRequest = async () => {
          if (editingProposal) {
            return await api.put(`/proposals/${editingProposal.id}/upload`, fileFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 300000 // 5 minutes
            });
          } else {
            return await api.post('/proposals/upload', fileFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 300000 // 5 minutes
            });
          }
        };
        
        await retryRequest(uploadRequest, 2, 2000); // Reduce retries since connection issues are immediate
        setSuccess(editingProposal ? 'Proposal file updated successfully' : 'Proposal file uploaded successfully');
      } else {
        // Handle manual form with retry
        const submitData = {
          ...formData,
          budget_breakdown: {
            equipment: parseFloat(formData.budget_breakdown.equipment) || 0,
            development: parseFloat(formData.budget_breakdown.development) || 0,
            maintenance: parseFloat(formData.budget_breakdown.maintenance) || 0
          }
        };
        
        const manualRequest = async () => {
          if (editingProposal) {
            return await api.put(`/proposals/${editingProposal.id}`, submitData);
          } else {
            return await api.post('/proposals', submitData);
          }
        };
        
        await retryRequest(manualRequest, 3, 1000);
        setSuccess(editingProposal ? 'Proposal updated successfully' : 'Proposal created successfully');
      }
      
      setShowModal(false);
      setEditingProposal(null);
      resetForm();
      await fetchProposals();
    } catch (error) {
      console.error('Error saving proposal:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save proposal';
      
      if (error.code === 'ERR_CONNECTION_REFUSED') {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try with a smaller file or check your connection.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large. Please select a smaller PDF file (max 50MB).';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || 'Invalid request. Please check your inputs.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = async (proposalId) => {
    try {
      setLoading(true);
      await api.put(`/proposals/${proposalId}/submit`);
      setSuccess('Proposal submitted successfully');
      await fetchProposals();
    } catch (error) {
      console.error('Error submitting proposal:', error);
      setError(error.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewProposal = async (proposalId, status, comments) => {
    try {
      setLoading(true);
      await api.put(`/admin/proposals/${proposalId}/review`, {
        status,
        reviewer_comments: comments
      });
      setSuccess(`Proposal ${status} successfully`);
      await fetchProposals();
    } catch (error) {
      console.error('Error reviewing proposal:', error);
      setError(error.response?.data?.message || 'Failed to review proposal');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      activity_id: '',
      title: '',
      background: '',
      objectives: '',
      target_audience: '',
      implementation_plan: '',
      timeline: {
        phase1: '',
        phase2: ''
      },
      budget_breakdown: {
        equipment: '',
        development: '',
        maintenance: ''
      },
      expected_outcomes: '',
      risk_assessment: '',
      evaluation_method: ''
    });
    setSelectedFile(null);
    setActiveTab('manual');
  };

  const openModal = (proposal = null) => {
    if (proposal) {
      setEditingProposal(proposal);
      setFormData({
        activity_id: proposal.activity_id || '',
        title: proposal.title || '',
        background: proposal.background || '',
        objectives: proposal.objectives || '',
        target_audience: proposal.target_audience || '',
        implementation_plan: proposal.implementation_plan || '',
        timeline: proposal.timeline || { phase1: '', phase2: '' },
        budget_breakdown: proposal.budget_breakdown || { equipment: '', development: '', maintenance: '' },
        expected_outcomes: proposal.expected_outcomes || '',
        risk_assessment: proposal.risk_assessment || '',
        evaluation_method: proposal.evaluation_method || ''
      });
      // Set tab based on whether proposal has a file
      setActiveTab(proposal.gcs_filename ? 'upload' : 'manual'); // Changed from file_path to gcs_filename
    } else {
      setEditingProposal(null);
      resetForm();
    }
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProposal(null);
    resetForm();
    setError('');
    setSuccess('');
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      submitted: 'warning',
      approved: 'success',
      rejected: 'danger',
      revision_required: 'info'
    };
    const labels = {
      draft: 'Draft',
      submitted: 'Submitted',
      approved: 'Approved',
      rejected: 'Rejected',
      revision_required: 'Revision Required'
    };
    return <Badge bg={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  const getActivityTitle = (activityId) => {
    const activity = activities.find(act => act.id === activityId);
    return activity ? activity.title : 'Unknown Activity';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file only');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file only');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const downloadProposalFile = async (proposalId) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('=== STARTING DOWNLOAD ===');
      console.log('Proposal ID:', proposalId);
      
      const token = localStorage.getItem('accessToken');
      console.log('Token available:', !!token);
      
      // Simple approach: Create a temporary link and click it
      // This bypasses CORS issues by letting the browser handle the download directly
      
      let downloadUrl = '';
      
      if (token) {
        // Try authenticated download first
        downloadUrl = `http://localhost:5000/proposals/${proposalId}/download?token=${encodeURIComponent(token)}`;
        console.log('Using authenticated download URL:', downloadUrl);
      } else {
        // Use public download
        downloadUrl = `http://localhost:5000/public/proposals/${proposalId}/download`;
        console.log('Using public download URL:', downloadUrl);
      }
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank'; // Open in new tab to avoid navigation issues
      link.download = `proposal-${proposalId}.pdf`; // Suggest filename
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Download initiated successfully');
      setSuccess('Download started. Please check your downloads folder.');
      
    } catch (error) {
      console.error('=== DOWNLOAD FAILED ===');
      console.error('Error:', error);
      
      setError('Failed to start download. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-header-top">
          <div>
            <h1>Student Proposals</h1>
            <p className="content-breadcrumb">Dashboard • Proposals • Management</p>
          </div>
          <div className="proposal-header-actions">
            <button 
              className="btn-create-proposal"
              onClick={() => setShowModal(true)}
            >
              <i className="bi bi-file-earmark-plus"></i>
              Create Proposal
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

      {activities.length === 0 && !loading && (
        <Alert variant="info">
          <i className="bi bi-info-circle"></i>
          No approved activities available. You need an approved activity to create a proposal.
        </Alert>
      )}

      <div className="content-card">
        <div className="content-card-header">
          <div className="content-card-header-content">
            <div className="content-card-icon primary">
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <div className="content-card-text">
              <h5>Student Proposals</h5>
              <p>Manage and review student proposals</p>
            </div>
          </div>
        </div>
        <div className="content-card-body" style={{ padding: 0 }}>
          <Table responsive className="table-hover">
            <thead>
              <tr>
                <th>Proposal Details</th>
                <th>Activity</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    <div className="loading-spinner"></div>
                    <div className="mt-2">Loading proposals...</div>
                  </td>
                </tr>
              ) : proposals.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    <div className="empty-state">
                      <i className="bi bi-file-earmark-x"></i>
                      <h5>No Proposals Found</h5>
                      <p>Start by creating your first proposal</p>
                    </div>
                  </td>
                </tr>
              ) : (
                proposals.map((proposal) => (
                  <tr key={proposal.id}>
                    <td data-label="Proposal Details">
                      <div>
                        <strong>{proposal.title}</strong>
                        <br />
                        <small className="text-muted">{proposal.proposal_number}</small>
                        {proposal.gcs_filename && ( // Changed from file_path to gcs_filename
                          <>
                            <br />
                            <small className="text-info">
                              <i className="bi bi-file-pdf me-1"></i>
                              PDF Attached
                            </small>
                          </>
                        )}
                      </div>
                    </td>
                    <td data-label="Activity">
                      <small>{getActivityTitle(proposal.activity_id)}</small>
                    </td>
                    <td data-label="Status">{getStatusBadge(proposal.status)}</td>
                    <td data-label="Submitted">
                      <small>{formatDate(proposal.submitted_at)}</small>
                    </td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        {proposal.gcs_filename && ( // Changed from file_path to gcs_filename
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => downloadProposalFile(proposal.id)}
                            disabled={loading}
                            title="Download PDF"
                            className="btn-download-proposal"
                          >
                            <i className="bi bi-download"></i>
                            <span className="mobile-only ms-1">Download</span>
                          </Button>
                        )}
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openModal(proposal)}
                          disabled={loading}
                          title="Edit Proposal"
                        >
                          <i className="bi bi-pencil"></i>
                          <span className="mobile-only ms-1">Edit</span>
                        </Button>
                        {proposal.status === 'draft' && (
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => handleSubmitProposal(proposal.id)}
                            disabled={loading}
                            title="Submit Proposal"
                          >
                            <i className="bi bi-send"></i>
                            <span className="mobile-only ms-1">Submit</span>
                          </Button>
                        )}
                        {isAdmin() && proposal.status === 'submitted' && (
                          <>
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => handleReviewProposal(proposal.id, 'approved', 'Proposal approved')}
                              disabled={loading}
                              title="Approve Proposal"
                            >
                              <i className="bi bi-check"></i>
                              <span className="mobile-only ms-1">Approve</span>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleReviewProposal(proposal.id, 'rejected', 'Proposal rejected')}
                              disabled={loading}
                              title="Reject Proposal"
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

      {/* Proposal Modal */}
      <Modal show={showModal} onHide={closeModal} size="xl" centered className="proposals-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-file-earmark-text"></i>
            {editingProposal ? 'Edit Proposal' : 'Create New Proposal'}
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
            
            {/* Proposal Type Tabs */}
            <div className="proposal-tabs">
              <Nav variant="pills" className="nav-pills">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'manual'} 
                    onClick={() => setActiveTab('manual')}
                  >
                    <i className="bi bi-pencil-square"></i>
                    Manual Form
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'upload'} 
                    onClick={() => setActiveTab('upload')}
                  >
                    <i className="bi bi-file-pdf"></i>
                    Upload PDF
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            <Tab.Container activeKey={activeTab}>
              <Tab.Content className="proposal-tab-content">
                {/* Manual Form Tab */}
                <Tab.Pane eventKey="manual" className="proposal-tab-pane">
                  <div className="proposals-form-section">
                    <div className="proposals-form-section-title">
                      <i className="bi bi-info-circle"></i>
                      Basic Information
                    </div>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="required">Related Activity</Form.Label>
                          <Form.Select
                            name="activity_id"
                            value={formData.activity_id}
                            onChange={(e) => setFormData({...formData, activity_id: e.target.value})}
                            required={activeTab === 'manual'}
                          >
                            <option value="">Select an approved activity</option>
                            {activities.map(activity => (
                              <option key={activity.id} value={activity.id}>
                                {activity.title}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="required">Proposal Title</Form.Label>
                          <Form.Control
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required={activeTab === 'manual'}
                            placeholder="Enter proposal title"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="required">Background</Form.Label>
                          <Form.Control
                            name="background"
                            as="textarea"
                            rows={3}
                            value={formData.background}
                            onChange={(e) => setFormData({...formData, background: e.target.value})}
                            required={activeTab === 'manual'}
                            placeholder="Describe the background and context"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="proposals-form-section">
                    <div className="proposals-form-section-title">
                      <i className="bi bi-target"></i>
                      Objectives & Planning
                    </div>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="required">Objectives</Form.Label>
                          <Form.Control
                            name="objectives"
                            as="textarea"
                            rows={3}
                            value={formData.objectives}
                            onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                            required={activeTab === 'manual'}
                            placeholder="List the main objectives"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="required">Target Audience</Form.Label>
                          <Form.Control
                            name="target_audience"
                            type="text"
                            value={formData.target_audience}
                            onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                            required={activeTab === 'manual'}
                            placeholder="Who is the target audience?"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label className="required">Implementation Plan</Form.Label>
                          <Form.Control
                            name="implementation_plan"
                            as="textarea"
                            rows={4}
                            value={formData.implementation_plan}
                            onChange={(e) => setFormData({...formData, implementation_plan: e.target.value})}
                            required={activeTab === 'manual'}
                            placeholder="Describe the implementation plan"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="proposals-form-section">
                    <div className="proposals-form-section-title">
                      <i className="bi bi-clock"></i>
                      Timeline & Budget
                    </div>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Phase 1 Timeline</Form.Label>
                          <Form.Control
                            name="timeline_phase1"
                            type="text"
                            value={formData.timeline.phase1}
                            onChange={(e) => setFormData({...formData, timeline: {...formData.timeline, phase1: e.target.value}})}
                            placeholder="e.g., 3 months"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Phase 2 Timeline</Form.Label>
                          <Form.Control
                            name="timeline_phase2"
                            type="text"
                            value={formData.timeline.phase2}
                            onChange={(e) => setFormData({...formData, timeline: {...formData.timeline, phase2: e.target.value}})}
                            placeholder="e.g., 6 months"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Equipment Budget (IDR)</Form.Label>
                          <Form.Control
                            name="budget_equipment"
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.budget_breakdown.equipment}
                            onChange={(e) => setFormData({...formData, budget_breakdown: {...formData.budget_breakdown, equipment: e.target.value}})}
                            placeholder="0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Development Budget (IDR)</Form.Label>
                          <Form.Control
                            name="budget_development"
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.budget_breakdown.development}
                            onChange={(e) => setFormData({...formData, budget_breakdown: {...formData.budget_breakdown, development: e.target.value}})}
                            placeholder="0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Maintenance Budget (IDR)</Form.Label>
                          <Form.Control
                            name="budget_maintenance"
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.budget_breakdown.maintenance}
                            onChange={(e) => setFormData({...formData, budget_breakdown: {...formData.budget_breakdown, maintenance: e.target.value}})}
                            placeholder="0"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="proposals-form-section">
                    <div className="proposals-form-section-title">
                      <i className="bi bi-graph-up"></i>
                      Outcomes & Assessment
                    </div>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="required">Expected Outcomes</Form.Label>
                          <Form.Control
                            name="expected_outcomes"
                            as="textarea"
                            rows={3}
                            value={formData.expected_outcomes}
                            onChange={(e) => setFormData({...formData, expected_outcomes: e.target.value})}
                            required={activeTab === 'manual'}
                            placeholder="What are the expected outcomes?"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Risk Assessment</Form.Label>
                          <Form.Control
                            name="risk_assessment"
                            as="textarea"
                            rows={3}
                            value={formData.risk_assessment}
                            onChange={(e) => setFormData({...formData, risk_assessment: e.target.value})}
                            placeholder="Identify potential risks"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Evaluation Method</Form.Label>
                          <Form.Control
                            name="evaluation_method"
                            as="textarea"
                            rows={2}
                            value={formData.evaluation_method}
                            onChange={(e) => setFormData({...formData, evaluation_method: e.target.value})}
                            placeholder="How will success be measured?"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Tab.Pane>

                {/* PDF Upload Tab */}
                <Tab.Pane eventKey="upload" className="proposal-tab-pane">
                  <div className="proposals-form-section">
                    <div className="proposals-form-section-title">
                      <i className="bi bi-info-circle"></i>
                      Basic Information
                    </div>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="required">Related Activity</Form.Label>
                          <Form.Select
                            name="upload_activity_id"
                            value={formData.activity_id}
                            onChange={(e) => setFormData({...formData, activity_id: e.target.value})}
                            required={activeTab === 'upload'}
                          >
                            <option value="">Select an approved activity</option>
                            {activities.map(activity => (
                              <option key={activity.id} value={activity.id}>
                                {activity.title}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Proposal Title (Optional)</Form.Label>
                          <Form.Control
                            name="upload_title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="Will use filename if empty"
                          />
                          <Form.Text className="text-muted">
                            Leave empty to use PDF filename as title
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="proposals-form-section">
                    <div className="proposals-form-section-title">
                      <i className="bi bi-file-pdf"></i>
                      Upload Proposal PDF
                    </div>
                    
                    {!selectedFile ? (
                      <div 
                        className="file-upload-area"
                        onClick={() => document.getElementById('file-input').click()}
                        onDrop={handleFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={(e) => e.target.classList.add('dragover')}
                        onDragLeave={(e) => e.target.classList.remove('dragover')}
                      >
                        <div className="file-upload-icon">
                          <i className="bi bi-cloud-upload"></i>
                        </div>
                        <div className="file-upload-text">
                          <h6>Click to browse or drag & drop</h6>
                          <p>Upload your proposal PDF file (Max 10MB)</p>
                        </div>
                        <input
                          id="file-input"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                        />
                      </div>
                    ) : (
                      <div className="file-upload-area file-selected">
                        <div className="file-upload-icon">
                          <i className="bi bi-check-circle"></i>
                        </div>
                        <div className="file-info">
                          <div className="file-details">
                            <div className="file-icon">
                              <i className="bi bi-file-pdf"></i>
                            </div>
                            <div className="file-meta">
                              <h6>{selectedFile.name}</h6>
                              <small>{formatFileSize(selectedFile.size)}</small>
                            </div>
                          </div>
                          <div className="file-actions">
                            <button
                              type="button"
                              className="btn-file-remove"
                              onClick={removeSelectedFile}
                              title="Remove file"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal} disabled={loading}>
              <i className="bi bi-x-circle me-2"></i>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading || 
                (activeTab === 'upload' && (!selectedFile || !formData.activity_id)) ||
                (activeTab === 'manual' && !formData.activity_id)
              }
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {editingProposal ? 'Update Proposal' : 'Create Proposal'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ProposalsTab;
