import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

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
    private readonly apiUrl = 'http://localhost:5129/api/auth';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router, private ngZone: NgZone) {
        this.loadStoredUser();
    }

    private loadStoredUser(): void {
        try {
            const storedUser = localStorage.getItem('currentUser');
            const token = localStorage.getItem('token');
            if (storedUser && token) {
                this.currentUserSubject.next(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error loading stored user:', error);
            this.clearStorage();
        }
    }

    login(email: string, password: string): Observable<User | null> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
            map(response => this.handleAuthResponse(response)),
            catchError(error => throwError(() => error))
        );
    }

    private handleAuthResponse(response: LoginResponse): User | null {
        try {
            const tokenString = this.extractToken(response.token);
            if (!tokenString) throw new Error('Token not found');

            localStorage.setItem('token', tokenString);

            const user: User = this.mapToUser(response);

            localStorage.setItem('currentUser', JSON.stringify(user));
            this.ngZone.run(() => this.currentUserSubject.next(user));

            console.log('Created user object:', user);
            return user;
        } catch (error) {
            console.error('Error handling auth response:', error);
            this.clearStorage();
            return null;
        }
    }

    private mapToUser(data: any): User {
        return {
            id: data.id,
            name: data.driver?.fullName || this.sanitize(data.name),
            email: this.sanitize(data.email),
            role: data.role, // Direct string assignment
            status: data.status || 'Active', // Direct string assignment
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
        if (!token) return null;
        if (typeof token === 'string') return token;
        if (typeof token === 'object') return token.token || token.accessToken || null;
        return null;
    }

    private sanitize(value: any): string {
        return value === null || value === undefined || value === 'N/A' ? '' : value;
    }

    getToken(): string | null { return localStorage.getItem('token'); }
    getCurrentUserSync(): User | null { return this.currentUserSubject.value; }
    getCurrentUser(): Observable<User | null> { return this.currentUser$; }
    getCurrentUserId(): string | null { return this.getCurrentUserSync()?.id ?? null; }
    getUserRole(): string | null { return this.getCurrentUserSync()?.role ?? null; } // Return string instead of enum

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp > Math.floor(Date.now() / 1000);
        } catch {
            this.logout();
            return false;
        }
    }

    isDriver(): boolean { return this.getUserRole() === 'Driver'; } // String comparison
    isAdmin(): boolean { return this.getUserRole() === 'Admin'; } // String comparison

    logout(): void {
        this.clearUser();
        this.router.navigate(['/login']);
    }

    private clearUser(): void {
        this.clearStorage();
        this.currentUserSubject.next(null);
    }

    private clearStorage(): void {
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
}