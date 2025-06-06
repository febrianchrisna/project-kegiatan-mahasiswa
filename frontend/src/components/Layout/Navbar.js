import React, { useState } from 'react';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AccountSettingsModal from '../Profile/AccountSettingsModal';

const AppNavbar = ({ onMobileSidebarToggle, showMobileSidebarToggle = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
    setShowAccountModal(true);
  };

  return (
    <>
      <Navbar 
        bg="dark" 
        variant="dark" 
        expand="lg" 
        className={`px-3 ${showMobileSidebarToggle ? 'dashboard-mobile-navbar' : ''}`}
      >
        <Navbar.Brand href="#home">
          <i className="bi bi-mortarboard me-2"></i>
          Student Activity Management
        </Navbar.Brand>
        
        {/* Desktop Navigation - Hide user dropdown on mobile when dashboard sidebar toggle is present */}
        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className={`d-lg-none ${showMobileSidebarToggle ? 'd-none' : ''}`}
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavDropdown 
              title={
                <span>
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.username || 'User'}
                </span>
              } 
              id="profile-dropdown"
              align="end"
              className={`${showMobileSidebarToggle ? 'd-none d-lg-block' : ''} nav-dropdown-user`}
            >
              <NavDropdown.Item onClick={handleProfileClick}>
                <i className="bi bi-person-gear me-2"></i>
                Account Settings
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      <AccountSettingsModal 
        show={showAccountModal} 
        onHide={() => setShowAccountModal(false)} 
      />
    </>
  );
};

export default AppNavbar;
