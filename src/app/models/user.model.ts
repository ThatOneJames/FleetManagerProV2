export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver';
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  hireDate?: Date;
  emergencyContact?: string;
  status: 'active' | 'inactive' | 'suspended';
  
  // Driver specific fields
  vehicleId?: string;
  licenseNumber?: string;
  licenseClass?: string;
  licenseExpiry?: Date;
  experienceYears?: number;
  safetyRating?: number;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export enum UserRole {
  Admin = 'admin',
  Driver = 'driver'
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended'
}