import React, { useState, useEffect } from 'react';
import { Modal, Nav, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

const AccountSettingsModal = ({ show, onHide }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    student_id: '',
    faculty: '',
    major: '',
    role: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const { user, isAdmin, updateProfile, changePassword } = useAuth();

  useEffect(() => {
    if (show) {
      fetchProfile();
    }
  }, [show]);

  const fetchProfile = async () => {
    try {
      setInitialLoading(true);
      const response = await authAPI.getProfile();
      setProfileData(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { email, role, student_id, ...updateData } = profileData;
      await updateProfile(updateData);
      
      setSuccess('Profile updated successfully!');
      
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveTab('profile');
    setError('');
    setSuccess('');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    onHide();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  if (initialLoading) {
    return (
      <Modal show={show} onHide={handleClose} size="lg" centered className="account-settings-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-gear"></i>
            Account Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">Loading account settings...</div>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="account-settings-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-person-gear"></i>
          Account Settings
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Navigation Pills */}
        <Nav variant="pills" className="justify-content-center account-settings-nav-pills">
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'profile'} 
              onClick={() => handleTabChange('profile')}
            >
              <i className="bi bi-person me-2"></i>
              Profile Information
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'password'} 
              onClick={() => handleTabChange('password')}
            >
              <i className="bi bi-shield-lock me-2"></i>
              Security & Password
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" className="mb-4" dismissible onClose={() => setError('')}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccess('')}>
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <Form onSubmit={handleProfileSubmit}>
            <div className="account-settings-form-section">
              <div className="account-settings-form-section-title">
                <i className="bi bi-person-badge"></i>
                Personal Information
              </div>
              
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="required">Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={profileData.username || ''}
                      onChange={handleProfileChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={profileData.email || ''}
                      placeholder="Email address"
                      disabled
                    />
                    <Form.Text>
                      <i className="bi bi-info-circle me-1"></i>
                      Email address cannot be changed
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={profileData.phone || ''}
                      onChange={handleProfileChange}
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Role</Form.Label>
                    <Form.Control
                      type="text"
                      value={profileData.role === 'admin' ? 'Administrator' : 'Student'}
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {!isAdmin() && (
              <div className="account-settings-form-section">
                <div className="account-settings-form-section-title">
                  <i className="bi bi-mortarboard"></i>
                  Academic Information
                </div>
                
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Student ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={profileData.student_id || ''}
                        disabled
                      />
                      <Form.Text>
                        <i className="bi bi-info-circle me-1"></i>
                        Student ID cannot be changed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Faculty</Form.Label>
                      <Form.Select
                        name="faculty"
                        value={profileData.faculty || ''}
                        onChange={handleProfileChange}
                      >
                        <option value="">Select Faculty</option>
                        <option value="Faculty of Computer Science">Faculty of Computer Science</option>
                        <option value="Faculty of Engineering">Faculty of Engineering</option>
                        <option value="Faculty of Business">Faculty of Business</option>
                        <option value="Faculty of Medicine">Faculty of Medicine</option>
                        <option value="Faculty of Arts">Faculty of Arts</option>
                        <option value="Faculty of Science">Faculty of Science</option>
                        <option value="Faculty of Law">Faculty of Law</option>
                        <option value="Faculty of Economics">Faculty of Economics</option>
                        <option value="Faculty of Social Sciences">Faculty of Social Sciences</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Major</Form.Label>
                      <Form.Control
                        type="text"
                        name="major"
                        value={profileData.major || ''}
                        onChange={handleProfileChange}
                        placeholder="Enter major/study program"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            )}

            <div className="d-flex justify-content-end">
              <Button 
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Form onSubmit={handlePasswordSubmit}>
            <div className="account-settings-form-section">
              <div className="account-settings-form-section-title">
                <i className="bi bi-shield-lock"></i>
                Change Password
              </div>
              
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="required">Current Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="required">New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="required">Confirm New Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Text className="text-warning d-block mt-3">
                <i className="bi bi-info-circle me-1"></i>
                Password must be at least 6 characters long
              </Form.Text>
            </div>

            <div className="d-flex justify-content-end">
              <Button 
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Changing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check me-2"></i>
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          <i className="bi bi-x-circle me-2"></i>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AccountSettingsModal;
