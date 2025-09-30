import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RouteStop {
    id?: string;
    routeId?: string;
    stopOrder: number;
    address: string;
    latitude?: number;
    longitude?: number;
    estimatedArrival?: Date;
    actualArrival?: Date;
    estimatedDeparture?: Date;
    actualDeparture?: Date;
    priority: string;
    status?: string;
    notes?: string;
    contactName?: string;
    contactPhone?: string;
}

export interface Route {
    id?: string;
    name: string;
    description?: string;
    vehicleId: string;
    vehiclePlate?: string;
    driverId: string;
    driverName?: string;
    status?: string;
    totalDistance?: number;
    estimatedDuration?: number;
    fuelEstimate?: number;
    startTime?: Date;
    endTime?: Date;
    actualDuration?: number;
    createdAt?: Date;
    stops: RouteStop[];
}

export interface CreateRoute {
    name: string;
    description?: string;
    vehicleId: string;
    driverId: string;
    stops: CreateRouteStop[];
}

export interface CreateRouteStop {
    stopOrder: number;
    address: string;
    latitude?: number;
    longitude?: number;
    estimatedArrival?: Date;
    estimatedDeparture?: Date;
    priority: string;
    notes?: string;
    contactName?: string;
    contactPhone?: string;
}

export interface UpdateRoute {
    name?: string;
    description?: string;
    vehicleId?: string;
    driverId?: string;
    status?: string;
    startTime?: Date;
    endTime?: Date;
}

export interface UpdateStopStatus {
    status: string;
    actualArrival?: Date;
    actualDeparture?: Date;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class RouteService {
    private apiUrl = `${environment.apiUrl}/routes`;

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        });
    }

    getAllRoutes(): Observable<Route[]> {
        return this.http.get<Route[]>(this.apiUrl, { headers: this.getHeaders() });
    }

    getRouteById(id: string): Observable<Route> {
        return this.http.get<Route>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    getRoutesByVehicle(vehicleId: string): Observable<Route[]> {
        return this.http.get<Route[]>(`${this.apiUrl}/vehicle/${vehicleId}`, { headers: this.getHeaders() });
    }

    getRoutesByDriver(driverId: string): Observable<Route[]> {
        return this.http.get<Route[]>(`${this.apiUrl}/driver/${driverId}`, { headers: this.getHeaders() });
    }

    getRoutesByStatus(status: string): Observable<Route[]> {
        return this.http.get<Route[]>(`${this.apiUrl}/status/${status}`, { headers: this.getHeaders() });
    }

    createRoute(route: CreateRoute): Observable<Route> {
        return this.http.post<Route>(this.apiUrl, route, { headers: this.getHeaders() });
    }

    updateRoute(id: string, route: UpdateRoute): Observable<Route> {
        return this.http.put<Route>(`${this.apiUrl}/${id}`, route, { headers: this.getHeaders() });
    }

    deleteRoute(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
    }

    updateStopStatus(stopId: string, update: UpdateStopStatus): Observable<RouteStop> {
        return this.http.patch<RouteStop>(`${this.apiUrl}/stops/${stopId}/status`, update, { headers: this.getHeaders() });
    }

    optimizeRoute(id: string): Observable<Route> {
        return this.http.post<Route>(`${this.apiUrl}/${id}/optimize`, {}, { headers: this.getHeaders() });
    }
}