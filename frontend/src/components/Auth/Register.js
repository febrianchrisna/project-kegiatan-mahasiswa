import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    student_id: '',
    faculty: '',
    major: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSubmit } = formData;
      
      const response = await register(dataToSubmit, false); // Always register as student
      
      setSuccess('Student registered successfully!');
      
      // Clear form
      setFormData({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        student_id: '',
        faculty: '',
        major: '',
        phone: ''
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={11} md={10} lg={8} xl={7}>
            <div className="auth-card auth-fade-in">
              <div className="auth-card-body">
                <div className="auth-header">
                  <div className="auth-header-icon">
                    <i className="bi bi-person-plus-fill"></i>
                  </div>
                  <h1 className="auth-header-title">Create Student Account</h1>
                  <p className="auth-header-subtitle">Join our student activity management system</p>
                </div>

                {error && (
                  <div className="auth-alert auth-alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="auth-alert auth-alert-success">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                  </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-form-label required">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="auth-form-control form-control"
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-form-label required">Full Name</label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleChange}
                          className="auth-form-control form-control"
                          placeholder="Enter full name"
                          required
                        />
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-form-label required">Password</label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="auth-form-control form-control"
                          placeholder="Enter password"
                          required
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-form-label required">Confirm Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="auth-form-control form-control"
                          placeholder="Confirm password"
                          required
                        />
                      </div>
                    </Col>
                  </Row>

                  <div className="auth-form-group">
                    <label className="auth-form-label">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="auth-form-control form-control"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="auth-form-group">
                    <label className="auth-form-label required">Student ID</label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      className="auth-form-control form-control"
                      placeholder="Enter student ID"
                      required
                    />
                  </div>

                  <Row>
                    <Col md={6}>
                      <div className="auth-form-group">
                        <label className="auth-form-label required">Faculty</label>
                        <select
                          name="faculty"
                          value={formData.faculty}
                          onChange={handleChange}
                          className="auth-form-select form-select"
                          required
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
                      <div className="auth-form-group">
                        <label className="auth-form-label required">Major</label>
                        <input
                          type="text"
                          name="major"
                          value={formData.major}
                          onChange={handleChange}
                          className="auth-form-control form-control"
                          placeholder="Enter major/study program"
                          required
                        />
                      </div>
                    </Col>
                  </Row>

                  <button 
                    type="submit" 
                    className="auth-btn-primary btn w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="auth-loading-spinner d-inline-block"></div>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus me-2"></i>
                        Create Student Account
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p className="auth-footer-text">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-footer-link">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
