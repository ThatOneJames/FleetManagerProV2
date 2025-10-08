import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface MaintenanceRequest {
    id?: string;
    vehicleId: string;
    driverId?: string;
    routeId?: string;
    inspectionId?: string;

    issueType: string;
    issueSeverity: string;
    description: string;
    reportedBy?: string;

    status?: string;
    priority: string;

    reportedDate?: Date;
    scheduledDate?: Date;
    completedDate?: Date;

    assignedMechanic?: string;
    repairNotes?: string;
    estimatedCost?: number;
    actualCost?: number;

    createdAt?: Date;
    updatedAt?: Date;

    vehicle?: any;
    driver?: any;
    route?: any;
}

@Injectable({
    providedIn: 'root'
})
export class MaintenanceRequestService {
    private readonly apiUrl = 'https://fleetmanagerprov2-production.up.railway.app/api/maintenancerequest';

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

    createRequest(request: MaintenanceRequest): Observable<MaintenanceRequest> {
        return this.http.post<MaintenanceRequest>(
            this.apiUrl,
            request,
            { headers: this.getHeaders() }
        );
    }

    getRequestById(id: string): Observable<MaintenanceRequest> {
        return this.http.get<MaintenanceRequest>(
            `${this.apiUrl}/${id}`,
            { headers: this.getHeaders() }
        );
    }

    getMyRequests(): Observable<MaintenanceRequest[]> {
        return this.http.get<MaintenanceRequest[]>(
            `${this.apiUrl}/my-requests`,
            { headers: this.getHeaders() }
        );
    }

    getAllRequests(): Observable<MaintenanceRequest[]> {
        return this.http.get<MaintenanceRequest[]>(
            this.apiUrl,
            { headers: this.getHeaders() }
        );
    }

    updateRequestStatus(id: string, status: string, mechanic?: string, notes?: string): Observable<void> {
        return this.http.put<void>(
            `${this.apiUrl}/${id}/status`,
            { status, assignedMechanic: mechanic, repairNotes: notes },
            { headers: this.getHeaders() }
        );
    }

    checkVehicleAssignment(vehicleId: string): Observable<{ hasAssignment: boolean; vehicleId: string }> {
        return this.http.get<{ hasAssignment: boolean; vehicleId: string }>(
            `${this.apiUrl}/check-vehicle/${vehicleId}`,
            { headers: this.getHeaders() }
        );
    }
}
