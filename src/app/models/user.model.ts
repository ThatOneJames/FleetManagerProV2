// src/app/models/user.model.ts

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash?: string;
    role: string; // Changed from UserRole enum to string
    phone?: string;
    address?: string;
    dateOfBirth?: string | Date;
    hireDate?: string | Date;
    emergencyContact?: string;
    status: string; // Changed from UserStatus enum to string
    profileImageUrl?: string;
    createdAt: string | Date;
    updatedAt: string | Date;

    // Driver-specific fields
    licenseNumber?: string;
    licenseClass?: string;
    licenseExpiry?: string | Date;
    experienceYears?: number;
    safetyRating?: number;
    totalMilesDriven?: number;
    currentVehicleId?: string;
    vehicleId?: string; // For auth service compatibility
    isAvailable?: boolean;
    hasHelper?: boolean;
    lastLocationLat?: number;
    lastLocationLng?: number;
    lastLocationUpdated?: string | Date;
}

// Keep enums for reference/conversion if needed
export enum UserRole {
    Admin = 0,
    Driver = 1,
    Manager = 2
}

export enum UserStatus {
    Active = 0,
    Inactive = 1,
    Suspended = 2
}