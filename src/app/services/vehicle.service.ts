import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehicle } from '../models/vehicle.model';

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    // FIX: Updated the API URL to match the one in the user's provided file
    private apiUrl = 'http://localhost:5129/api/vehicles';

    constructor(private http: HttpClient) { }

    // FIX: Use the Vehicle interface for type safety
    getAllVehicles(): Observable<Vehicle[]> {
        return this.http.get<Vehicle[]>(this.apiUrl);
    }

    // FIX: Use the Vehicle interface for type safety
    getVehicleById(id: string): Observable<Vehicle> {
        return this.http.get<Vehicle>(`${this.apiUrl}/${id}`);
    }

    // FIX: Use the Vehicle interface for type safety
    addVehicle(vehicle: Vehicle): Observable<any> {
        return this.http.post<any>(this.apiUrl, vehicle);
    }

    // FIX: Use the Vehicle interface for type safety
    updateVehicle(id: string, vehicle: Vehicle): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, vehicle);
    }

    // FIX: Use the Vehicle interface for type safety
    deleteVehicle(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
