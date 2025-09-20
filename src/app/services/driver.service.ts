import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { CreateDriverDto } from '../models/driver-dto.model';

@Injectable({
    providedIn: 'root'
})
export class DriverService {
    // FIX: Changed the apiUrl to the general users endpoint
    private apiUrl = 'http://localhost:5129/api';

    constructor(private http: HttpClient) { }

    getAllDrivers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/users`)
            .pipe(
                // FIX: Filter the users to only include those with the 'Driver' role
                // by comparing the integer value returned from the backend.
                map(users => users.filter(user => user.role === UserRole.Driver))
            );
    }

    // The backend handles all user types, so we can use a more general 'User' type
    getDriverById(id: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/users/${id}`);
    }

    addDriver(driverDto: CreateDriverDto): Observable<any> {
        // This method now accepts the CreateDriverDto and posts to a specific driver endpoint
        // It's assumed the backend will handle creating both the User and Driver records
        return this.http.post<any>(`${this.apiUrl}/drivers/add`, driverDto);
    }

    updateDriver(id: string, driver: User): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/users/${id}`, driver);
    }

    deleteDriver(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/users/${id}`);
    }
}
