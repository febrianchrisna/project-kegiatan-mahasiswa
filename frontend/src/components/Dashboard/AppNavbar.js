import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AppNavbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <nav className="top-navbar">
      <div className="navbar-brand-main">
        <i className="bi bi-grid-3x3-gap"></i>
        Student Activity Management
      </div>

      <div className="navbar-actions">
        <div className="navbar-notification">
          <i className="bi bi-bell"></i>
        </div>

        <div className="navbar-user dropdown">
          <div 
            className="d-flex align-items-center" 
            data-bs-toggle="dropdown" 
            aria-expanded="false"
            style={{ cursor: 'pointer' }}
          >
            <div className="user-info">
              <div className="user-name">{user?.username || 'User'}</div>
              <div className="user-role">
                {user?.role === 'admin' ? 'Administrator' : 'Student'}
              </div>
            </div>
            <div className="user-avatar">
              {getInitials(user?.username)}
            </div>
          </div>

          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button className="dropdown-item" type="button">
                <i className="bi bi-person"></i>
                Profile
              </button>
            </li>
            <li>
              <button className="dropdown-item" type="button">
                <i className="bi bi-gear"></i>
                Settings
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button 
                className="dropdown-item text-danger" 
                type="button"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
