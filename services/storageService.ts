import { User, JobVacancy, Application, UserRole, TracerStatus, JobType } from '../types';

const STORAGE_KEYS = {
  USERS: 'bkk_users',
  JOBS: 'bkk_jobs',
  APPLICATIONS: 'bkk_applications',
  CURRENT_USER: 'bkk_current_user',
  MAJORS: 'bkk_majors',
  YEARS: 'bkk_years'
};

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { id: '1', name: 'Admin Sekolah', email: 'admin@smk1.sch.id', role: UserRole.ADMIN, password: '123' },
  { id: '2', name: 'PT Astra Honda', email: 'hrd@astra.com', role: UserRole.INDUSTRY, password: '123' },
  // Removed mock alumni to rely on login or registration
];

const INITIAL_JOBS: JobVacancy[] = [
  {
    id: '101', title: 'Mekanik Junior', companyName: 'PT Astra Honda', location: 'Jakarta Utara',
    type: JobType.FULL_TIME, description: 'Dibutuhkan mekanik junior lulusan SMK.', requirements: ['SMK TKRO/MK', 'Usia Max 21'],
    postedBy: '2', createdAt: new Date().toISOString(), isApproved: true, salaryRange: '4.500.000 - 5.000.000'
  },
  {
    id: '102', title: 'Staff Gudang', companyName: 'PT Logistics Jaya', location: 'Jakarta Utara',
    type: JobType.CONTRACT, description: 'Mengurus dokumen jalan dan input data.', requirements: ['SMK Teknik Logistik', 'Menguasai Excel'],
    postedBy: '1', createdAt: new Date().toISOString(), isApproved: true, salaryRange: 'UMR Jakarta'
  }
];

const INITIAL_MAJORS = [
  'Pemesinan Kapal (MK)',
  'Teknik Kendaraan Ringan Otomotif (TKRO)',
  'Desain Komunikasi Visual (DKV)',
  'Teknik Logistik (TL)'
];

const INITIAL_YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

export const StorageService = {
  // Initialize
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(INITIAL_JOBS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAJORS)) {
      localStorage.setItem(STORAGE_KEYS.MAJORS, JSON.stringify(INITIAL_MAJORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.YEARS)) {
      localStorage.setItem(STORAGE_KEYS.YEARS, JSON.stringify(INITIAL_YEARS));
    }
  },

  // Users
  getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
  
  saveUser: (user: User) => {
    const users = StorageService.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // Used when logging in from Sheet to ensure user exists in local DB
  syncUser: (user: User) => {
    const users = StorageService.getUsers();
    const existingIndex = users.findIndex(u => u.email === user.email); // using email/username as key
    if (existingIndex >= 0) {
      // Update existing record but keep data that isn't in the sheet (like validation status if already validated)
      const existing = users[existingIndex];
      // If manually validated in local storage, keep it validated even if sheet says otherwise (or handle priority)
      // Here we prioritize local existing state for validation if it exists
      users[existingIndex] = { ...existing, ...user, id: existing.id, isValidated: existing.isValidated || user.isValidated }; 
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  // New Registration Method
  registerUser: (user: User): boolean => {
    const users = StorageService.getUsers();
    // Check if NIS (email) already exists
    if (users.some(u => u.email === user.email)) {
      return false; // User exists
    }
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  },

  validateAlumni: (id: string) => {
    const users = StorageService.getUsers();
    const updated = users.map(u => u.id === id ? { ...u, isValidated: true } : u);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
  },

  // Master Data
  getMajors: (): string[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.MAJORS) || '[]'),
  addMajor: (major: string) => {
    const list = StorageService.getMajors();
    if (!list.includes(major)) {
      list.push(major);
      localStorage.setItem(STORAGE_KEYS.MAJORS, JSON.stringify(list));
    }
  },
  deleteMajor: (major: string) => {
    const list = StorageService.getMajors().filter(m => m !== major);
    localStorage.setItem(STORAGE_KEYS.MAJORS, JSON.stringify(list));
  },
  getYears: (): number[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.YEARS) || '[]'),
  addYear: (year: number) => {
    const list = StorageService.getYears();
    if (!list.includes(year)) {
      list.push(year);
      list.sort((a, b) => a - b);
      localStorage.setItem(STORAGE_KEYS.YEARS, JSON.stringify(list));
    }
  },
  deleteYear: (year: number) => {
    const list = StorageService.getYears().filter(y => y !== year);
    localStorage.setItem(STORAGE_KEYS.YEARS, JSON.stringify(list));
  },

  // Jobs
  getJobs: (): JobVacancy[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]'),
  saveJob: (job: JobVacancy) => {
    const jobs = StorageService.getJobs();
    const existingIndex = jobs.findIndex(j => j.id === job.id);
    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.push(job);
    }
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  },
  deleteJob: (id: string) => {
    const jobs = StorageService.getJobs().filter(j => j.id !== id);
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  },

  // Applications
  getApplications: (): Application[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]'),
  applyJob: (app: Application) => {
    const apps = StorageService.getApplications();
    apps.push(app);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  },

  // Session
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },
  setCurrentUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  login: (email: string): User | null => {
    const users = StorageService.getUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    return null;
  },
  // Used for manual login (checking password)
  authenticateLocal: (nis: string, pass: string): User | null => {
     const users = StorageService.getUsers();
     const user = users.find(u => u.email === nis && u.password === pass && u.role === UserRole.ALUMNI);
     return user || null;
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Stats for Admin
  getStats: (): any => {
    const users = StorageService.getUsers();
    const jobs = StorageService.getJobs();
    const alumni = users.filter(u => u.role === UserRole.ALUMNI);
    
    const tracerData = [
      { name: TracerStatus.WORKING, value: alumni.filter(a => a.tracerStatus === TracerStatus.WORKING).length },
      { name: TracerStatus.STUDYING, value: alumni.filter(a => a.tracerStatus === TracerStatus.STUDYING).length },
      { name: TracerStatus.ENTREPRENEUR, value: alumni.filter(a => a.tracerStatus === TracerStatus.ENTREPRENEUR).length },
      { name: TracerStatus.UNEMPLOYED, value: alumni.filter(a => a.tracerStatus === TracerStatus.UNEMPLOYED).length },
    ];

    return {
      totalAlumni: alumni.length,
      totalJobs: jobs.length,
      totalPartners: users.filter(u => u.role === UserRole.INDUSTRY).length,
      tracerDistribution: tracerData
    };
  }
};