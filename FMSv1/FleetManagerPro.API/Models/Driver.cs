export interface Driver
{
    userId: string; // Foreign key to User
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: string; // ISO date string
  experienceYears: number;
  totalMilesDriven: number;
  safetyRating: number;
  currentVehicleId?: string;
  isAvailable: boolean;
  lastLocationLat?: number;
  lastLocationLng?: number;
  lastLocationUpdated?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  // Navigation properties
  user: User;
  currentVehicle?: Vehicle;
  routes: Route[];
  attendanceRecords: DriverAttendance[];
  leaveRequests: LeaveRequest[];
}

export interface DriverAttendance
{
    id: number;
  driverId: string;
  checkInTime?: string; // ISO date string
  checkOutTime?: string; // ISO date string
  workDate: string; // ISO date string
  totalHours?: number;
  overtimeHours?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string; // ISO date string

  // Navigation property
  driver: Driver;
}

export interface LeaveRequest
{
    id: number;
  driverId: string;
  leaveType: LeaveType;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: string; // ISO date string
  rejectionReason?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  // Navigation properties
  driver: Driver;
  approverUser?: User;
}

// Enums
export enum AttendanceStatus
{
    Present = 'Present',
    Absent = 'Absent',
    Late = 'Late',
    HalfDay = 'HalfDay',
    OnLeave = 'OnLeave',
}

export enum LeaveType
{
    Annual = 'Annual',
    Sick = 'Sick',
    Personal = 'Personal',
    Emergency = 'Emergency',
    Maternity = 'Maternity',
    Paternity = 'Paternity',
    Bereavement = 'Bereavement',
    Other = 'Other',
}

export enum LeaveStatus
{
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Cancelled = 'Cancelled',
}

// Placeholder references for related models
export interface User
{
    id: string;
  name: string;
  email: string;
  // extend later as needed
}

export interface Vehicle
{
    id: string;
  model: string;
  plateNumber: string;
  // extend later as needed
}

export interface Route
{
    id: string;
  name: string;
  // extend later as needed
}