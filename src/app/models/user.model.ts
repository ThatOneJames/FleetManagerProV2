export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole; // Use the UserRole enum
    phone?: string;
    address?: string;
    dateOfBirth?: Date;
    hireDate?: Date;
    emergencyContact?: string;
    status: UserStatus;

    profileImageUrl?: string;

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
    Admin = 0,
    Driver = 1
}

export enum UserStatus {
    Active = 0,
    Inactive = 1,
    Suspended = 2
}
