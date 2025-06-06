import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { isAdmin } = useAuth();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      roles: ['admin', 'user']
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: 'bi-calendar-event',
      roles: ['admin', 'user']
    },
    {
      id: 'proposals',
      label: 'Proposals',
      icon: 'bi-file-earmark-text',
      roles: ['admin', 'user']
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'bi-people',
      roles: ['admin']
    },
    {
      id: 'stats',
      label: 'Analytics',
      icon: 'bi-graph-up',
      roles: ['admin']
    }
  ];

  const filteredItems = navigationItems.filter(item => {
    if (isAdmin()) {
      return item.roles.includes('admin');
    }
    return item.roles.includes('user');
  });

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <i className="bi bi-mortarboard text-white"></i>
          </div>
          <div className="sidebar-brand-text">
            <h5>Student Portal</h5>
            <small>Activity Management</small>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <i className={`bi ${item.icon}`}></i>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-help">
          <i className="bi bi-question-circle"></i>
          <small>Need help? Contact administrator for support.</small>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
