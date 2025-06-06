import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AccountSettingsModal from '../Profile/AccountSettingsModal';

const Sidebar = ({ activeTab, setActiveTab, isOpen, toggleSidebar }) => {
  const { isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAccountModal, setShowAccountModal] = useState(false);

  const menuItems = [
    { key: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard', forAll: true },
    { key: 'activities', icon: 'bi-calendar-event', label: 'Activities', forAll: true },
    { key: 'proposals', icon: 'bi-file-earmark-text', label: 'Proposals', forAll: true },
    { key: 'users', icon: 'bi-people', label: 'Users', adminOnly: true },
    { key: 'stats', icon: 'bi-graph-up', label: 'Statistics', adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => 
    item.forAll || (item.adminOnly && isAdmin())
  );

  const handleItemClick = (item) => {
    if (item.isExternal) {
      navigate('/profile');
    } else {
      setActiveTab(item.key);
    }
    
    // Close sidebar on mobile after selection
    if (window.innerWidth <= 991) {
      toggleSidebar();
    }
  };

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
    // Close sidebar on mobile after clicking profile
    if (window.innerWidth <= 991) {
      toggleSidebar();
    }
  };

  const getUserInitials = (username) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`sidebar d-none d-lg-block ${isOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <i className="bi bi-mortarboard-fill text-white"></i>
            </div>
            <div className="sidebar-brand-text">
              <h5>{isAdmin() ? 'Admin Panel' : 'Student Portal'}</h5>
              <small>{isAdmin() ? 'Management Dashboard' : 'Activity Center'}</small>
            </div>
          </div>
        </div>
        
        <div className="sidebar-nav">
          {filteredItems.map(item => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <i className={item.icon}></i>
              <span className="mobile-hidden">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`dashboard-mobile-sidebar-overlay ${isOpen ? 'show' : ''} d-lg-none`}
        onClick={toggleSidebar}
      />

      {/* Mobile Sidebar */}
      <div className={`dashboard-mobile-sidebar-container ${isOpen ? 'show' : ''} d-lg-none`}>
        <div className="dashboard-mobile-sidebar-header">
          <button 
            className="dashboard-mobile-sidebar-close"
            onClick={toggleSidebar}
            aria-label="Close Sidebar"
          >
            <i className="bi bi-x-lg"></i>
          </button>
          
          <div className="dashboard-mobile-sidebar-brand">
            <div className="dashboard-mobile-sidebar-brand-icon">
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <div className="dashboard-mobile-sidebar-brand-text">
              <h5>{isAdmin() ? 'Admin Panel' : 'Student Portal'}</h5>
              <small>{isAdmin() ? 'Management Dashboard' : 'Activity Center'}</small>
            </div>
          </div>
        </div>
        
        <div className="dashboard-mobile-sidebar-nav">
          {filteredItems.map(item => (
            <button
              key={item.key}
              className={`dashboard-mobile-sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile User Section */}
        <div className="dashboard-mobile-sidebar-user-section">
          <div className="dashboard-mobile-sidebar-user-info">
            <div className="dashboard-mobile-sidebar-user-avatar">
              {getUserInitials(user?.username)}
            </div>
            <div className="dashboard-mobile-sidebar-user-details">
              <h6>{user?.username || 'User'}</h6>
              <small>{user?.email || 'user@example.com'}</small>
            </div>
          </div>
          
          <div className="dashboard-mobile-sidebar-user-actions">
            <button
              className="dashboard-mobile-sidebar-user-action"
              onClick={handleProfileClick}
            >
              <i className="bi bi-person-gear"></i>
              Account Settings
            </button>
            <button
              className="dashboard-mobile-sidebar-user-action logout"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      <AccountSettingsModal 
        show={showAccountModal} 
        onHide={() => setShowAccountModal(false)} 
      />
    </>
  );
};

export default Sidebar;
