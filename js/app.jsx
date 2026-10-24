/**
 * JanNetra - Civic Issue Management Portal
 * Core React Application Logic (Academic Evaluation Project)
 * Uses React 18, Hooks (useState, useEffect, useMemo), LocalStorage & Custom CSS
 */

const { useState, useEffect, useMemo, useRef } = React;

// Main App Component
function App() {
  // --- Persistent State ---
  const [issues, setIssues] = useState(() => window.JanNetraData.getStoredIssues());
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem('jannetra_admin_mode') === 'true';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('jannetra_theme') || 'light';
  });

  // --- Filter & Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // --- UI Modal State ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIssueForDetails, setSelectedIssueForDetails] = useState(null);
  const [toasts, setToasts] = useState([]);

  const searchInputRef = useRef(null);

  // Synchronize Theme with Document Attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jannetra_theme', theme);
  }, [theme]);

  // Persist Admin Mode
  useEffect(() => {
    localStorage.setItem('jannetra_admin_mode', isAdminMode);
  }, [isAdminMode]);

  // Persist Issues to LocalStorage whenever modified
  useEffect(() => {
    window.JanNetraData.saveStoredIssues(issues);
  }, [issues]);

  // Keyboard Shortcuts (e.g., Focus search with '/' or Escape to close modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !isReportModalOpen && !selectedIssueForDetails) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsReportModalOpen(false);
        setSelectedIssueForDetails(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReportModalOpen, selectedIssueForDetails]);

  // Toast Notification Dispatcher
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Toggle Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Reset to Sample Mock Data
  const handleResetData = () => {
    if (window.confirm('Reset all issues to default academic sample dataset? Any newly added grievances will be restored.')) {
      const reset = window.JanNetraData.resetToDefaultIssues();
      setIssues(reset);
      showToast('Grievance database reset to default sample dataset', 'warning');
    }
  };

  // Status Change Handler (Admin & Workflow Action)
  const handleUpdateStatus = (issueId, newStatus, customNote = '') => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          const timestamp = new Date().toISOString();
          const noteText = customNote || (
            newStatus === 'Resolved'
              ? 'Issue inspected and resolved by municipal field team.'
              : newStatus === 'In Progress'
              ? 'Work order issued; inspection & repair scheduled.'
              : 'Grievance placed back in pending queue for reassessment.'
          );

          const updatedTimeline = [
            ...(issue.timeline || []),
            { status: newStatus, timestamp, note: noteText }
          ];

          return {
            ...issue,
            status: newStatus,
            timeline: updatedTimeline,
            adminNotes: customNote || issue.adminNotes
          };
        }
        return issue;
      })
    );

    // If modal is open for this issue, update selected issue state
    if (selectedIssueForDetails && selectedIssueForDetails.id === issueId) {
      setSelectedIssueForDetails((prev) => ({
        ...prev,
        status: newStatus,
        timeline: [
          ...(prev.timeline || []),
          { status: newStatus, timestamp: new Date().toISOString(), note: customNote || `Status changed to ${newStatus}` }
        ]
      }));
    }

    showToast(`Issue ${issueId} updated to "${newStatus}"`, 'success');
  };

  // Upvote Toggle Handler
  const handleToggleUpvote = (issueId) => {
    setIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue.id === issueId) {
          const currentlyUpvoted = issue.hasUpvoted;
          const delta = currentlyUpvoted ? -1 : 1;
          const updatedUpvotes = Math.max(0, (issue.upvotes || 0) + delta);
          showToast(currentlyUpvoted ? 'Upvote removed' : 'Civic grievance upvoted!', currentlyUpvoted ? 'info' : 'success');
          return {
            ...issue,
            upvotes: updatedUpvotes,
            hasUpvoted: !currentlyUpvoted
          };
        }
        return issue;
      })
    );
  };

  // Create New Issue Handler
  const handleCreateIssue = (newIssueData) => {
    const timestamp = new Date().toISOString();
    const trackingId = `JN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIssue = {
      id: trackingId,
      title: newIssueData.title.trim(),
      category: newIssueData.category,
      priority: newIssueData.priority,
      location: newIssueData.location.trim(),
      ward: newIssueData.ward.trim() || 'Ward Unassigned',
      description: newIssueData.description.trim(),
      reportedBy: newIssueData.reportedBy.trim() || 'Anonymous Citizen',
      dateReported: timestamp,
      status: 'Pending',
      upvotes: 1,
      hasUpvoted: true,
      imageUrl: newIssueData.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      assignedDept: newIssueData.assignedDept || 'Municipal Triage Cell',
      adminNotes: 'Registered into public municipal grievance index.',
      timeline: [
        {
          status: 'Pending',
          timestamp,
          note: 'Civic grievance registered by citizen with geo-tag'
        }
      ]
    };

    setIssues((prev) => [newIssue, ...prev]);
    setIsReportModalOpen(false);
    showToast(`Grievance #${trackingId} registered successfully!`, 'success');
  };

  // Export Grievance Report as CSV
  const handleExportCSV = () => {
    const headers = ['Grievance ID', 'Title', 'Category', 'Priority', 'Status', 'Location', 'Reported Date', 'Upvotes', 'Department'];
    const rows = issues.map((i) => [
      `"${i.id}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.priority}"`,
      `"${i.status}"`,
      `"${i.location.replace(/"/g, '""')}"`,
      `"${new Date(i.dateReported).toLocaleDateString()}"`,
      i.upvotes || 0,
      `"${i.assignedDept || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `JanNetra_Grievances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Civic Grievances report downloaded as CSV', 'info');
  };

  // Filter & Search Computation (Memoized)
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        // Status filter
        if (statusFilter !== 'All' && issue.status !== statusFilter) {
          return false;
        }
        // Category filter
        if (categoryFilter !== 'All' && issue.category !== categoryFilter) {
          return false;
        }
        // Search query filter (matches title, description, location, tracking id, or department)
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = issue.title.toLowerCase().includes(q);
          const matchDesc = issue.description.toLowerCase().includes(q);
          const matchLoc = issue.location.toLowerCase().includes(q);
          const matchId = issue.id.toLowerCase().includes(q);
          const matchDept = (issue.assignedDept || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc && !matchId && !matchDept) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.dateReported) - new Date(a.dateReported);
        }
        if (sortBy === 'oldest') {
          return new Date(a.dateReported) - new Date(b.dateReported);
        }
        if (sortBy === 'upvotes') {
          return (b.upvotes || 0) - (a.upvotes || 0);
        }
        if (sortBy === 'urgency') {
          const priorityWeights = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
        }
        return 0;
      });
  }, [issues, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Statistics Counters (Memoized)
  const stats = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter((i) => i.status === 'Pending').length;
    const inProgress = issues.filter((i) => i.status === 'In Progress').length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, pending, inProgress, resolved, resolutionRate };
  }, [issues]);

  return (
    <div className="app-root">
      {/* 1. Sticky Navigation Header */}
      <Header
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onResetData={handleResetData}
      />

      <main className="container">
        {/* Admin Mode Elevated Privileges Banner */}
        {isAdminMode && (
          <aside className="admin-status-banner" role="status">
            <div className="admin-banner-left">
              <span className="admin-banner-icon">🛡️</span>
              <div className="admin-banner-text">
                <strong>Municipal Authority Admin Mode Active</strong>
                <p>You have elevated privileges to modify grievance statuses, update work progress, and record inspection remarks.</p>
              </div>
            </div>
            <button
              type="button"
              className="admin-banner-exit-btn"
              onClick={() => setIsAdminMode(false)}
            >
              Exit to Citizen View
            </button>
          </aside>
        )}

        {/* 2. Hero & Analytics Dashboard Banner */}
        <section className="dashboard-hero" aria-label="Civic Analytics Overview">
          <div className="hero-banner-content">
            <div className="hero-title-group">
              <h1>Civic Grievance Redressal Portal</h1>
              <p>
                Real-time citizen reporting & municipal department tracking system.
                Empowering urban governance with transparency and accountability.
              </p>
            </div>
            <div className="hero-quick-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleExportCSV}
                title="Download CSV database report"
              >
                <span>📊 Export CSV</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => window.print()}
                title="Print official municipal summary"
              >
                <span>🖨️ Print Report</span>
              </button>
            </div>
          </div>

          {/* Metric Counter Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-total">📋</div>
              <div className="stat-details">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Grievances</span>
                <span className="stat-subtext">Registered across wards</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-pending">⏳</div>
              <div className="stat-details">
                <span className="stat-value">{stats.pending}</span>
                <span className="stat-label">Pending Verification</span>
                <span className="stat-subtext">Awaiting field inspection</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-progress">🛠️</div>
              <div className="stat-details">
                <span className="stat-value">{stats.inProgress}</span>
                <span className="stat-label">In Progress</span>
                <span className="stat-subtext">Work order assigned</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-resolved">✅</div>
              <div className="stat-details">
                <span className="stat-value">{stats.resolved}</span>
                <span className="stat-label">Resolved ({stats.resolutionRate}%)</span>
                <span className="stat-subtext">Inspected & cleared</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Search, Filter & Controls Toolbar */}
        <section className="controls-section" aria-label="Search and filter civic issues">
          <div className="controls-row-top">
            {/* Search Bar */}
            <div className="search-box-wrapper">
              <span className="search-icon">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search by title, location, Ward, or Grievance ID... (Press '/' to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="dropdown-control-group">
              <div className="select-wrapper">
                <select
                  className="custom-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">📁 All Categories</option>
                  {window.JanNetraData.CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">▼</span>
              </div>

              {/* Sort Order Selector */}
              <div className="select-wrapper">
                <select
                  className="custom-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">🕒 Sort: Newest First</option>
                  <option value="oldest">🕰️ Sort: Oldest First</option>
                  <option value="upvotes">🔥 Sort: Most Upvoted</option>
                  <option value="urgency">🚨 Sort: Highest Priority</option>
                </select>
                <span className="select-arrow">▼</span>
              </div>
            </div>
          </div>

          {/* Status Tabs and Quick Results info */}
          <div className="controls-row-bottom">
            <div className="status-tabs-container">
              {['All', 'Pending', 'In Progress', 'Resolved'].map((st) => {
                const count = st === 'All' ? issues.length : issues.filter((i) => i.status === st).length;
                return (
                  <button
                    key={st}
                    type="button"
                    className={`status-tab-btn ${statusFilter === st ? 'active' : ''}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    <span>{st === 'All' ? 'All Issues' : st}</span>
                    <span className="status-count-badge">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="filter-results-info">
              <span>
                Showing <strong>{filteredIssues.length}</strong> of {issues.length} issues
              </span>
              {(searchQuery || statusFilter !== 'All' || categoryFilter !== 'All') && (
                <button
                  type="button"
                  className="btn-reset-filters"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('All');
                    setCategoryFilter('All');
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 4. Issues Grid */}
        <section aria-label="Grievances List">
          {filteredIssues.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-state-icon">🔎</div>
              <h3 className="empty-state-title">No Civic Grievances Found</h3>
              <p className="empty-state-desc">
                No reported issues match your active search or filter criteria. Try resetting your filters
                or report a new issue to get started.
              </p>
              <button
                type="button"
                className="btn-primary-cta"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setCategoryFilter('All');
                }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="issues-grid">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  isAdminMode={isAdminMode}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleUpvote={() => handleToggleUpvote(issue.id)}
                  onViewDetails={() => setSelectedIssueForDetails(issue)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 5. Issue Submission Modal */}
      {isReportModalOpen && (
        <ReportIssueModal
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleCreateIssue}
        />
      )}

      {/* 6. Detailed Issue Timeline Drawer Modal */}
      {selectedIssueForDetails && (
        <IssueDetailsModal
          issue={selectedIssueForDetails}
          isAdminMode={isAdminMode}
          onClose={() => setSelectedIssueForDetails(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* 7. Toast Notification Container */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item ${toast.type}`}>
            <span>
              {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* 8. Semantic Application Footer */}
      <Footer />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Header Navigation
// -----------------------------------------------------------------------------
function Header({ isAdminMode, setIsAdminMode, theme, toggleTheme, onOpenReportModal, onResetData }) {
  return (
    <header className="app-header">
      <div className="container header-container">
        <a href="#" className="brand-wrapper">
          <div className="brand-logo-badge">👁️</div>
          <div className="brand-info">
            <span className="brand-title">JanNetra</span>
            <span className="brand-subtext">Civic Grievance Redressal Portal</span>
          </div>
        </a>

        <div className="header-actions">
          {/* Admin / Citizen Switch */}
          <div className="admin-mode-pill" title="Toggle between Public Citizen view and Municipal Authority view">
            <button
              type="button"
              className={`admin-toggle-btn ${!isAdminMode ? 'active' : ''}`}
              onClick={() => setIsAdminMode(false)}
            >
              👤 Citizen
            </button>
            <button
              type="button"
              className={`admin-toggle-btn ${isAdminMode ? 'active admin' : ''}`}
              onClick={() => setIsAdminMode(true)}
            >
              🛡️ Admin
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={onResetData}
            title="Reset dataset to sample mock data"
            aria-label="Reset Mock Data"
          >
            🔄
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            className="btn-primary-cta"
            onClick={onOpenReportModal}
          >
            <span>➕</span>
            <span>Report Issue</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// -----------------------------------------------------------------------------
// Component: Issue Card
// -----------------------------------------------------------------------------
function IssueCard({ issue, isAdminMode, onUpdateStatus, onToggleUpvote, onViewDetails }) {
  const categoryMeta = window.JanNetraData.CATEGORIES.find((c) => c.id === issue.category) || {
    name: 'General',
    icon: '📌',
    color: '#64748b'
  };

  const statusClass = issue.status.replace(/\s+/g, '-');
  const formattedDate = new Date(issue.dateReported).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <article className="issue-card" aria-label={`Civic Issue ${issue.id}`}>
      {/* Media & Badges */}
      <div className="card-media-wrapper">
        <img
          src={issue.imageUrl}
          alt={issue.title}
          className="card-media-img"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="card-overlay-top">
          <div className="card-category-pill">
            <span>{categoryMeta.icon}</span>
            <span>{categoryMeta.name}</span>
          </div>
          <span className={`card-priority-badge ${issue.priority}`}>
            {issue.priority}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="card-body">
        <div className="card-id-row">
          <span className="card-tracking-id">{issue.id}</span>
          <span className="card-date-reported">📅 {formattedDate}</span>
        </div>

        <h3 className="card-title" title={issue.title}>
          {issue.title}
        </h3>

        <div className="card-location-row" title={issue.location}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {issue.location}
          </span>
        </div>

        <p className="card-description">{issue.description}</p>

        {/* Status Badge & Dept */}
        <div className="card-meta-row">
          <div className={`status-badge ${statusClass}`}>
            <span className="status-dot"></span>
            <span>{issue.status}</span>
          </div>

          <span className="card-dept-tag" title={issue.assignedDept || 'Municipal Triage'}>
            🏢 {issue.assignedDept || 'Municipal Triage'}
          </span>
        </div>

        {/* Card Footer Actions */}
        <div className="card-actions-footer">
          <button
            type="button"
            className={`btn-upvote ${issue.hasUpvoted ? 'upvoted' : ''}`}
            onClick={onToggleUpvote}
            title={issue.hasUpvoted ? 'Remove your civic upvote' : 'Upvote this issue to increase municipal priority'}
          >
            <span>▲</span>
            <span>{issue.upvotes || 0}</span>
          </button>

          {isAdminMode ? (
            <div className="admin-card-control" title="Municipal Administrator Quick Status Control">
              <select
                className="admin-status-select"
                value={issue.status}
                onChange={(e) => onUpdateStatus(issue.id, e.target.value)}
              >
                <option value="Pending">🟡 Pending</option>
                <option value="In Progress">🔵 In Progress</option>
                <option value="Resolved">🟢 Resolved</option>
              </select>
            </div>
          ) : null}

          <button
            type="button"
            className="btn-card-details"
            onClick={onViewDetails}
          >
            <span>Timeline</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// -----------------------------------------------------------------------------
// Component: Report Issue Modal Form
// -----------------------------------------------------------------------------
function ReportIssueModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('roads');
  const [priority, setPriority] = useState('High');
  const [location, setLocation] = useState('');
  const [ward, setWard] = useState('Ward 24 (North Zone)');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-assign department when category changes
  const currentCategoryObj = window.JanNetraData.CATEGORIES.find((c) => c.id === category);

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Uploaded image is too large. Please select an image under 5MB.');
        return;
      }
      setErrorMessage('');
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Uploaded image is too large. Please select an image under 5MB.');
        return;
      }
      setErrorMessage('');
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please specify an issue title.');
      return;
    }
    if (!location.trim()) {
      setErrorMessage('Please provide an accurate location or landmark.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please describe the issue in detail for municipal inspectors.');
      return;
    }

    setErrorMessage('');
    onSubmit({
      title,
      category,
      priority,
      location,
      ward,
      description,
      reportedBy,
      imageUrl,
      assignedDept: currentCategoryObj ? currentCategoryObj.dept : 'Municipal Works Dept'
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>Report a Civic Grievance</h2>
            <p>Citizen portal for municipal maintenance, road repairs, sanitation & safety</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            {errorMessage && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Issue Title */}
            <div className="form-group">
              <label className="form-label">
                <span>Issue Title <span className="required-star">*</span></span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Concise summary</span>
              </label>
              <input
                type="text"
                className="form-control-input"
                placeholder="e.g. Deep crater pothole causing vehicle damage"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Category & Priority 2-Column */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">
                  Category <span className="required-star">*</span>
                </label>
                <select
                  className="form-control-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {window.JanNetraData.CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Urgency / Priority <span className="required-star">*</span>
                </label>
                <select
                  className="form-control-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low - Routine repair</option>
                  <option value="Medium">Medium - Attention needed</option>
                  <option value="High">High - Impeding traffic/safety</option>
                  <option value="Critical">Critical - Immediate life/property hazard</option>
                </select>
              </div>
            </div>

            {/* Location & Ward */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">
                  Location / Landmark <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-control-input"
                  placeholder="e.g. Near Metro Pillar 142, Ring Road"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Municipal Ward</label>
                <input
                  type="text"
                  className="form-control-input"
                  placeholder="e.g. Ward 24 (North Zone)"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                />
              </div>
            </div>

            {/* Citizen Details */}
            <div className="form-group">
              <label className="form-label">
                <span>Citizen Name (Optional)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Leave blank for anonymous</span>
              </label>
              <input
                type="text"
                className="form-control-input"
                placeholder="e.g. Aarav Sharma"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                Detailed Grievance Description <span className="required-star">*</span>
              </label>
              <textarea
                className="form-control-textarea"
                placeholder="Provide specific details, size of damage, hazard risks, duration of problem..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Visual Photographic Proof */}
            <div className="form-group photo-upload-group">
              <label className="form-label">
                <span>Visual Photographic Proof</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Attach device photo or paste image URL</span>
              </label>

              <div className="image-upload-wrapper">
                {imageUrl ? (
                  <div className="image-preview-card">
                    <div className="preview-img-container">
                      <img
                        src={imageUrl}
                        alt="Civic issue photographic proof"
                        className="preview-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="preview-details">
                      <div className="preview-info">
                        <span className="preview-status-badge">✓ Photo Attached</span>
                        {fileName ? (
                          <span className="preview-filename">{fileName}</span>
                        ) : (
                          <span className="preview-filename">Web Image URL</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={() => {
                          setImageUrl('');
                          setFileName('');
                        }}
                      >
                        ✕ Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <div className="upload-dropzone-content">
                      <div className="upload-icon-circle">
                        📁
                      </div>
                      <div className="upload-dropzone-text">
                        <strong>Click to upload photo from device</strong> or drag & drop here
                      </div>
                      <span className="upload-hint">Supports PNG, JPG, JPEG, WebP (Max 5MB)</span>
                    </div>
                  </label>
                )}

                {/* Direct Custom Image URL input */}
                <div className="url-input-container">
                  <div className="url-input-divider">
                    <span>or paste custom image URL</span>
                  </div>
                  <div className="url-input-group">
                    <span className="url-input-icon">🔗</span>
                    <input
                      type="url"
                      className="form-control-input url-field"
                      placeholder="Paste image URL (https://...)"
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setFileName('');
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-cta">
              <span>Submit Civic Grievance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Issue Details & Timeline Modal (Academic Redressal Lifecycle)
// -----------------------------------------------------------------------------
function IssueDetailsModal({ issue, isAdminMode, onClose, onUpdateStatus }) {
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const categoryMeta = window.JanNetraData.CATEGORIES.find((c) => c.id === issue.category) || {
    name: 'General',
    icon: '📌'
  };

  const handleStatusChangeWithNote = (newStatus) => {
    onUpdateStatus(issue.id, newStatus, adminNoteInput);
    setAdminNoteInput('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="card-tracking-id">{issue.id}</span>
              <span className={`status-badge ${issue.status.replace(/\s+/g, '-')}`}>
                {issue.status}
              </span>
            </div>
            <h2 style={{ marginTop: '0.35rem', fontSize: '1.25rem' }}>{issue.title}</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <img
              src={issue.imageUrl}
              alt={issue.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Metadata Grid */}
          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <span className="detail-meta-label">Category & Dept</span>
              <span className="detail-meta-value">
                {categoryMeta.icon} {categoryMeta.name} — {issue.assignedDept || 'Municipal PWD'}
              </span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">Priority Level</span>
              <span className="detail-meta-value" style={{ color: issue.priority === 'Critical' ? '#dc2626' : 'inherit' }}>
                {issue.priority}
              </span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">Exact Location</span>
              <span className="detail-meta-value">{issue.location}</span>
            </div>
            <div className="detail-meta-item">
              <span className="detail-meta-label">Reported By</span>
              <span className="detail-meta-value">{issue.reportedBy}</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.35rem' }}>Full Incident Description</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {issue.description}
            </p>
          </div>

          {/* Official Redressal Timeline */}
          <div>
            <h4 className="timeline-section-title">Municipal Action & Redressal Timeline</h4>
            <div className="timeline-list">
              {(issue.timeline || [
                { status: issue.status, timestamp: issue.dateReported, note: 'Registered into civic index' }
              ]).map((step, idx) => (
                <div key={idx} className={`timeline-step ${step.status === 'Resolved' ? 'resolved' : ''}`}>
                  <div className="timeline-step-indicator"></div>
                  <div className="timeline-step-header">
                    <span className="timeline-step-name">
                      {step.status === 'Resolved' ? '✅ Resolved & Verified' : step.status === 'In Progress' ? '🛠️ Field Action Initiated' : '📝 Grievance Logged'}
                    </span>
                    <span className="timeline-step-time">
                      {new Date(step.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="timeline-step-note">{step.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Management Panel */}
          {isAdminMode && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-surface-alt)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                🛡️ Municipal Authority Redressal Action
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Update status and append official remarks to the public grievance audit trail:
              </p>
              <input
                type="text"
                className="form-control-input"
                placeholder="Optional action note (e.g. Patching complete, Inspector verified)"
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                style={{ marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleStatusChangeWithNote('Pending')}
                  disabled={issue.status === 'Pending'}
                >
                  Mark Pending
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleStatusChangeWithNote('In Progress')}
                  disabled={issue.status === 'In Progress'}
                >
                  Move to In Progress
                </button>
                <button
                  type="button"
                  className="btn-primary-cta"
                  onClick={() => handleStatusChangeWithNote('Resolved')}
                  disabled={issue.status === 'Resolved'}
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component: Semantic Application Footer
// -----------------------------------------------------------------------------
function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-meta">
            <strong className="footer-title">
              JanNetra — Civic Issue Management & Grievance Redressal Portal
            </strong>
            <span className="footer-subtext">
              Department of Computer Science & Engineering
            </span>
          </div>

          <div className="footer-tech-stack" aria-label="Technology Stack">
            <span className="tech-tag">React 18</span>
            <span className="tech-tag">HTML5 Semantic</span>
            <span className="tech-tag">Vanilla CSS3 (Flexbox & Grid)</span>
            <span className="tech-tag">LocalStorage API</span>
            <span className="tech-tag">Responsive Mobile-First</span>
          </div>
        </div>

        <div className="footer-copyright">
          © {new Date().getFullYear()} JanNetra Civic Systems. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// Mount the React Application to Root
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
