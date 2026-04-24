export enum UserRole {
  ADMIN = 'ADMIN',
  ALUMNI = 'ALUMNI',
  INDUSTRY = 'INDUSTRY'
}

export enum JobType {
  FULL_TIME = 'Full Time',
  PART_TIME = 'Part Time',
  INTERNSHIP = 'Magang',
  CONTRACT = 'Kontrak'
}

export enum TracerStatus {
  UNEMPLOYED = 'Belum Bekerja',
  WORKING = 'Bekerja',
  STUDYING = 'Kuliah',
  ENTREPRENEUR = 'Wirausaha'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  // Alumni specific - Core
  nis?: string;
  className?: string;
  graduationYear?: number;
  major?: string;
  isValidated?: boolean;
  // Bio Detail
  birthPlace?: string;
  birthDate?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  address?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  noTlp?: string;
  // CV & Skills
  cvSummary?: string;
  skills?: string[];
  cvUrl?: string;
  cvFileName?: string;
  cvBase64?: string;
  // Tracer Data
  tracerStatus?: TracerStatus;
  tracerCompany?: string;
  tracerUniversity?: string;
  tracerBusiness?: string;
}

export interface JobVacancy {
  id: string;
  title: string;
  companyName: string;
  location: string;
  type: JobType;
  description: string;
  requirements: string[];
  postedBy: string;
  createdAt: string;
  isApproved: boolean;
  salaryRange?: string;
  deadline?: string;
  posterUrl?: string;
  rejectionReason?: string;
}

export interface Application {
  id: string;
  jobId: string;
  applicantId: string;
  dateApplied: string;
  status: 'Pending' | 'Interview' | 'Accepted' | 'Rejected';
}

export interface DashboardStats {
  totalAlumni: number;
  totalJobs: number;
  totalPartners: number;
  tracerDistribution: { name: string; value: number }[];
}