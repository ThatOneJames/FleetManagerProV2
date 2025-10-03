import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouteService, Route, RouteStop } from '../../../services/route.service';
import { AuthService } from '../../../services/auth.service';

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

    constructor(
        private routeService: RouteService,
        private authService: AuthService,
        private http: HttpClient
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
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading assigned routes:', error);
                this.errorMessage = 'Failed to load assigned routes';
                this.loading = false;
            }
        });
    }

    openGoogleMaps(route: Route): void {
        if (route.googleMapsUrl) {
            window.open(route.googleMapsUrl, '_blank');
        } else {
            // Fallback: Generate URL on frontend
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

    // NEW: Start Trip functionality
    startTrip(route: Route): void {
        if (confirm(`Are you sure you want to start the trip "${route.name}"?`)) {
            this.loading = true;
            this.routeService.updateRoute(route.id!, {
                status: 'in_progress',
                startTime: new Date()
            }).subscribe({
                next: (updatedRoute) => {
                    // Update the route in the list
                    const index = this.assignedRoutes.findIndex(r => r.id === updatedRoute.id);
                    if (index !== -1) {
                        this.assignedRoutes[index] = updatedRoute;
                    }

                    // Update selected route if it's the same one
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

    // NEW: Complete Trip functionality
    completeTrip(route: Route): void {
        if (confirm(`Are you sure you want to complete the trip "${route.name}"?`)) {
            this.loading = true;
            this.routeService.updateRoute(route.id!, {
                status: 'completed',
                endTime: new Date()
            }).subscribe({
                next: (updatedRoute) => {
                    // Update the route in the list
                    const index = this.assignedRoutes.findIndex(r => r.id === updatedRoute.id);
                    if (index !== -1) {
                        this.assignedRoutes[index] = updatedRoute;
                    }

                    // Update selected route if it's the same one
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

    // NEW: Success message helper
    private showSuccessMessage(message: string): void {
        // You can implement a toast notification or simple alert
        alert(message);
        // Alternative: Set a success message variable and show it in template
        // this.successMessage = message;
        // setTimeout(() => this.successMessage = '', 3000);
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

    // NEW: Helper method to check if route can be started
    canStartTrip(route: Route): boolean {
        return route.status === 'planned';
    }

    // NEW: Helper method to check if route can be completed
    canCompleteTrip(route: Route): boolean {
        return route.status === 'in_progress';
    }
}
