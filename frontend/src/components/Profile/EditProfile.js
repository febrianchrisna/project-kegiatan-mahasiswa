import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import AppNavbar from '../Layout/Navbar';

const EditProfile = () => {
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
  const { user, isAdmin, updateProfile, changePassword } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfileData(response.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      fetchProfile();
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

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
      <AppNavbar />
      
      <Container fluid className="py-5">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <div className="fade-in">
              {/* Header Section */}
              <div className="text-center mb-5">
                <h1 className="display-6 text-white fw-bold mb-2">Account Settings</h1>
                <p className="text-white-50 mb-0">Profile • Settings • Configuration</p>
              </div>

              {/* Main Content Card */}
              <Card className="shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
                <Card.Header className="border-0 bg-transparent p-4">
                  <div className="d-flex align-items-center">
                    <div className="profile-icon-large me-3">
                      <i className="bi bi-person-gear"></i>
                    </div>
                    <div>
                      <h4 className="text-white mb-1 fw-bold">Profile Management</h4>
                      <p className="text-white-50 mb-0">Manage your account information and security settings</p>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body className="p-4">
                  {/* Navigation Pills */}
                  <div className="profile-nav-container mb-4">
                    <Nav variant="pills" className="profile-nav-pills">
                      <Nav.Item>
                        <Nav.Link 
                          active={activeTab === 'profile'} 
                          onClick={() => {
                            setActiveTab('profile');
                            setError('');
                            setSuccess('');
                          }}
                          className="nav-pill-custom"
                        >
                          <i className="bi bi-person me-2"></i>
                          Profile Information
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link 
                          active={activeTab === 'password'} 
                          onClick={() => {
                            setActiveTab('password');
                            setError('');
                            setSuccess('');
                          }}
                          className="nav-pill-custom"
                        >
                          <i className="bi bi-shield-lock me-2"></i>
                          Security & Password
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </div>

                  {/* Alerts */}
                  {error && (
                    <Alert variant="danger" className="custom-alert alert-danger-custom mb-4">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert variant="success" className="custom-alert alert-success-custom mb-4">
                      <i className="bi bi-check-circle me-2"></i>
                      {success}
                    </Alert>
                  )}

                  {/* Profile Information Tab */}
                  {activeTab === 'profile' && (
                    <Form onSubmit={handleProfileSubmit}>
                      {/* Personal Information Section */}
                      <div className="form-section-custom mb-4">
                        <div className="section-header mb-3">
                          <h5 className="text-white mb-1">
                            <i className="bi bi-person-badge me-2"></i>
                            Personal Information
                          </h5>
                          <p className="text-white-50 small mb-0">Update your basic personal details</p>
                        </div>
                        
                        <Row className="g-3">
                          <Col md={6}>
                            <div className="form-group-custom">
                              <label className="form-label-custom">Full Name</label>
                              <input
                                type="text"
                                name="username"
                                value={profileData.username}
                                onChange={handleProfileChange}
                                className="form-control-custom"
                                placeholder="Enter your full name"
                                required
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="form-group-custom">
                              <label className="form-label-custom">Email Address</label>
                              <input
                                type="email"
                                value={profileData.email}
                                className="form-control-custom form-control-disabled"
                                placeholder="Email address"
                                disabled
                              />
                              <small className="form-text-custom">
                                <i className="bi bi-info-circle me-1"></i>
                                Email address cannot be changed
                              </small>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="form-group-custom">
                              <label className="form-label-custom">Phone Number</label>
                              <input
                                type="tel"
                                name="phone"
                                value={profileData.phone || ''}
                                onChange={handleProfileChange}
                                className="form-control-custom"
                                placeholder="Enter phone number"
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="form-group-custom">
                              <label className="form-label-custom">Role</label>
                              <input
                                type="text"
                                value={profileData.role === 'admin' ? 'Administrator' : 'Student'}
                                className="form-control-custom form-control-disabled"
                                disabled
                              />
                            </div>
                          </Col>
                        </Row>
                      </div>

                      {/* Academic Information Section - Only for Students */}
                      {!isAdmin() && (
                        <div className="form-section-custom mb-4">
                          <div className="section-header mb-3">
                            <h5 className="text-white mb-1">
                              <i className="bi bi-mortarboard me-2"></i>
                              Academic Information
                            </h5>
                            <p className="text-white-50 small mb-0">Your academic details and enrollment information</p>
                          </div>
                          
                          <Row className="g-3">
                            <Col md={12}>
                              <div className="form-group-custom">
                                <label className="form-label-custom">Student ID</label>
                                <input
                                  type="text"
                                  value={profileData.student_id || ''}
                                  className="form-control-custom form-control-disabled"
                                  disabled
                                />
                                <small className="form-text-custom">
                                  <i className="bi bi-info-circle me-1"></i>
                                  Student ID cannot be changed
                                </small>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="form-group-custom">
                                <label className="form-label-custom">Faculty</label>
                                <select
                                  name="faculty"
                                  value={profileData.faculty || ''}
                                  onChange={handleProfileChange}
                                  className="form-control-custom"
                                >
                                  <option value="">Select Faculty</option>
                                  <option value="Faculty of Computer Science">Faculty of Computer Science</option>
                                  <option value="Faculty of Engineering">Faculty of Engineering</option>
                                  <option value="Faculty of Business">Faculty of Business</option>
                                  <option value="Faculty of Medicine">Faculty of Medicine</option>
                                  <option value="Faculty of Arts">Faculty of Arts</option>
                                  <option value="Faculty of Science">Faculty of Science</option>
                                </select>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="form-group-custom">
                                <label className="form-label-custom">Major</label>
                                <input
                                  type="text"
                                  name="major"
                                  value={profileData.major || ''}
                                  onChange={handleProfileChange}
                                  className="form-control-custom"
                                  placeholder="Enter major/study program"
                                />
                              </div>
                            </Col>
                          </Row>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="d-flex justify-content-end pt-3">
                        <Button 
                          type="submit" 
                          className="btn-custom-primary"
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
                              Update Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  )}

                  {/* Password Tab */}
                  {activeTab === 'password' && (
                    <Form onSubmit={handlePasswordSubmit}>
                      <div className="form-section-custom mb-4">
                        <div className="section-header mb-3">
                          <h5 className="text-white mb-1">
                            <i className="bi bi-shield-lock me-2"></i>
                            Change Password
                          </h5>
                          <p className="text-white-50 small mb-0">Update your account password for security</p>
                        </div>
                        
                        <Row className="g-3">
                          <Col md={12}>
                            <div className="form-group-custom">
                              <label className="form-label-custom">Current Password</label>
                              <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="form-control-custom"
                                placeholder="Enter current password"
                                required
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="form-group-custom">
                              <label className="form-label-custom">New Password</label>
                              <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="form-control-custom"
                                placeholder="Enter new password"
                                required
                              />
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="form-group-custom">
                              <label className="form-label-custom">Confirm New Password</label>
                              <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="form-control-custom"
                                placeholder="Confirm new password"
                                required
                              />
                            </div>
                          </Col>
                        </Row>

                        <div className="password-requirements mt-3">
                          <small className="text-warning">
                            <i className="bi bi-info-circle me-1"></i>
                            Password must be at least 6 characters long
                          </small>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex justify-content-end pt-3">
                        <Button 
                          type="submit" 
                          className="btn-custom-primary"
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
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EditProfile;
