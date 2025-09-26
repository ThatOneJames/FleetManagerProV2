// src/app/models/user.model.ts

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash?: string; // Optional since we don't usually expose this
    role: UserRole;
    phone?: string;
    address?: string;
    dateOfBirth?: string | Date;
    hireDate?: string | Date;
    emergencyContact?: string;
    status: UserStatus;
    profileImageUrl?: string;
    createdAt: string | Date;
    updatedAt: string | Date;

    // Driver-specific fields (these were missing)
    licenseNumber?: string;
    licenseClass?: string;
    licenseExpiry?: string | Date;
    experienceYears?: number;
    safetyRating?: number;
    totalMilesDriven?: number; // This was missing
    currentVehicleId?: string;
    vehicleId?: string; // Added this for auth service compatibility
    isAvailable?: boolean; // This was missing
    hasHelper?: boolean; // This was missing
    lastLocationLat?: number;
    lastLocationLng?: number;
    lastLocationUpdated?: string | Date;
}

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