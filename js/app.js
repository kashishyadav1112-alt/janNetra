/**
 * JanNetra - Civic Issue Management Portal
 * Core React Application Logic (Academic Evaluation Project)
 * Uses React 18, Hooks (useState, useEffect, useMemo), LocalStorage & Custom CSS
 */

const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;

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
    const handleKeyDown = e => {
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
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
    setIssues(prevIssues => prevIssues.map(issue => {
      if (issue.id === issueId) {
        const timestamp = new Date().toISOString();
        const noteText = customNote || (newStatus === 'Resolved' ? 'Issue inspected and resolved by municipal field team.' : newStatus === 'In Progress' ? 'Work order issued; inspection & repair scheduled.' : 'Grievance placed back in pending queue for reassessment.');
        const updatedTimeline = [...(issue.timeline || []), {
          status: newStatus,
          timestamp,
          note: noteText
        }];
        return {
          ...issue,
          status: newStatus,
          timeline: updatedTimeline,
          adminNotes: customNote || issue.adminNotes
        };
      }
      return issue;
    }));

    // If modal is open for this issue, update selected issue state
    if (selectedIssueForDetails && selectedIssueForDetails.id === issueId) {
      setSelectedIssueForDetails(prev => ({
        ...prev,
        status: newStatus,
        timeline: [...(prev.timeline || []), {
          status: newStatus,
          timestamp: new Date().toISOString(),
          note: customNote || `Status changed to ${newStatus}`
        }]
      }));
    }
    showToast(`Issue ${issueId} updated to "${newStatus}"`, 'success');
  };

  // Upvote Toggle Handler
  const handleToggleUpvote = issueId => {
    setIssues(prevIssues => prevIssues.map(issue => {
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
    }));
  };

  // Create New Issue Handler
  const handleCreateIssue = newIssueData => {
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
      timeline: [{
        status: 'Pending',
        timestamp,
        note: 'Civic grievance registered by citizen with geo-tag'
      }]
    };
    setIssues(prev => [newIssue, ...prev]);
    setIsReportModalOpen(false);
    showToast(`Grievance #${trackingId} registered successfully!`, 'success');
  };

  // Export Grievance Report as CSV
  const handleExportCSV = () => {
    const headers = ['Grievance ID', 'Title', 'Category', 'Priority', 'Status', 'Location', 'Reported Date', 'Upvotes', 'Department'];
    const rows = issues.map(i => [`"${i.id}"`, `"${i.title.replace(/"/g, '""')}"`, `"${i.category}"`, `"${i.priority}"`, `"${i.status}"`, `"${i.location.replace(/"/g, '""')}"`, `"${new Date(i.dateReported).toLocaleDateString()}"`, i.upvotes || 0, `"${i.assignedDept || ''}"`]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
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
    return issues.filter(issue => {
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
    }).sort((a, b) => {
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
        const priorityWeights = {
          Critical: 4,
          High: 3,
          Medium: 2,
          Low: 1
        };
        return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
      }
      return 0;
    });
  }, [issues, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Statistics Counters (Memoized)
  const stats = useMemo(() => {
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'Pending').length;
    const inProgress = issues.filter(i => i.status === 'In Progress').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    const resolutionRate = total > 0 ? Math.round(resolved / total * 100) : 0;
    return {
      total,
      pending,
      inProgress,
      resolved,
      resolutionRate
    };
  }, [issues]);
  return /*#__PURE__*/React.createElement("div", {
    className: "app-root"
  }, /*#__PURE__*/React.createElement(Header, {
    isAdminMode: isAdminMode,
    setIsAdminMode: setIsAdminMode,
    theme: theme,
    toggleTheme: toggleTheme,
    onOpenReportModal: () => setIsReportModalOpen(true),
    onResetData: handleResetData
  }), /*#__PURE__*/React.createElement("main", {
    className: "container"
  }, isAdminMode && /*#__PURE__*/React.createElement("aside", {
    className: "admin-status-banner",
    role: "status"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin-banner-left"
  }, /*#__PURE__*/React.createElement("span", {
    className: "admin-banner-icon"
  }, "🛡️"), /*#__PURE__*/React.createElement("div", {
    className: "admin-banner-text"
  }, /*#__PURE__*/React.createElement("strong", null, "Municipal Authority Admin Mode Active"), /*#__PURE__*/React.createElement("p", null, "You have elevated privileges to modify grievance statuses, update work progress, and record inspection remarks."))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "admin-banner-exit-btn",
    onClick: () => setIsAdminMode(false)
  }, "Exit to Citizen View")), /*#__PURE__*/React.createElement("section", {
    className: "dashboard-hero",
    "aria-label": "Civic Analytics Overview"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-banner-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-title-group"
  }, /*#__PURE__*/React.createElement("h1", null, "Civic Grievance Redressal Portal"), /*#__PURE__*/React.createElement("p", null, "Real-time citizen reporting & municipal department tracking system. Empowering urban governance with transparency and accountability.")), /*#__PURE__*/React.createElement("div", {
    className: "hero-quick-actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: handleExportCSV,
    title: "Download CSV database report"
  }, /*#__PURE__*/React.createElement("span", null, "📊 Export CSV")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: () => window.print(),
    title: "Print official municipal summary"
  }, /*#__PURE__*/React.createElement("span", null, "🖨️ Print Report")))), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-icon-wrapper stat-icon-total"
  }, "📋"), /*#__PURE__*/React.createElement("div", {
    className: "stat-details"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, stats.total), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Total Grievances"), /*#__PURE__*/React.createElement("span", {
    className: "stat-subtext"
  }, "Registered across wards"))), /*#__PURE__*/React.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-icon-wrapper stat-icon-pending"
  }, "⏳"), /*#__PURE__*/React.createElement("div", {
    className: "stat-details"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, stats.pending), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Pending Verification"), /*#__PURE__*/React.createElement("span", {
    className: "stat-subtext"
  }, "Awaiting field inspection"))), /*#__PURE__*/React.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-icon-wrapper stat-icon-progress"
  }, "🛠️"), /*#__PURE__*/React.createElement("div", {
    className: "stat-details"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, stats.inProgress), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "In Progress"), /*#__PURE__*/React.createElement("span", {
    className: "stat-subtext"
  }, "Work order assigned"))), /*#__PURE__*/React.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-icon-wrapper stat-icon-resolved"
  }, "✅"), /*#__PURE__*/React.createElement("div", {
    className: "stat-details"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-value"
  }, stats.resolved), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, "Resolved (", stats.resolutionRate, "%)"), /*#__PURE__*/React.createElement("span", {
    className: "stat-subtext"
  }, "Inspected & cleared"))))), /*#__PURE__*/React.createElement("section", {
    className: "controls-section",
    "aria-label": "Search and filter civic issues"
  }, /*#__PURE__*/React.createElement("div", {
    className: "controls-row-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "search-box-wrapper"
  }, /*#__PURE__*/React.createElement("span", {
    className: "search-icon"
  }, "🔍"), /*#__PURE__*/React.createElement("input", {
    ref: searchInputRef,
    type: "text",
    className: "search-input",
    placeholder: "Search by title, location, Ward, or Grievance ID... (Press '/' to focus)",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value)
  }), searchQuery && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "search-clear-btn",
    onClick: () => setSearchQuery(''),
    title: "Clear search"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "dropdown-control-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "select-wrapper"
  }, /*#__PURE__*/React.createElement("select", {
    className: "custom-select",
    value: categoryFilter,
    onChange: e => setCategoryFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "All"
  }, "📁 All Categories"), window.JanNetraData.CATEGORIES.map(cat => /*#__PURE__*/React.createElement("option", {
    key: cat.id,
    value: cat.id
  }, cat.icon, " ", cat.name))), /*#__PURE__*/React.createElement("span", {
    className: "select-arrow"
  }, "▼")), /*#__PURE__*/React.createElement("div", {
    className: "select-wrapper"
  }, /*#__PURE__*/React.createElement("select", {
    className: "custom-select",
    value: sortBy,
    onChange: e => setSortBy(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "newest"
  }, "🕒 Sort: Newest First"), /*#__PURE__*/React.createElement("option", {
    value: "oldest"
  }, "🕰️ Sort: Oldest First"), /*#__PURE__*/React.createElement("option", {
    value: "upvotes"
  }, "🔥 Sort: Most Upvoted"), /*#__PURE__*/React.createElement("option", {
    value: "urgency"
  }, "🚨 Sort: Highest Priority")), /*#__PURE__*/React.createElement("span", {
    className: "select-arrow"
  }, "▼")))), /*#__PURE__*/React.createElement("div", {
    className: "controls-row-bottom"
  }, /*#__PURE__*/React.createElement("div", {
    className: "status-tabs-container"
  }, ['All', 'Pending', 'In Progress', 'Resolved'].map(st => {
    const count = st === 'All' ? issues.length : issues.filter(i => i.status === st).length;
    return /*#__PURE__*/React.createElement("button", {
      key: st,
      type: "button",
      className: `status-tab-btn ${statusFilter === st ? 'active' : ''}`,
      onClick: () => setStatusFilter(st)
    }, /*#__PURE__*/React.createElement("span", null, st === 'All' ? 'All Issues' : st), /*#__PURE__*/React.createElement("span", {
      className: "status-count-badge"
    }, count));
  })), /*#__PURE__*/React.createElement("div", {
    className: "filter-results-info"
  }, /*#__PURE__*/React.createElement("span", null, "Showing ", /*#__PURE__*/React.createElement("strong", null, filteredIssues.length), " of ", issues.length, " issues"), (searchQuery || statusFilter !== 'All' || categoryFilter !== 'All') && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-reset-filters",
    onClick: () => {
      setSearchQuery('');
      setStatusFilter('All');
      setCategoryFilter('All');
    }
  }, "Reset filters")))), /*#__PURE__*/React.createElement("section", {
    "aria-label": "Grievances List"
  }, filteredIssues.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-state-box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty-state-icon"
  }, "🔎"), /*#__PURE__*/React.createElement("h3", {
    className: "empty-state-title"
  }, "No Civic Grievances Found"), /*#__PURE__*/React.createElement("p", {
    className: "empty-state-desc"
  }, "No reported issues match your active search or filter criteria. Try resetting your filters or report a new issue to get started."), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-primary-cta",
    onClick: () => {
      setSearchQuery('');
      setStatusFilter('All');
      setCategoryFilter('All');
    }
  }, "Clear All Filters")) : /*#__PURE__*/React.createElement("div", {
    className: "issues-grid"
  }, filteredIssues.map(issue => /*#__PURE__*/React.createElement(IssueCard, {
    key: issue.id,
    issue: issue,
    isAdminMode: isAdminMode,
    onUpdateStatus: handleUpdateStatus,
    onToggleUpvote: () => handleToggleUpvote(issue.id),
    onViewDetails: () => setSelectedIssueForDetails(issue)
  }))))), isReportModalOpen && /*#__PURE__*/React.createElement(ReportIssueModal, {
    onClose: () => setIsReportModalOpen(false),
    onSubmit: handleCreateIssue
  }), selectedIssueForDetails && /*#__PURE__*/React.createElement(IssueDetailsModal, {
    issue: selectedIssueForDetails,
    isAdminMode: isAdminMode,
    onClose: () => setSelectedIssueForDetails(null),
    onUpdateStatus: handleUpdateStatus
  }), /*#__PURE__*/React.createElement("div", {
    className: "toast-container",
    "aria-live": "polite"
  }, toasts.map(toast => /*#__PURE__*/React.createElement("div", {
    key: toast.id,
    className: `toast-item ${toast.type}`
  }, /*#__PURE__*/React.createElement("span", null, toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : 'ℹ️'), /*#__PURE__*/React.createElement("span", null, toast.message)))), /*#__PURE__*/React.createElement(Footer, null));
}

// -----------------------------------------------------------------------------
// Component: Header Navigation
// -----------------------------------------------------------------------------
function Header({
  isAdminMode,
  setIsAdminMode,
  theme,
  toggleTheme,
  onOpenReportModal,
  onResetData
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "app-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container header-container"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "brand-wrapper"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-logo-badge"
  }, "👁️"), /*#__PURE__*/React.createElement("div", {
    className: "brand-info"
  }, /*#__PURE__*/React.createElement("span", {
    className: "brand-title"
  }, "JanNetra"), /*#__PURE__*/React.createElement("span", {
    className: "brand-subtext"
  }, "Civic Grievance Redressal Portal"))), /*#__PURE__*/React.createElement("div", {
    className: "header-actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin-mode-pill",
    title: "Toggle between Public Citizen view and Municipal Authority view"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `admin-toggle-btn ${!isAdminMode ? 'active' : ''}`,
    onClick: () => setIsAdminMode(false)
  }, "👤 Citizen"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `admin-toggle-btn ${isAdminMode ? 'active admin' : ''}`,
    onClick: () => setIsAdminMode(true)
  }, "🛡️ Admin")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    onClick: toggleTheme,
    title: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
    "aria-label": "Toggle Theme"
  }, theme === 'light' ? '🌙' : '☀️'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-icon",
    onClick: onResetData,
    title: "Reset dataset to sample mock data",
    "aria-label": "Reset Mock Data"
  }, "🔄"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-primary-cta",
    onClick: onOpenReportModal
  }, /*#__PURE__*/React.createElement("span", null, "➕"), /*#__PURE__*/React.createElement("span", null, "Report Issue")))));
}

// -----------------------------------------------------------------------------
// Component: Issue Card
// -----------------------------------------------------------------------------
function IssueCard({
  issue,
  isAdminMode,
  onUpdateStatus,
  onToggleUpvote,
  onViewDetails
}) {
  const categoryMeta = window.JanNetraData.CATEGORIES.find(c => c.id === issue.category) || {
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
  return /*#__PURE__*/React.createElement("article", {
    className: "issue-card",
    "aria-label": `Civic Issue ${issue.id}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-media-wrapper"
  }, /*#__PURE__*/React.createElement("img", {
    src: issue.imageUrl,
    alt: issue.title,
    className: "card-media-img",
    loading: "lazy",
    onError: e => {
      e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "card-overlay-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-category-pill"
  }, /*#__PURE__*/React.createElement("span", null, categoryMeta.icon), /*#__PURE__*/React.createElement("span", null, categoryMeta.name)), /*#__PURE__*/React.createElement("span", {
    className: `card-priority-badge ${issue.priority}`
  }, issue.priority))), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-id-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "card-tracking-id"
  }, issue.id), /*#__PURE__*/React.createElement("span", {
    className: "card-date-reported"
  }, "📅 ", formattedDate)), /*#__PURE__*/React.createElement("h3", {
    className: "card-title",
    title: issue.title
  }, issue.title), /*#__PURE__*/React.createElement("div", {
    className: "card-location-row",
    title: issue.location
  }, /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, issue.location)), /*#__PURE__*/React.createElement("p", {
    className: "card-description"
  }, issue.description), /*#__PURE__*/React.createElement("div", {
    className: "card-meta-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: `status-badge ${statusClass}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "status-dot"
  }), /*#__PURE__*/React.createElement("span", null, issue.status)), /*#__PURE__*/React.createElement("span", {
    className: "card-dept-tag",
    title: issue.assignedDept || 'Municipal Triage'
  }, "🏢 ", issue.assignedDept || 'Municipal Triage')), /*#__PURE__*/React.createElement("div", {
    className: "card-actions-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `btn-upvote ${issue.hasUpvoted ? 'upvoted' : ''}`,
    onClick: onToggleUpvote,
    title: issue.hasUpvoted ? 'Remove your civic upvote' : 'Upvote this issue to increase municipal priority'
  }, /*#__PURE__*/React.createElement("span", null, "▲"), /*#__PURE__*/React.createElement("span", null, issue.upvotes || 0)), isAdminMode ? /*#__PURE__*/React.createElement("div", {
    className: "admin-card-control",
    title: "Municipal Administrator Quick Status Control"
  }, /*#__PURE__*/React.createElement("select", {
    className: "admin-status-select",
    value: issue.status,
    onChange: e => onUpdateStatus(issue.id, e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "Pending"
  }, "🟡 Pending"), /*#__PURE__*/React.createElement("option", {
    value: "In Progress"
  }, "🔵 In Progress"), /*#__PURE__*/React.createElement("option", {
    value: "Resolved"
  }, "🟢 Resolved"))) : null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-card-details",
    onClick: onViewDetails
  }, /*#__PURE__*/React.createElement("span", null, "Timeline"), /*#__PURE__*/React.createElement("span", null, "→")))));
}

// -----------------------------------------------------------------------------
// Component: Report Issue Modal Form
// -----------------------------------------------------------------------------
function ReportIssueModal({
  onClose,
  onSubmit
}) {
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
  const currentCategoryObj = window.JanNetraData.CATEGORIES.find(c => c.id === category);
  const handleFileUpload = e => {
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
  const handleFileDrop = e => {
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
  const handleSubmit = e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title-group"
  }, /*#__PURE__*/React.createElement("h2", null, "Report a Civic Grievance"), /*#__PURE__*/React.createElement("p", null, "Citizen portal for municipal maintenance, road repairs, sanitation & safety")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: onClose,
    "aria-label": "Close modal"
  }, "✕")), /*#__PURE__*/React.createElement("form", {
    className: "modal-form",
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, errorMessage && /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fee2e2',
      color: '#991b1b',
      padding: '0.65rem 1rem',
      borderRadius: '8px',
      fontSize: '0.85rem',
      fontWeight: '600'
    }
  }, "⚠️ ", errorMessage), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, /*#__PURE__*/React.createElement("span", null, "Issue Title ", /*#__PURE__*/React.createElement("span", {
    className: "required-star"
  }, "*")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-subtle)'
    }
  }, "Concise summary")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control-input",
    placeholder: "e.g. Deep crater pothole causing vehicle damage",
    value: title,
    onChange: e => setTitle(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-row-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Category ", /*#__PURE__*/React.createElement("span", {
    className: "required-star"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    className: "form-control-select",
    value: category,
    onChange: e => setCategory(e.target.value)
  }, window.JanNetraData.CATEGORIES.map(cat => /*#__PURE__*/React.createElement("option", {
    key: cat.id,
    value: cat.id
  }, cat.icon, " ", cat.name)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Urgency / Priority ", /*#__PURE__*/React.createElement("span", {
    className: "required-star"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    className: "form-control-select",
    value: priority,
    onChange: e => setPriority(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "Low"
  }, "Low - Routine repair"), /*#__PURE__*/React.createElement("option", {
    value: "Medium"
  }, "Medium - Attention needed"), /*#__PURE__*/React.createElement("option", {
    value: "High"
  }, "High - Impeding traffic/safety"), /*#__PURE__*/React.createElement("option", {
    value: "Critical"
  }, "Critical - Immediate life/property hazard")))), /*#__PURE__*/React.createElement("div", {
    className: "form-row-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Location / Landmark ", /*#__PURE__*/React.createElement("span", {
    className: "required-star"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control-input",
    placeholder: "e.g. Near Metro Pillar 142, Ring Road",
    value: location,
    onChange: e => setLocation(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Municipal Ward"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control-input",
    placeholder: "e.g. Ward 24 (North Zone)",
    value: ward,
    onChange: e => setWard(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, /*#__PURE__*/React.createElement("span", null, "Citizen Name (Optional)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-subtle)'
    }
  }, "Leave blank for anonymous")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control-input",
    placeholder: "e.g. Aarav Sharma",
    value: reportedBy,
    onChange: e => setReportedBy(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Detailed Grievance Description ", /*#__PURE__*/React.createElement("span", {
    className: "required-star"
  }, "*")), /*#__PURE__*/React.createElement("textarea", {
    className: "form-control-textarea",
    placeholder: "Provide specific details, size of damage, hazard risks, duration of problem...",
    value: description,
    onChange: e => setDescription(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group photo-upload-group"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, /*#__PURE__*/React.createElement("span", null, "Visual Photographic Proof"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-subtle)'
    }
  }, "Attach device photo or paste image URL")), /*#__PURE__*/React.createElement("div", {
    className: "image-upload-wrapper"
  }, imageUrl ? /*#__PURE__*/React.createElement("div", {
    className: "image-preview-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "preview-img-container"
  }, /*#__PURE__*/React.createElement("img", {
    src: imageUrl,
    alt: "Civic issue photographic proof",
    className: "preview-img",
    onError: e => {
      e.target.style.display = 'none';
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "preview-details"
  }, /*#__PURE__*/React.createElement("div", {
    className: "preview-info"
  }, /*#__PURE__*/React.createElement("span", {
    className: "preview-status-badge"
  }, "✓ Photo Attached"), fileName ? /*#__PURE__*/React.createElement("span", {
    className: "preview-filename"
  }, fileName) : /*#__PURE__*/React.createElement("span", {
    className: "preview-filename"
  }, "Web Image URL")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-remove-image",
    onClick: () => {
      setImageUrl('');
      setFileName('');
    }
  }, "✕ Remove Photo"))) : /*#__PURE__*/React.createElement("label", {
    className: `upload-dropzone ${isDragging ? 'dragging' : ''}`,
    onDragOver: e => {
      e.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: handleFileDrop
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    style: {
      display: 'none'
    },
    onChange: handleFileUpload
  }), /*#__PURE__*/React.createElement("div", {
    className: "upload-dropzone-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "upload-icon-circle"
  }, "📁"), /*#__PURE__*/React.createElement("div", {
    className: "upload-dropzone-text"
  }, /*#__PURE__*/React.createElement("strong", null, "Click to upload photo from device"), " or drag & drop here"), /*#__PURE__*/React.createElement("span", {
    className: "upload-hint"
  }, "Supports PNG, JPG, JPEG, WebP (Max 5MB)"))), /*#__PURE__*/React.createElement("div", {
    className: "url-input-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "url-input-divider"
  }, /*#__PURE__*/React.createElement("span", null, "or paste custom image URL")), /*#__PURE__*/React.createElement("div", {
    className: "url-input-group"
  }, /*#__PURE__*/React.createElement("span", {
    className: "url-input-icon"
  }, "🔗"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    className: "form-control-input url-field",
    placeholder: "Paste image URL (https://...)",
    value: imageUrl.startsWith('data:') ? '' : imageUrl,
    onChange: e => {
      setImageUrl(e.target.value);
      setFileName('');
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn-primary-cta"
  }, /*#__PURE__*/React.createElement("span", null, "Submit Civic Grievance"))))));
}

// -----------------------------------------------------------------------------
// Component: Issue Details & Timeline Modal (Academic Redressal Lifecycle)
// -----------------------------------------------------------------------------
function IssueDetailsModal({
  issue,
  isAdminMode,
  onClose,
  onUpdateStatus
}) {
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const categoryMeta = window.JanNetraData.CATEGORIES.find(c => c.id === issue.category) || {
    name: 'General',
    icon: '📌'
  };
  const handleStatusChangeWithNote = newStatus => {
    onUpdateStatus(issue.id, newStatus, adminNoteInput);
    setAdminNoteInput('');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-title-group"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "card-tracking-id"
  }, issue.id), /*#__PURE__*/React.createElement("span", {
    className: `status-badge ${issue.status.replace(/\s+/g, '-')}`
  }, issue.status)), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: '0.35rem',
      fontSize: '1.25rem'
    }
  }, issue.title)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "modal-close-btn",
    onClick: onClose,
    "aria-label": "Close modal"
  }, "✕")), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '220px',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: issue.imageUrl,
    alt: issue.title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "detail-meta-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "detail-meta-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "detail-meta-label"
  }, "Category & Dept"), /*#__PURE__*/React.createElement("span", {
    className: "detail-meta-value"
  }, categoryMeta.icon, " ", categoryMeta.name, " — ", issue.assignedDept || 'Municipal PWD')), /*#__PURE__*/React.createElement("div", {
    className: "detail-meta-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "detail-meta-label"
  }, "Priority Level"), /*#__PURE__*/React.createElement("span", {
    className: "detail-meta-value",
    style: {
      color: issue.priority === 'Critical' ? '#dc2626' : 'inherit'
    }
  }, issue.priority)), /*#__PURE__*/React.createElement("div", {
    className: "detail-meta-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "detail-meta-label"
  }, "Exact Location"), /*#__PURE__*/React.createElement("span", {
    className: "detail-meta-value"
  }, issue.location)), /*#__PURE__*/React.createElement("div", {
    className: "detail-meta-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "detail-meta-label"
  }, "Reported By"), /*#__PURE__*/React.createElement("span", {
    className: "detail-meta-value"
  }, issue.reportedBy))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '1.25rem'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: '0.9rem',
      fontWeight: '700',
      marginBottom: '0.35rem'
    }
  }, "Full Incident Description"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.9rem',
      color: 'var(--text-muted)',
      lineHeight: '1.5'
    }
  }, issue.description)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "timeline-section-title"
  }, "Municipal Action & Redressal Timeline"), /*#__PURE__*/React.createElement("div", {
    className: "timeline-list"
  }, (issue.timeline || [{
    status: issue.status,
    timestamp: issue.dateReported,
    note: 'Registered into civic index'
  }]).map((step, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    className: `timeline-step ${step.status === 'Resolved' ? 'resolved' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "timeline-step-indicator"
  }), /*#__PURE__*/React.createElement("div", {
    className: "timeline-step-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "timeline-step-name"
  }, step.status === 'Resolved' ? '✅ Resolved & Verified' : step.status === 'In Progress' ? '🛠️ Field Action Initiated' : '📝 Grievance Logged'), /*#__PURE__*/React.createElement("span", {
    className: "timeline-step-time"
  }, new Date(step.timestamp).toLocaleString())), /*#__PURE__*/React.createElement("p", {
    className: "timeline-step-note"
  }, step.note))))), isAdminMode && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '1.25rem',
      padding: '1rem',
      background: 'var(--bg-surface-alt)',
      borderRadius: '12px',
      border: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: '0.88rem',
      fontWeight: '700',
      color: 'var(--primary)',
      marginBottom: '0.5rem'
    }
  }, "🛡️ Municipal Authority Redressal Action"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-muted)',
      marginBottom: '0.75rem'
    }
  }, "Update status and append official remarks to the public grievance audit trail:"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control-input",
    placeholder: "Optional action note (e.g. Patching complete, Inspector verified)",
    value: adminNoteInput,
    onChange: e => setAdminNoteInput(e.target.value),
    style: {
      marginBottom: '0.75rem'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: () => handleStatusChangeWithNote('Pending'),
    disabled: issue.status === 'Pending'
  }, "Mark Pending"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: () => handleStatusChangeWithNote('In Progress'),
    disabled: issue.status === 'In Progress'
  }, "Move to In Progress"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-primary-cta",
    onClick: () => handleStatusChangeWithNote('Resolved'),
    disabled: issue.status === 'Resolved'
  }, "Mark as Resolved")))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: onClose
  }, "Close"))));
}

// -----------------------------------------------------------------------------
// Component: Semantic Application Footer
// -----------------------------------------------------------------------------
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "app-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-meta"
  }, /*#__PURE__*/React.createElement("strong", {
    className: "footer-title"
  }, "JanNetra — Civic Issue Management & Grievance Redressal Portal"), /*#__PURE__*/React.createElement("span", {
    className: "footer-subtext"
  }, "Department of Computer Science & Engineering")), /*#__PURE__*/React.createElement("div", {
    className: "footer-tech-stack",
    "aria-label": "Technology Stack"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tech-tag"
  }, "React 18"), /*#__PURE__*/React.createElement("span", {
    className: "tech-tag"
  }, "HTML5 Semantic"), /*#__PURE__*/React.createElement("span", {
    className: "tech-tag"
  }, "Vanilla CSS3 (Flexbox & Grid)"), /*#__PURE__*/React.createElement("span", {
    className: "tech-tag"
  }, "LocalStorage API"), /*#__PURE__*/React.createElement("span", {
    className: "tech-tag"
  }, "Responsive Mobile-First"))), /*#__PURE__*/React.createElement("div", {
    className: "footer-copyright"
  }, "© ", new Date().getFullYear(), " JanNetra Civic Systems. All rights reserved.")));
}

// Mount the React Application to Root
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(/*#__PURE__*/React.createElement(App, null));