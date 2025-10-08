import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouteService, Route, RouteStop } from '../../../services/route.service';
import { AuthService } from '../../../services/auth.service';
import { PreTripInspectionService } from '../../../services/pretripinspection.service';

@Component({
    selector: 'app-routes-trips',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './routes-trips.component.html',
    styleUrls: ['./routes-trips.component.css']
})
export class RoutesTripsComponent implements OnInit {
    assignedRoutes: Route[] = [];
    loading: boolean = false;
    errorMessage: string = '';
    selectedRoute: Route | null = null;
    showRouteDetails: boolean = false;
    currentUserId: string = '';
    routeInspections: Map<string, any> = new Map();

    showInspectionModal = false;
    inspectionModalTitle = '';
    inspectionModalMessage = '';
    inspectionModalType: 'warning' | 'error' = 'warning';
    pendingRouteId: string | null = null;

    constructor(
        private routeService: RouteService,
        private authService: AuthService,
        private http: HttpClient,
        private router: Router,
        private inspectionService: PreTripInspectionService
    ) { }

    ngOnInit(): void {
        this.currentUserId = this.authService.getCurrentUserId() || '';
        this.loadAssignedRoutes();
    }

    loadAssignedRoutes(): void {
        this.loading = true;
        this.routeInspections.clear();

        this.routeService.getRoutesByDriver(this.currentUserId).subscribe({
            next: (routes) => {
                this.assignedRoutes = routes;
                this.checkInspectionsForRoutes(routes);
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading assigned routes:', error);
                this.errorMessage = 'Failed to load assigned routes';
                this.loading = false;
            }
        });
    }

    private checkInspectionsForRoutes(routes: Route[]): void {
        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        routes.forEach(route => {
            if (route.id && route.vehicleId && route.status === 'planned') {
                this.http.get<any>(
                    `https://fleetmanagerprov2-production.up.railway.app/api/pretripinspection/check-today/${route.vehicleId}`,
                    { headers }
                ).subscribe({
                    next: (response) => {
                        this.routeInspections.set(route.id!, response);
                        console.log(`Inspection for route ${route.id}:`, response);
                    },
                    error: (err) => {
                        console.error(`Error checking inspection for route ${route.id}:`, err);
                        this.routeInspections.set(route.id!, { hasInspection: false });
                    }
                });
            }
        });
    }

    hasPassedInspection(routeId: string): boolean {
        const inspectionData = this.routeInspections.get(routeId);
        return inspectionData?.hasInspection === true && inspectionData?.inspection?.result === 'Pass';
    }

    getInspectionStatus(routeId: string): string {
        const inspectionData = this.routeInspections.get(routeId);

        if (!inspectionData || !inspectionData.hasInspection) {
            return 'Inspection Required';
        }

        if (inspectionData.inspection?.result === 'Pass') {
            return 'Inspection Complete ✓';
        }

        if (inspectionData.inspection?.result === 'Fail') {
            return 'Inspection Failed';
        }

        return 'Inspection Pending';
    }

    // ✅ NEW: Check if driver has an active trip
    hasActiveTripInProgress(): boolean {
        return this.assignedRoutes.some(route => route.status === 'in_progress');
    }

    startTrip(route: Route): void {
        this.pendingRouteId = route.id!;

        // ✅ Check if driver already has an active trip
        if (this.hasActiveTripInProgress()) {
            this.inspectionModalTitle = '🚫 Active Trip In Progress';
            this.inspectionModalMessage = 'You already have a trip in progress. Please complete your current trip before starting a new one.';
            this.inspectionModalType = 'error';
            this.showInspectionModal = true;
            return;
        }

        const inspectionData = this.routeInspections.get(route.id!);

        if (!inspectionData || !inspectionData.hasInspection) {
            this.inspectionModalTitle = '⚠️ Pre-Trip Inspection Required';
            this.inspectionModalMessage = 'You must complete a pre-trip inspection before starting this trip. This is a safety requirement.';
            this.inspectionModalType = 'warning';
            this.showInspectionModal = true;
            return;
        }

        if (inspectionData.inspection?.result === 'Fail') {
            this.inspectionModalTitle = '🚫 Vehicle Not Ready';
            this.inspectionModalMessage = 'Your pre-trip inspection failed. The vehicle has maintenance issues that must be resolved before starting the trip. Please contact your supervisor.';
            this.inspectionModalType = 'error';
            this.showInspectionModal = true;
            return;
        }

        if (inspectionData.inspection?.result === 'Pass') {
            this.proceedStartTrip(route.id!);
        }
    }

    private proceedStartTrip(routeId: string): void {
        const route = this.assignedRoutes.find(r => r.id === routeId);
        if (!route) return;

        if (confirm(`Are you sure you want to start the trip "${route.name}"?`)) {
            this.loading = true;
            this.routeService.updateRoute(routeId, {
                status: 'in_progress',
                startTime: new Date()
            }).subscribe({
                next: (updatedRoute) => {
                    const index = this.assignedRoutes.findIndex(r => r.id === updatedRoute.id);
                    if (index !== -1) {
                        this.assignedRoutes[index] = updatedRoute;
                    }

                    if (this.selectedRoute && this.selectedRoute.id === updatedRoute.id) {
                        this.selectedRoute = updatedRoute;
                    }

                    this.loading = false;
                    alert(`Trip "${route.name}" started successfully!`);
                },
                error: (error) => {
                    console.error('Error starting trip:', error);
                    this.errorMessage = 'Failed to start trip';
                    this.loading = false;
                }
            });
        }
    }

    completeTrip(route: Route): void {
        if (confirm(`Are you sure you want to complete the trip "${route.name}"?`)) {
            this.loading = true;
            this.routeService.updateRoute(route.id!, {
                status: 'completed',
                endTime: new Date()
            }).subscribe({
                next: (updatedRoute) => {
                    const index = this.assignedRoutes.findIndex(r => r.id === updatedRoute.id);
                    if (index !== -1) {
                        this.assignedRoutes[index] = updatedRoute;
                    }

                    if (this.selectedRoute && this.selectedRoute.id === updatedRoute.id) {
                        this.selectedRoute = updatedRoute;
                    }

                    this.loading = false;
                    alert(`Trip "${route.name}" completed successfully!`);
                },
                error: (error) => {
                    console.error('Error completing trip:', error);
                    this.errorMessage = 'Failed to complete trip';
                    this.loading = false;
                }
            });
        }
    }

    closeInspectionModal(): void {
        this.showInspectionModal = false;
        this.pendingRouteId = null;
    }

    goToInspection(): void {
        const route = this.assignedRoutes.find(r => r.id === this.pendingRouteId);
        if (route) {
            this.router.navigate(['/driver/pre-trip-inspection'], {
                queryParams: { vehicleId: route.vehicleId, routeId: route.id }
            });
        }
    }

    openGoogleMaps(route: Route): void {
        if (route.googleMapsUrl) {
            window.open(route.googleMapsUrl, '_blank');
        } else {
            const url = this.generateGoogleMapsUrl(route);
            if (url) {
                window.open(url, '_blank');
            }
        }
    }

    private generateGoogleMapsUrl(route: Route): string {
        if (!route.stops || route.stops.length === 0) {
            return '';
        }

        const baseUrl = 'https://www.google.com/maps/dir/';
        const waypoints = route.stops
            .sort((a, b) => a.stopOrder - b.stopOrder)
            .map(stop => encodeURIComponent(stop.address))
            .join('/');

        return baseUrl + waypoints;
    }

    viewRouteDetails(route: Route): void {
        this.selectedRoute = route;
        this.showRouteDetails = true;
    }

    closeRouteDetails(): void {
        this.showRouteDetails = false;
        this.selectedRoute = null;
    }

    updateStopStatus(stopId: string, status: string): void {
        this.routeService.updateStopStatus(stopId, {
            status,
            actualArrival: status === 'arrived' ? new Date() : undefined,
            actualDeparture: status === 'completed' ? new Date() : undefined
        }).subscribe({
            next: () => {
                this.loadAssignedRoutes();
                if (this.selectedRoute) {
                    this.routeService.getRouteById(this.selectedRoute.id!).subscribe({
                        next: (updatedRoute) => {
                            this.selectedRoute = updatedRoute;
                        }
                    });
                }
            },
            error: (error) => {
                console.error('Error updating stop status:', error);
                this.errorMessage = 'Failed to update stop status';
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'planned': return 'status-planned';
            case 'in_progress': return 'status-progress';
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            default: return '';
        }
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'high': return 'priority-high';
            case 'normal': return 'priority-normal';
            case 'low': return 'priority-low';
            default: return '';
        }
    }

    // ✅ UPDATED: Can only start if no active trip
    canStartTrip(route: Route): boolean {
        return route.status === 'planned' &&
            this.hasPassedInspection(route.id!) &&
            !this.hasActiveTripInProgress();
    }

    canCompleteTrip(route: Route): boolean {
        return route.status === 'in_progress';
    }
}
