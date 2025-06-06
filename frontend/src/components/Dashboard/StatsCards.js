import React from 'react';

const StatsCards = ({ stats, loading = false, detailed = false }) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stats-card primary">
            <div className="stats-card-content">
              <div className="stats-card-info">
                <h6>Loading...</h6>
                <div className="stats-value">
                  <div className="loading-spinner" style={{ width: '30px', height: '30px' }}></div>
                </div>
                <div className="stats-subtitle">Fetching data...</div>
              </div>
              <div className="stats-card-icon">
                <i className="bi bi-hourglass-split"></i>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {/* Total Activities */}
      <div className="stats-card primary">
        <div className="stats-card-content">
          <div className="stats-card-info">
            <h6>Total Activities</h6>
            <div className="stats-value">{formatNumber(stats?.activities?.total || 0)}</div>
            <div className="stats-subtitle">All student activities</div>
          </div>
          <div className="stats-card-icon">
            <i className="bi bi-calendar-event"></i>
          </div>
        </div>
      </div>

      {/* Pending Activities */}
      <div className="stats-card warning">
        <div className="stats-card-content">
          <div className="stats-card-info">
            <h6>Pending Review</h6>
            <div className="stats-value">{formatNumber(stats?.activities?.pending || 0)}</div>
            <div className="stats-subtitle">Awaiting approval</div>
          </div>
          <div className="stats-card-icon">
            <i className="bi bi-clock-history"></i>
          </div>
        </div>
      </div>

      {/* Approved Activities */}
      <div className="stats-card success">
        <div className="stats-card-content">
          <div className="stats-card-info">
            <h6>Approved Activities</h6>
            <div className="stats-value">{formatNumber(stats?.activities?.approved || 0)}</div>
            <div className="stats-subtitle">Ready to execute</div>
          </div>
          <div className="stats-card-icon">
            <i className="bi bi-check-circle"></i>
          </div>
        </div>
      </div>

      {/* Total Users or Proposals based on detailed view */}
      {detailed ? (
        <div className="stats-card info">
          <div className="stats-card-content">
            <div className="stats-card-info">
              <h6>Total Proposals</h6>
              <div className="stats-value">{formatNumber(stats?.proposals?.total || 0)}</div>
              <div className="stats-subtitle">Activity proposals</div>
            </div>
            <div className="stats-card-icon">
              <i className="bi bi-file-earmark-text"></i>
            </div>
          </div>
        </div>
      ) : (
        <div className="stats-card danger">
          <div className="stats-card-content">
            <div className="stats-card-info">
              <h6>System Users</h6>
              <div className="stats-value">{formatNumber(stats?.users?.total || 0)}</div>
              <div className="stats-subtitle">
                {stats?.users?.students || 0} Students • {stats?.users?.admins || 0} Admins
              </div>
            </div>
            <div className="stats-card-icon">
              <i className="bi bi-people"></i>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCards;
