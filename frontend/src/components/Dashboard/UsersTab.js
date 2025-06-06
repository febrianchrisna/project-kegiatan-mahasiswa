import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Alert, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import api, { authAPI } from '../../services/api';

const UsersTab = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    student_id: '',
    faculty: '',
    major: '',
    phone: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/admin/users');
      
      if (response.data) {
        const users = response.data.data || response.data;
        setUsers(Array.isArray(users) ? users : []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch users';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [fetchUsers, isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const submitData = isAdminRegistration 
        ? {
            email: formData.email,
            username: formData.username,
            password: formData.password,
            phone: formData.phone
          }
        : {
            email: formData.email,
            username: formData.username,
            password: formData.password,
            student_id: formData.student_id,
            faculty: formData.faculty,
            major: formData.major,
            phone: formData.phone
          };
      
      if (isAdminRegistration) {
        await authAPI.registerAdmin(submitData);
      } else {
        await authAPI.registerStudent(submitData);
      }
      
      setSuccess(`${isAdminRegistration ? 'Admin' : 'Student'} registered successfully`);
      
      setShowModal(false);
      resetForm();
      await fetchUsers();
    } catch (error) {
      console.error('Error registering user:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      student_id: '',
      faculty: '',
      major: '',
      phone: ''
    });
  };

  const openModal = (adminRegistration = false) => {
    setIsAdminRegistration(adminRegistration);
    resetForm();
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsAdminRegistration(false);
    resetForm();
    setError('');
    setSuccess('');
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      user: 'primary'
    };
    const labels = {
      admin: 'Admin',
      user: 'Student'
    };
    return <Badge bg={variants[role] || 'secondary'}>{labels[role] || role}</Badge>;
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

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="fade-in">
        <Alert variant="danger">
          <i className="bi bi-shield-exclamation"></i>
          Access denied. Administrator privileges required.
        </Alert>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="content-header">
        <div className="content-header-top">
          <div>
            <h1>User Management</h1>
            <p className="content-breadcrumb">Dashboard • Users • Administration</p>
          </div>
          <div className="users-header-actions">
            <button 
              className="btn-add-student"
              onClick={() => {
                setIsAdminRegistration(false);
                setShowModal(true);
              }}
            >
              <i className="bi bi-person-plus"></i>
              Add Student
            </button>
            <button 
              className="btn-add-admin"
              onClick={() => {
                setIsAdminRegistration(true);
                setShowModal(true);
              }}
            >
              <i className="bi bi-shield-plus"></i>
              Add Admin
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
              <i className="bi bi-people"></i>
            </div>
            <div className="content-card-text">
              <h5>System Users</h5>
              <p>Manage students and administrators</p>
            </div>
          </div>
        </div>
        <div className="content-card-body" style={{ padding: 0 }}>
          <Table responsive className="table-hover">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Academic Info</th>
                <th>Contact</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    <div className="loading-spinner"></div>
                    <div className="mt-2">Loading users...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-4">
                    <div className="empty-state">
                      <i className="bi bi-people"></i>
                      <h5>No Users Found</h5>
                      <p>Start by adding your first user</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="User Details">
                      <div>
                        <strong>{user.username}</strong>
                        <br />
                        <small className="text-muted">{user.email}</small>
                        {user.student_id && (
                          <>
                            <br />
                            <small className="text-info">ID: {user.student_id}</small>
                          </>
                        )}
                      </div>
                    </td>
                    <td data-label="Role">{getRoleBadge(user.role)}</td>
                    <td data-label="Academic Info">
                      {user.faculty ? (
                        <div>
                          <small className="d-block">{user.faculty}</small>
                          <small className="text-muted">{user.major}</small>
                        </div>
                      ) : (
                        <small className="text-muted">N/A</small>
                      )}
                    </td>
                    <td data-label="Contact">
                      <small>{user.phone || 'N/A'}</small>
                    </td>
                    <td data-label="Registered">
                      <small>{formatDate(user.createdAt)}</small>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* User Registration Modal */}
      <Modal show={showModal} onHide={closeModal} size="lg" centered className="users-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className={`bi ${isAdminRegistration ? 'bi-shield-plus' : 'bi-person-plus'}`}></i>
            {isAdminRegistration ? 'Add New Admin' : 'Add New Student'}
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
            
            <div className="users-form-section">
              <div className="users-form-section-title">
                <i className="bi bi-person-badge"></i>
                Personal Information
              </div>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="required">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      placeholder="Enter email address"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="required">Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                      placeholder="Enter full name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="required">Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      placeholder="Enter password"
                      minLength={6}
                    />
                    <Form.Text>
                      Minimum 6 characters
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
            
            {!isAdminRegistration && (
              <div className="users-form-section">
                <div className="users-form-section-title">
                  <i className="bi bi-mortarboard"></i>
                  Academic Information
                </div>
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="required">Student ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.student_id}
                        onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                        required
                        placeholder="Enter student ID"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="required">Faculty</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.faculty}
                        onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                        required
                        placeholder="e.g., Faculty of Computer Science"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="required">Major</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.major}
                        onChange={(e) => setFormData({...formData, major: e.target.value})}
                        required
                        placeholder="e.g., Information Technology"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}
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
                  Registering...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {`Add ${isAdminRegistration ? 'Admin' : 'Student'}`}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersTab;
