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
    routeInspections: Map<string, boolean> = new Map(); // Track which routes have inspections

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

    // ✅ NEW: Check if routes have inspections
    private checkInspectionsForRoutes(routes: Route[]): void {
        routes.forEach(route => {
            if (route.id && route.status === 'planned') {
                this.inspectionService.getInspectionByRoute(route.id).subscribe({
                    next: (inspection) => {
                        this.routeInspections.set(route.id!, true);
                    },
                    error: () => {
                        this.routeInspections.set(route.id!, false);
                    }
                });
            }
        });
    }

    // ✅ NEW: Check if route has inspection
    hasInspection(routeId: string): boolean {
        return this.routeInspections.get(routeId) === true;
    }

    // ✅ UPDATED: Start Trip with inspection check
    startTrip(route: Route): void {
        // Check if inspection is completed
        if (!this.hasInspection(route.id!)) {
            if (confirm('Pre-trip inspection is required before starting this trip. Would you like to complete it now?')) {
                this.router.navigate(['/driver/pre-trip-inspection']);
            }
            return;
        }

        if (confirm(`Are you sure you want to start the trip "${route.name}"?`)) {
            this.loading = true;
            this.routeService.updateRoute(route.id!, {
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
                    this.showSuccessMessage(`Trip "${route.name}" started successfully!`);
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
                    this.showSuccessMessage(`Trip "${route.name}" completed successfully!`);
                },
                error: (error) => {
                    console.error('Error completing trip:', error);
                    this.errorMessage = 'Failed to complete trip';
                    this.loading = false;
                }
            });
        }
    }

    private showSuccessMessage(message: string): void {
        alert(message);
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

    canStartTrip(route: Route): boolean {
        return route.status === 'planned' && this.hasInspection(route.id!);
    }

    canCompleteTrip(route: Route): boolean {
        return route.status === 'in_progress';
    }

    // ✅ NEW: Get inspection status message
    getInspectionStatusMessage(route: Route): string {
        if (route.status !== 'planned') {
            return '';
        }
        return this.hasInspection(route.id!) ? 'Inspection Complete' : 'Inspection Required';
    }
}
