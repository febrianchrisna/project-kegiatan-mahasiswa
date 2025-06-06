import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Layout/Sidebar';
import DashboardNavbar from './DashboardNavbar';
import StatsCards from './StatsCards';
import ActivitiesTab from './ActivitiesTab';
import ProposalsTab from './ProposalsTab';
import UsersTab from './UsersTab';
import api from '../../services/api';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    activities: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0
    },
    proposals: {
      total: 0,
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0
    },
    users: {
      total: 0,
      admins: 0,
      students: 0
    }
  });
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 991) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch activities stats
      const activitiesStatsResponse = await api.get('/admin/activities/stats');
      
      // Fetch proposals stats  
      const proposalsStatsResponse = await api.get('/admin/proposals/stats');
      
      // Fetch users data
      const usersResponse = await api.get('/admin/users');
      
      const usersData = usersResponse.data.data;
      const userStats = {
        total: usersData.length,
        admins: usersData.filter(user => user.role === 'admin').length,
        students: usersData.filter(user => user.role === 'user').length
      };

      setStats({
        activities: activitiesStatsResponse.data.data,
        proposals: proposalsStatsResponse.data.data,
        users: userStats
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin()) {
      fetchDashboardStats();
    }
  }, [isAdmin, fetchDashboardStats]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="fade-in">
            <div className="content-header">
              <div className="content-header-top">
                <div>
                  <h1>Student Activity Dashboard</h1>
                  <p className="content-breadcrumb">Home • Dashboard • Overview</p>
                </div>
              </div>
            </div>
            
            {isAdmin() && <StatsCards stats={stats} loading={loading} />}
            
            <div className="content-grid">
              <div className="content-card hover-card">
                <div className="content-card-header">
                  <div className="content-card-header-content">
                    <div className="content-card-icon primary">
                      <i className="bi bi-calendar-event"></i>
                    </div>
                    <div className="content-card-text">
                      <h5>Activity Management</h5>
                      <p>Create, view and manage student activities</p>
                    </div>
                  </div>
                </div>
                <div className="content-card-body">
                  <button 
                    className="content-card-button"
                    onClick={() => setActiveTab('activities')}
                  >
                    <i className="bi bi-arrow-right"></i>
                    Manage Activities
                  </button>
                </div>
              </div>
              
              <div className="content-card hover-card">
                <div className="content-card-header">
                  <div className="content-card-header-content">
                    <div className="content-card-icon success">
                      <i className="bi bi-file-earmark-text"></i>
                    </div>
                    <div className="content-card-text">
                      <h5>Proposal System</h5>
                      <p>Submit and track activity proposals</p>
                    </div>
                  </div>
                </div>
                <div className="content-card-body">
                  <button 
                    className="content-card-button"
                    onClick={() => setActiveTab('proposals')}
                  >
                    <i className="bi bi-arrow-right"></i>
                    View Proposals
                  </button>
                </div>
              </div>

              {isAdmin() && (
                <div className="content-card hover-card">
                  <div className="content-card-header">
                    <div className="content-card-header-content">
                      <div className="content-card-icon" style={{ backgroundColor: 'var(--warning-orange)' }}>
                        <i className="bi bi-people"></i>
                      </div>
                      <div className="content-card-text">
                        <h5>User Management</h5>
                        <p>Manage students and administrators</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-card-body">
                    <button 
                      className="content-card-button"
                      onClick={() => setActiveTab('users')}
                    >
                      <i className="bi bi-arrow-right"></i>
                      Manage Users
                    </button>
                  </div>
                </div>
              )}

              {isAdmin() && (
                <div className="content-card hover-card">
                  <div className="content-card-header">
                    <div className="content-card-header-content">
                      <div className="content-card-icon" style={{ backgroundColor: 'var(--danger-red)' }}>
                        <i className="bi bi-graph-up"></i>
                      </div>
                      <div className="content-card-text">
                        <h5>Analytics & Reports</h5>
                        <p>View detailed statistics and reports</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-card-body">
                    <button 
                      className="content-card-button"
                      onClick={() => setActiveTab('stats')}
                    >
                      <i className="bi bi-arrow-right"></i>
                      View Analytics
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'activities':
        return <ActivitiesTab />;
      case 'proposals':
        return <ProposalsTab />;
      case 'users':
        return <UsersTab />;
      case 'stats':
        return (
          <div className="fade-in">
            <div className="content-header">
              <div className="content-header-top">
                <div>
                  <h1>Analytics & Statistics</h1>
                  <p className="content-breadcrumb">Dashboard • Analytics</p>
                </div>
              </div>
            </div>
            <StatsCards stats={stats} loading={loading} detailed={true} />
            
            {/* Additional Stats Cards for Analytics */}
            <div className="content-grid">
              <div className="content-card">
                <div className="content-card-header">
                  <div className="content-card-header-content">
                    <div className="content-card-icon primary">
                      <i className="bi bi-calendar-check"></i>
                    </div>
                    <div className="content-card-text">
                      <h5>Activity Performance</h5>
                      <p>Track activity completion and success rates</p>
                    </div>
                  </div>
                </div>
                <div className="content-card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="text-center p-3">
                        <h4 className="text-success">{stats.activities.completed || 0}</h4>
                        <small className="text-white">Completed Activities</small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="text-center p-3">
                        <h4 className="text-danger">{stats.activities.rejected || 0}</h4>
                        <small className="text-white">Rejected Activities</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="content-card">
                <div className="content-card-header">
                  <div className="content-card-header-content">
                    <div className="content-card-icon success">
                      <i className="bi bi-file-earmark-check"></i>
                    </div>
                    <div className="content-card-text">
                      <h5>Proposal Analytics</h5>
                      <p>Monitor proposal submission and approval trends</p>
                    </div>
                  </div>
                </div>
                <div className="content-card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="text-center p-2">
                        <h5 className="text-warning">{stats.proposals.draft || 0}</h5>
                        <small className="text-white">Draft</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-2">
                        <h5 className="text-info">{stats.proposals.submitted || 0}</h5>
                        <small className="text-white">Submitted</small>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-2">
                        <h5 className="text-success">{stats.proposals.approved || 0}</h5>
                        <small className="text-white">Approved</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Content for {activeTab}</div>;
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Sidebar Toggle - Positioned at top-right on mobile */}
      <button 
        className="dashboard-mobile-sidebar-toggle d-lg-none"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        <i className="bi bi-list"></i>
      </button>


      <div className={`sidebar-container ${sidebarOpen ? 'show' : ''}`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      </div>
      
      <div className="main-content-container dashboard-main-content-container">
        <DashboardNavbar 
          onMobileSidebarToggle={toggleSidebar}
          showMobileSidebarToggle={true}
        />
        <div className="main-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
