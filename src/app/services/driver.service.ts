import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Import the 'map' operator
import { Driver } from '../models/driver.model';
import { User, UserRole } from '../models/user.model'; // Import User and UserRole

@Injectable({
    providedIn: 'root'
})
export class DriverService {
    // FIX: Changed the apiUrl to the general users endpoint
    private apiUrl = 'http://localhost:5129/api/users';

    constructor(private http: HttpClient) { }

    getAllDrivers(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl)
            .pipe(
                // FIX: Filter the users to only include those with the 'Driver' role
                map(users => users.filter(user => user.role === UserRole.Driver))
            );
    }

    // The backend handles all user types, so we can use a more general 'User' type
    getDriverById(id: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

    addDriver(driver: User): Observable<User> {
        return this.http.post<User>(this.apiUrl, driver);
    }

    updateDriver(id: string, driver: User): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, driver);
    }

    deleteDriver(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
