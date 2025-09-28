// src/app/models/vehicle.model.ts
export interface Vehicle {
    id: string;
    categoryId: string; // Changed from number to string to match backend
    categoryName?: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    vin?: string; // Made optional
    color?: string; // Made optional to match backend
    fuelType: string; // Changed from union type to string
    fuelCapacity?: number; // Made optional
    currentMileage: number;
    status: string; // Changed from union type to string
    currentDriverId?: string;
    currentDriverName?: string; // Added for template
    currentLocationLat?: number;
    currentLocationLng?: number;
    lastLocationUpdated?: Date;
    fuelLevel: number;
    registrationExpiry: Date | string;
    insuranceExpiry: Date | string;
    insurancePolicy?: string; // Made optional
    purchaseDate?: Date | string;
    purchasePrice?: number;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface VehicleCategory {
    id: string; // Changed from number to string to match backend
    name: string;
    description?: string; // Made optional
    createdAt: Date | string;
}

export interface CreateVehicleDto {
    categoryId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color?: string;
    fuelType: string;
    fuelCapacity?: number;
    currentMileage: number;
    status: string;
    fuelLevel: number;
    registrationExpiry: string;
    insuranceExpiry: string;
    insurancePolicy?: string;
    purchaseDate?: string;
    purchasePrice?: number;
}

export interface UpdateVehicleDto {
    categoryId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color?: string;
    fuelType: string;
    fuelCapacity?: number;
    currentMileage: number;
    status: string;
    currentDriverId?: string;
    fuelLevel: number;
    registrationExpiry: string;
    insuranceExpiry: string;
    insurancePolicy?: string;
    purchaseDate?: string;
    purchasePrice?: number;
}

export interface Route {
    id: string;
    name: string;
    description: string;
    vehicleId?: string;
    driverId?: string;
    status: 'draft' | 'active' | 'completed' | 'cancelled' | 'optimized';
    totalDistance: number;
    estimatedDuration: number;
    fuelEstimate: number;
    startTime?: Date;
    endTime?: Date;
    actualDuration?: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    stops: RouteStop[];
}

export interface RouteStop {
    id: number;
    routeId: string;
    stopOrder: number;
    address: string;
    latitude?: number;
    longitude?: number;
    estimatedArrival?: Date;
    actualArrival?: Date;
    estimatedDeparture?: Date;
    actualDeparture?: Date;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'current' | 'completed' | 'skipped';
    notes?: string;
    contactName?: string;
    contactPhone?: string;
}

// Enums for reference (but we use strings in the actual data)
export enum FuelType {
    Gasoline = 'Gasoline',
    Diesel = 'Diesel',
    Electric = 'Electric',
    Hybrid = 'Hybrid'
}

export enum VehicleStatus {
    Ready = 'Ready',
    Active = 'Active',
    Maintenance = 'Maintenance',
    Inactive = 'Inactive',
    OnRoute = 'OnRoute',
    Retired = 'Retired',
    NotAvailable = 'NotAvailable',
    InUse = 'InUse',
    OutOfService = 'OutOfService'
}