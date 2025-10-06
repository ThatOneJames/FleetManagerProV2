import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private readonly apiUrl = 'https://fleetmanagerprov2-production.up.railway.app/api/maps';

    constructor(private http: HttpClient) { }

    getRoute(start: string, end: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/route?start=${start}&end=${end}`);
    }

    getLiveLocation(vehicleId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/location/${vehicleId}`);
    }
}
