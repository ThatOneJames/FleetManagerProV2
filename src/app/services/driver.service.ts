import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';

export interface CreateDriverDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    emergencyContact?: string;
    licenseNumber?: string;
    licenseClass?: string;
    licenseExpiry?: string;
    experienceYears?: number;
    safetyRating?: number;
    role: string;
    status: string;
    isAvailable: boolean;
    hasHelper: boolean;
    totalMilesDriven: number;
}

export interface UpdateDriverDto {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    hireDate?: string;
    emergencyContact?: string;
    profileImageUrl?: string;
    status?: string;
    licenseNumber?: string;
    licenseClass?: string;
    licenseExpiry?: string;
    experienceYears?: number;
    safetyRating?: number;
    totalMilesDriven?: number;
    isAvailable?: boolean;
    hasHelper?: boolean;
}

export interface UpdateStatusDto {
    status: string;
}

export interface UpdateAvailabilityDto {
    isAvailable: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class DriverService {
    private readonly apiUrl = 'http://localhost:5129/api';

    constructor(private http: HttpClient) { }

    // Get all users and filter for drivers
    getAllDrivers(): Observable<User[]> {
        return this.http.get<any[]>(`${this.apiUrl}/users`)
            .pipe(
                map(users => {
                    console.log('Raw users from API:', users); // Debug log
                    // Filter for drivers on the frontend
                    const drivers = users.filter(user => {
                        // Handle both string and enum role types
                        const roleString = typeof user.role === 'string' ? user.role : this.getRoleString(user.role);
                        return roleString === 'Driver';
                    });
                    console.log('Filtered drivers:', drivers); // Debug log
                    return drivers as User[];
                }),
                catchError(this.handleError)
            );
    }

    // Get all users (for admin purposes)
    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/users`)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Get driver by ID
    getDriverById(id: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/users/${id}`)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Create a new driver (through auth/register endpoint)
    createDriver(driverDto: CreateDriverDto): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/register`, driverDto)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Update driver information
    updateDriver(id: string, updateDto: UpdateDriverDto): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/users/${id}`, updateDto)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Delete driver
    deleteDriver(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/users/${id}`)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Quick status update
    updateDriverStatus(id: string, status: string): Observable<any> {
        const statusDto: UpdateStatusDto = { status };
        return this.http.patch<any>(`${this.apiUrl}/users/${id}/status`, statusDto)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Quick availability toggle
    updateDriverAvailability(id: string, isAvailable: boolean): Observable<any> {
        const availabilityDto: UpdateAvailabilityDto = { isAvailable };
        return this.http.patch<any>(`${this.apiUrl}/users/${id}/availability`, availabilityDto)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Get drivers with specific status
    getDriversByStatus(status: string): Observable<User[]> {
        return this.getAllDrivers().pipe(
            map(drivers => drivers.filter(driver =>
                this.getStatusString(driver.status) === status
            ))
        );
    }

    // Get available drivers
    getAvailableDrivers(): Observable<User[]> {
        return this.getAllDrivers().pipe(
            map(drivers => drivers.filter(driver => driver.isAvailable))
        );
    }

    // Get drivers with expiring licenses (within 30 days)
    getDriversWithExpiringLicenses(): Observable<User[]> {
        return this.getAllDrivers().pipe(
            map(drivers => drivers.filter(driver => this.isLicenseExpiringSoon(driver)))
        );
    }

    // Helper methods
    private getRoleString(role: number): string {
        switch (role) {
            case 0: return 'Admin';
            case 1: return 'Driver';
            case 2: return 'Manager';
            default: return 'Unknown';
        }
    }

    private getStatusString(status: string): string {
        switch (status) {
            case 'Active': return 'Active';
            case 'Inactive': return 'Inactive';
            case 'Suspended': return 'Suspended';
            default: return 'Unknown';
        }
    }

    private isLicenseExpiringSoon(driver: User): boolean {
        if (!driver.licenseExpiry) return false;

        const expiryDate = new Date(driver.licenseExpiry);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
    }

    // Bulk operations (for future enhancement)
    bulkUpdateStatus(driverIds: string[], status: string): Observable<any> {
        const bulkDto = {
            driverIds,
            status,
            action: 'updateStatus'
        };
        return this.http.patch<any>(`${this.apiUrl}/users/bulk-update`, bulkDto)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Export drivers data
    exportDriversData(): Observable<User[]> {
        return this.getAllDrivers();
    }

    // Search drivers
    searchDrivers(searchTerm: string): Observable<User[]> {
        return this.getAllDrivers().pipe(
            map(drivers => drivers.filter(driver =>
                driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                driver.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                driver.phone?.toLowerCase().includes(searchTerm.toLowerCase())
            ))
        );
    }

    // Error handling
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An unknown error occurred';

        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            if (error.status === 400 && error.error?.message) {
                errorMessage = error.error.message;
            } else if (error.status === 404) {
                errorMessage = 'Resource not found';
            } else if (error.status === 500) {
                errorMessage = 'Internal server error. Please try again later.';
            } else {
                errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
            }
        }

        console.error('DriverService Error:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}