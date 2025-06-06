import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <div className="auth-card auth-fade-in">
              <div className="auth-card-body">
                <div className="auth-header">
                  <div className="auth-header-icon">
                    <i className="bi bi-mortarboard-fill"></i>
                  </div>
                  <h1 className="auth-header-title">Welcome Back</h1>
                  <p className="auth-header-subtitle">Sign in to your account</p>
                </div>

                {error && (
                  <div className="auth-alert auth-alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="auth-form-group">
                    <label className="auth-form-label required">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="auth-form-control form-control"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div className="auth-form-group">
                    <label className="auth-form-label required">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="auth-form-control form-control"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="auth-btn-primary btn w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="auth-loading-spinner d-inline-block"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p className="auth-footer-text">
                    Don't have an account?{' '}
                    <Link to="/register" className="auth-footer-link">
                      Register as Student
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

export default Login;
