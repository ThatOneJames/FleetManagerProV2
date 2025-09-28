import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vehicle, CreateVehicleDto, UpdateVehicleDto } from '../models/vehicle.model';

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    private apiUrl = 'http://localhost:5129/api/vehicles';

    constructor(private http: HttpClient) { }

    getAllVehicles(): Observable<Vehicle[]> {
        return this.http.get<Vehicle[]>(this.apiUrl);
    }

    getVehicleById(id: string): Observable<Vehicle> {
        return this.http.get<Vehicle>(`${this.apiUrl}/${id}`);
    }

    // FIX: This method now accepts CreateVehicleDto instead of Vehicle
    addVehicle(vehicleDto: CreateVehicleDto): Observable<any> {
        // The backend's POST endpoint for vehicles
        return this.http.post<any>(this.apiUrl, vehicleDto);
    }

    updateVehicle(id: string, vehicle: Vehicle): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, vehicle);
    }

    deleteVehicle(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
