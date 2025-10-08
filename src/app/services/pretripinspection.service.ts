import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface PreTripInspection {
    id?: string;
    routeId: string;
    vehicleId: string;
    driverId?: string;
    inspectionDate?: Date;

    // Checklist items
    engineOilOk: boolean;
    coolantOk: boolean;
    batteryOk: boolean;
    brakesOk: boolean;
    dashboardWarningLights: boolean;
    tirePressureOk: boolean;
    tireTreadOk: boolean;
    tireDamageCheck: boolean;
    wheelLugsOk: boolean;
    headlightsOk: boolean;
    brakeLightsOk: boolean;
    turnSignalsOk: boolean;
    hazardLightsOk: boolean;
    seatbeltsOk: boolean;
    fireExtinguisherPresent: boolean;
    firstAidKitPresent: boolean;
    warningTrianglesPresent: boolean;
    mirrorsOk: boolean;
    windshieldWipersOk: boolean;
    hornWorking: boolean;
    doorsAndLocksOk: boolean;

    allItemsPassed?: boolean;
    notes?: string;
    issuesFound?: string;
    maintenanceRequestId?: string;

    createdAt?: Date;
    updatedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class PreTripInspectionService {
    private readonly apiUrl = 'https://fleetmanagerprov2-production.up.railway.app/api/pretripinspection';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    }

    createInspection(inspection: PreTripInspection): Observable<PreTripInspection> {
        return this.http.post<PreTripInspection>(
            this.apiUrl,
            inspection,
            { headers: this.getHeaders() }
        );
    }

    getInspectionById(id: string): Observable<PreTripInspection> {
        return this.http.get<PreTripInspection>(
            `${this.apiUrl}/${id}`,
            { headers: this.getHeaders() }
        );
    }

    getInspectionByRoute(routeId: string): Observable<PreTripInspection> {
        return this.http.get<PreTripInspection>(
            `${this.apiUrl}/route/${routeId}`,
            { headers: this.getHeaders() }
        );
    }

    getMyInspections(): Observable<PreTripInspection[]> {
        return this.http.get<PreTripInspection[]>(
            `${this.apiUrl}/my-inspections`,
            { headers: this.getHeaders() }
        );
    }
}
