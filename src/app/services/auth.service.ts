import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { DriverWarning } from '../models/driver-warning.model';
import { DriverSuspension } from '../models/driver-suspension.model';
import { environment } from '../../environments/environment';

export interface LoginResponse {
    token: any;
    id: string;
    name: string;
    email: string;
    role: string;
    driver?: {
        fullName?: string;
        contactNumber?: string;
        currentVehicleId?: string;
        licenseNumber?: string;
        licenseClass?: string;
        licenseExpiry?: string;
        experienceYears?: number;
        safetyRating?: number;
        address?: string;
        dateOfBirth?: string;
        hireDate?: string;
        emergencyContact?: string;
        profileImageUrl?: string;
    };
    status?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    hireDate?: string;
    emergencyContact?: string;
    profileImageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly apiUrl = `${environment.apiUrl}/auth`;
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router, private ngZone: NgZone) {
        this.loadStoredUser();
    }

    private loadStoredUser(): void {
        try {
            const storedUser = localStorage.getItem('currentUser');
            const token = localStorage.getItem('token');
            console.log('🔄 Loading stored user on service init...');
            console.log('💾 Stored user exists:', !!storedUser);
            console.log('🔑 Stored token exists:', !!token);

            if (storedUser && token) {
                console.log('✅ Both user and token found in storage');
                this.currentUserSubject.next(JSON.parse(storedUser));
            } else {
                console.log('❌ Missing user or token in storage');
            }
        } catch (error) {
            console.error('❌ Error loading stored user:', error);
            this.clearStorage();
        }
    }

    login(email: string, password: string): Observable<User | null> {
        console.log('🔐 Starting login process for:', email);

        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
            tap(response => {
                console.log('📨 Raw login response received:', response);
                console.log('🔑 Token in response:', response.token);
                console.log('🔑 Token type:', typeof response.token);
                console.log('👤 User data in response:', {
                    id: response.id,
                    name: response.name,
                    email: response.email,
                    role: response.role
                });
            }),
            map(response => this.handleAuthResponse(response)),
            catchError(error => {
                console.error('❌ Login error:', error);
                return throwError(() => error);
            })
        );
    }

    private handleAuthResponse(response: LoginResponse): User | null {
        try {
            console.log('🔄 Processing auth response...');

            const tokenString = this.extractToken(response.token);
            console.log('🔍 Extracted token:', tokenString ? `${tokenString.substring(0, 50)}...` : 'null');

            if (!tokenString) {
                console.error('❌ No token could be extracted from response');
                throw new Error('Token not found');
            }

            // Debug
            localStorage.setItem('token', tokenString);
            console.log('💾 Token stored in localStorage');

            const storedToken = localStorage.getItem('token');
            console.log('✅ Verification - token retrieved from storage:', storedToken ? 'Success' : 'Failed');

            const user: User = this.mapToUser(response);
            console.log('👤 Mapped user object:', user);

            localStorage.setItem('currentUser', JSON.stringify(user));
            console.log('💾 User stored in localStorage');

            this.ngZone.run(() => {
                console.log('🔄 Updating currentUserSubject...');
                this.currentUserSubject.next(user);
            });

            console.log('✅ Auth response handled successfully');
            return user;
        } catch (error) {
            console.error('❌ Error handling auth response:', error);
            this.clearStorage();
            return null;
        }
    }

    private mapToUser(data: any): User {
        return {
            id: data.id,
            name: data.driver?.fullName || this.sanitize(data.name),
            email: this.sanitize(data.email),
            role: data.role,
            status: data.status || 'Active',
            phone: this.sanitize(data.phone),
            address: data.driver?.address || this.sanitize(data.address),
            dateOfBirth: data.driver?.dateOfBirth ? new Date(data.driver.dateOfBirth)
                : data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            hireDate: data.driver?.hireDate ? new Date(data.driver.hireDate)
                : data.hireDate ? new Date(data.hireDate) : undefined,
            emergencyContact: data.driver?.emergencyContact || this.sanitize(data.emergencyContact),
            profileImageUrl: data.driver?.profileImageUrl || this.sanitize(data.profileImageUrl),
            vehicleId: data.driver?.currentVehicleId,
            licenseNumber: data.driver?.licenseNumber ?? 'N/A',
            licenseClass: data.driver?.licenseClass ?? 'N/A',
            licenseExpiry: data.driver?.licenseExpiry ? new Date(data.driver.licenseExpiry) : undefined,
            experienceYears: data.driver?.experienceYears ?? 0,
            safetyRating: data.driver?.safetyRating ?? 0,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
    }

    private extractToken(token: any): string | null {
        console.log('🔍 Extracting token from:', token, 'Type:', typeof token);

        if (!token) {
            console.log('❌ Token is null/undefined');
            return null;
        }

        if (typeof token === 'string') {
            console.log('✅ Token is string, returning as-is');
            return token;
        }

        if (typeof token === 'object') {
            console.log('🔍 Token is object, looking for token properties...');
            const extracted = token.token || token.accessToken || null;
            console.log('🔍 Extracted from object:', extracted);
            return extracted;
        }

        console.log('❌ Token type not recognized');
        return null;
    }

    private sanitize(value: any): string {
        return value === null || value === undefined || value === 'N/A' ? '' : value;
    }

    getToken(): string | null {
        const token = localStorage.getItem('token');
        console.log('🔑 getToken() called, returning:', token ? `Token found (${token.substring(0, 20)}...)` : 'null');
        return token;
    }

    getCurrentUserSync(): User | null { return this.currentUserSubject.value; }
    getCurrentUser(): Observable<User | null> { return this.currentUser$; }
    getCurrentUserId(): string | null { return this.getCurrentUserSync()?.id ?? null; }
    getUserRole(): string | null { return this.getCurrentUserSync()?.role ?? null; }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) {
            console.log('❌ No token for authentication check');
            return false;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isValid = payload.exp > Math.floor(Date.now() / 1000);
            console.log('🔐 Token validation result:', isValid ? 'Valid' : 'Expired');
            if (!isValid) this.logout();
            return isValid;
        } catch (error) {
            console.error('❌ Token validation error:', error);
            this.logout();
            return false;
        }
    }

    isDriver(): boolean { return this.getUserRole() === 'Driver'; }
    isAdmin(): boolean { return this.getUserRole() === 'Admin'; }

    logout(): void {
        console.log('🚪 Logging out...');
        this.clearUser();
        this.router.navigate(['/login']);
    }

    private clearUser(): void {
        this.clearStorage();
        this.currentUserSubject.next(null);
    }

    private clearStorage(): void {
        console.log('🗑️ Clearing all storage...');
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('currentUser');
    }

    refreshCurrentUser(): Observable<User> {
        return this.http.get<any>(`${this.apiUrl}/current`).pipe(
            map(data => {
                const user = this.mapToUser(data);
                localStorage.setItem('currentUser', JSON.stringify(user));
                this.ngZone.run(() => this.currentUserSubject.next(user));
                return user;
            }),
            catchError(err => throwError(() => err))
        );
    }
    addWarning(driverId: string, reason: string, issuedBy: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/users/${driverId}/warnings`, { reason, issuedBy });
    }

    getWarnings(driverId: string): Observable<DriverWarning[]> {
        return this.http.get<DriverWarning[]>(`${this.apiUrl}/users/${driverId}/warnings`);
    }

    getSuspensionHistory(driverId: string): Observable<DriverSuspension[]> {
        return this.http.get<DriverSuspension[]>(`${this.apiUrl}/users/${driverId}/suspensions`);
    }
}