/**
 * JanNetra - Civic Issue Management Portal
 * Mock Data Repository & Category Configuration
 * Designed for 5th Semester Computer Science Academic Evaluation
 */

const CIVIC_CATEGORIES = [
  { id: 'roads', name: 'Roads & Potholes', icon: '🛣️', color: '#ea580c', dept: 'Public Works Dept (PWD)' },
  { id: 'electricity', name: 'Streetlight & Power', icon: '💡', color: '#eab308', dept: 'Municipal Electricity Board' },
  { id: 'sanitation', name: 'Garbage & Sanitation', icon: '🗑️', color: '#16a34a', dept: 'Solid Waste Management Division' },
  { id: 'water', name: 'Water Supply & Leakage', icon: '💧', color: '#0284c7', dept: 'Jal Board / Municipal Water Supply' },
  { id: 'drainage', name: 'Drainage & Sewage', icon: '🌊', color: '#7c3aed', dept: 'Drainage & Flood Control Cell' },
  { id: 'safety', name: 'Public Safety & Encroachment', icon: '⚠️', color: '#dc2626', dept: 'Urban Enforcement & Traffic Police' }
];

const PRESET_IMAGES = [
  {
    label: 'Pothole on Asphalt Road',
    category: 'roads',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Defective Streetlight Pole',
    category: 'electricity',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Overflowing Community Dustbin',
    category: 'sanitation',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Water Pipeline Burst on Roadway',
    category: 'water',
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Waterlogged Street / Clogged Drain',
    category: 'drainage',
    url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Damaged Traffic Sign / Hazard',
    category: 'safety',
    url: 'https://images.unsplash.com/photo-1572953109213-3be62398eb95?auto=format&fit=crop&w=800&q=80'
  }
];

const INITIAL_ISSUES = [
  {
    id: 'JN-2026-1042',
    title: 'Severe crater pothole causing vehicular congestion',
    category: 'roads',
    priority: 'Critical',
    location: 'Outer Ring Road, Near Metro Pillar 142, Ward 24',
    ward: 'Ward 24 (North Zone)',
    description: 'A crater-sized pothole spanning approximately 1.5 meters wide and 8 inches deep has formed right at the flyover descent. Multiple two-wheelers have skidded during evening hours.',
    reportedBy: 'Aarav Sharma (Resident)',
    dateReported: '2026-10-21T09:30:00Z',
    status: 'In Progress',
    upvotes: 47,
    hasUpvoted: false,
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    assignedDept: 'Public Works Dept (PWD)',
    adminNotes: 'Inspection completed by Junior Engineer. Hot-mix asphalt patching team scheduled for night shift.',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-21T09:30:00Z', note: 'Grievance registered with geo-tag' },
      { status: 'In Progress', timestamp: '2026-10-21T14:15:00Z', note: 'Inspected by PWD Sub-division. Contractor work order #PWD-884 issued.' }
    ]
  },
  {
    id: 'JN-2026-1039',
    title: 'Faulty streetlight array plunging residential stretch into darkness',
    category: 'electricity',
    priority: 'High',
    location: 'Sector 14 Main Boulevard, Cross Road 3, Ward 11',
    ward: 'Ward 11 (South Zone)',
    description: 'Seven consecutive solar-LED streetlights have stopped functioning since Tuesday storm. The stretch is dangerously dark, posing safety risks for night commuters and pedestrians.',
    reportedBy: 'Kavita Nair (RWA Secretary)',
    dateReported: '2026-10-20T19:10:00Z',
    status: 'Pending',
    upvotes: 32,
    hasUpvoted: false,
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    assignedDept: 'Municipal Electricity Board',
    adminNotes: 'Awaiting technician team deployment. Transformer relay test queued.',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-20T19:10:00Z', note: 'Citizen grievance submitted and verified by automated triage system.' }
    ]
  },
  {
    id: 'JN-2026-1025',
    title: 'Solid waste container overflow and illegal dumping',
    category: 'sanitation',
    priority: 'High',
    location: 'Azad Weekly Market Complex, Lane 4, Ward 08',
    ward: 'Ward 08 (Central Zone)',
    description: 'Secondary municipal waste dumpster has not been cleared for 48 hours. Waste is spilling over pedestrian pathways attracting stray animals and generating foul odor.',
    reportedBy: 'Mohammed Zeeshan',
    dateReported: '2026-10-19T08:45:00Z',
    status: 'Resolved',
    upvotes: 56,
    hasUpvoted: false,
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    assignedDept: 'Solid Waste Management Division',
    adminNotes: 'Compactor vehicle #DL-1GC-4412 dispatched. Area cleared, sanitized with bleaching powder, and notice issued to vendor association.',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-19T08:45:00Z', note: 'Citizen grievance reported' },
      { status: 'In Progress', timestamp: '2026-10-19T11:00:00Z', note: 'Sanitation Inspector assigned compactor squad' },
      { status: 'Resolved', timestamp: '2026-10-19T17:30:00Z', note: 'Waste cleared and geo-photographic verification approved.' }
    ]
  },
  {
    id: 'JN-2026-1018',
    title: 'Potable water supply line rupture flooding service lane',
    category: 'water',
    priority: 'Critical',
    location: 'Pocket D, Block 3, Opposite Primary Health Center, Ward 19',
    ward: 'Ward 19 (East Zone)',
    description: 'Underground 100mm drinking water supply pipe has developed a severe pressure fissure. Clean potable water has been flooding the lane for 6 hours, leading to low pressure in 40+ households.',
    reportedBy: 'Pooja Deshmukh',
    dateReported: '2026-10-18T06:20:00Z',
    status: 'In Progress',
    upvotes: 68,
    hasUpvoted: false,
    imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
    assignedDept: 'Jal Board / Municipal Water Supply',
    adminNotes: 'Main line sluice valve throttled. Excavation team on-site with collar coupling replacement kit.',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-18T06:20:00Z', note: 'Emergency water leak registered' },
      { status: 'In Progress', timestamp: '2026-10-18T08:00:00Z', note: 'Emergency response van #04 arrived. Excavation in progress.' }
    ]
  },
  {
    id: 'JN-2026-1004',
    title: 'Broken storm-water drain slab causing pedestrian fall hazard',
    category: 'drainage',
    priority: 'Medium',
    location: 'Near Adarsh Vidyalaya School Gate, MG Colony, Ward 15',
    ward: 'Ward 15 (West Zone)',
    description: 'Reinforced concrete slab over the stormwater drainage trench has caved in. School students use this path daily; risk of serious tripping injuries.',
    reportedBy: 'Ramesh Kulkarni',
    dateReported: '2026-10-17T11:15:00Z',
    status: 'Pending',
    upvotes: 21,
    hasUpvoted: false,
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    assignedDept: 'Drainage & Flood Control Cell',
    adminNotes: 'Inspection token generated. Temporary barricade tape advised.',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-17T11:15:00Z', note: 'Reported by resident' }
    ]
  },
  {
    id: 'JN-2026-0995',
    title: 'Unauthorized commercial hoarding blocking blind traffic turn',
    category: 'safety',
    priority: 'Low',
    location: 'Kalyan Nagar T-Junction, Signal 2, Ward 03',
    ward: 'Ward 03 (South Zone)',
    description: 'An oversized metallic advertisement billboard has been erected directly obstructing sightlines for vehicles taking a left turn into Kalyan Nagar.',
    reportedBy: 'Anonymous Citizen',
    dateReported: '2026-10-15T15:00:00Z',
    status: 'Resolved',
    upvotes: 15,
    hasUpvoted: false,
    imageUrl: 'https://images.unsplash.com/photo-1572953109213-3be62398eb95?auto=format&fit=crop&w=800&q=80',
    assignedDept: 'Urban Enforcement & Traffic Police',
    adminNotes: 'Enforcement flying squad dismantled the illegal structure and levied fine on advertising agency.',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-15T15:00:00Z', note: 'Grievance submitted' },
      { status: 'In Progress', timestamp: '2026-10-16T10:00:00Z', note: 'Notice issued under Municipal Act Section 284' },
      { status: 'Resolved', timestamp: '2026-10-16T16:45:00Z', note: 'Hoarding safely seized and junction cleared.' }
    ]
  }
];

// Helper functions for storage and formatting
const STORAGE_KEY = 'jannetra_issues_v1';

const getStoredIssues = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ISSUES));
      return INITIAL_ISSUES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ISSUES;
  } catch (err) {
    console.error('Failed reading from localStorage:', err);
    return INITIAL_ISSUES;
  }
};

const saveStoredIssues = (issues) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch (err) {
    console.error('Failed saving to localStorage:', err);
  }
};

const resetToDefaultIssues = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ISSUES));
    return INITIAL_ISSUES;
  } catch (err) {
    console.error('Failed resetting localStorage:', err);
    return INITIAL_ISSUES;
  }
};

// Export to window for global browser availability
window.JanNetraData = {
  CATEGORIES: CIVIC_CATEGORIES,
  PRESET_IMAGES: PRESET_IMAGES,
  INITIAL_ISSUES: INITIAL_ISSUES,
  getStoredIssues: getStoredIssues,
  saveStoredIssues: saveStoredIssues,
  resetToDefaultIssues: resetToDefaultIssues
};
