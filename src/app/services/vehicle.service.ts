import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    private apiUrl = 'http://localhost:5000/api/vehicles';

    constructor(private http: HttpClient) { }

    getAllVehicles(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getVehicleById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    addVehicle(vehicle: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, vehicle);
    }

    updateVehicle(id: number, vehicle: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, vehicle);
    }

    deleteVehicle(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }
}
