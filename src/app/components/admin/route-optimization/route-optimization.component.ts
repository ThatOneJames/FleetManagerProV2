import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouteService, Route, CreateRoute, CreateRouteStop } from '../../../services/route.service';
import { VehicleService } from '../../../services/vehicle.service';
import { Vehicle } from '../../../models/vehicle.model';
import { AuthService } from '../../../services/auth.service';

interface Driver {
    id: string;
    name: string;
    email: string;
    role: string;
}

@Component({
    selector: 'app-route-optimization',
    templateUrl: './route-optimization.component.html',
    styleUrls: ['./route-optimization.component.css']
})
export class RouteOptimizationComponent implements OnInit {
    routes: Route[] = [];
    vehicles: Vehicle[] = [];
    drivers: Driver[] = [];

    searchRoute: string = '';
    filterStatus: string = '';

    showCreateModal: boolean = false;
    showStopsModal: boolean = false;
    selectedRoute: Route | null = null;

    newRoute: CreateRoute = {
        name: '',
        description: '',
        vehicleId: '',
        driverId: '',
        stops: []
    };

    newStop: CreateRouteStop = {
        stopOrder: 1,
        address: '',
        priority: 'normal',
        notes: '',
        contactName: '',
        contactPhone: ''
    };

    loading: boolean = false;
    errorMessage: string = '';

    private apiUrl = 'http://localhost:5129/api';

    constructor(
        private routeService: RouteService,
        private vehicleService: VehicleService,
        private authService: AuthService,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.loadRoutes();
        this.loadVehicles();
        this.loadDrivers();
    }

    loadRoutes(): void {
        this.loading = true;
        this.routeService.getAllRoutes().subscribe({
            next: (data) => {
                this.routes = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading routes:', error);
                this.errorMessage = 'Failed to load routes';
                this.loading = false;
            }
        });
    }

    loadVehicles(): void {
        this.vehicleService.getAllVehicles().subscribe({
            next: (data) => {
                console.log('All vehicles loaded:', data); // Debug log
                this.vehicles = data; // Remove the status filter
                console.log('Vehicles for dropdown:', this.vehicles); // Debug log
            },
            error: (error) => {
                console.error('Error loading vehicles:', error);
            }
        });
    }

    loadDrivers(): void {
        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        this.http.get<any[]>(`${this.apiUrl}/users/drivers`, { headers }).subscribe({
            next: (data: any[]) => {
                this.drivers = data.map(d => ({
                    id: d.id,
                    name: d.name,
                    email: d.email,
                    role: d.role
                }));
            },
            error: (error: any) => {
                console.error('Error loading drivers:', error);
                this.drivers = [];
            }
        });
    }

    filteredRoutes(): Route[] {
        return this.routes.filter(route =>
            (this.searchRoute === '' ||
                route.name.toLowerCase().includes(this.searchRoute.toLowerCase()) ||
                route.vehiclePlate?.toLowerCase().includes(this.searchRoute.toLowerCase())) &&
            (this.filterStatus === '' || route.status === this.filterStatus)
        );
    }

    openCreateModal(): void {
        this.showCreateModal = true;
        this.newRoute = {
            name: '',
            description: '',
            vehicleId: '',
            driverId: '',
            stops: []
        };
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
        this.errorMessage = '';
    }

    addStopToNewRoute(): void {
        if (this.newStop.address) {
            this.newRoute.stops.push({ ...this.newStop });
            this.newStop = {
                stopOrder: this.newRoute.stops.length + 1,
                address: '',
                priority: 'normal',
                notes: '',
                contactName: '',
                contactPhone: ''
            };
        }
    }

    removeStopFromNewRoute(index: number): void {
        this.newRoute.stops.splice(index, 1);
        this.newRoute.stops.forEach((stop, idx) => {
            stop.stopOrder = idx + 1;
        });
    }

    createRoute(): void {
        if (!this.newRoute.name || !this.newRoute.vehicleId || !this.newRoute.driverId || this.newRoute.stops.length === 0) {
            this.errorMessage = 'Please fill in all required fields and add at least one stop';
            return;
        }

        this.loading = true;
        this.routeService.createRoute(this.newRoute).subscribe({
            next: (route) => {
                this.routes.unshift(route);
                this.closeCreateModal();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error creating route:', error);
                this.errorMessage = 'Failed to create route';
                this.loading = false;
            }
        });
    }

    viewRouteStops(route: Route): void {
        this.selectedRoute = route;
        this.showStopsModal = true;
    }

    closeStopsModal(): void {
        this.showStopsModal = false;
        this.selectedRoute = null;
    }

    updateStopStatus(stopId: string, status: string): void {
        this.routeService.updateStopStatus(stopId, {
            status,
            actualArrival: status === 'arrived' ? new Date() : undefined,
            actualDeparture: status === 'completed' ? new Date() : undefined
        }).subscribe({
            next: () => {
                if (this.selectedRoute) {
                    this.routeService.getRouteById(this.selectedRoute.id!).subscribe({
                        next: (updatedRoute) => {
                            this.selectedRoute = updatedRoute;
                            const index = this.routes.findIndex(r => r.id === updatedRoute.id);
                            if (index !== -1) {
                                this.routes[index] = updatedRoute;
                            }
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

    startRoute(routeId: string): void {
        this.routeService.updateRoute(routeId, {
            status: 'in_progress',
            startTime: new Date()
        }).subscribe({
            next: () => {
                this.loadRoutes();
            },
            error: (error) => {
                console.error('Error starting route:', error);
                this.errorMessage = 'Failed to start route';
            }
        });
    }

    completeRoute(routeId: string): void {
        this.routeService.updateRoute(routeId, {
            status: 'completed',
            endTime: new Date()
        }).subscribe({
            next: () => {
                this.loadRoutes();
            },
            error: (error) => {
                console.error('Error completing route:', error);
                this.errorMessage = 'Failed to complete route';
            }
        });
    }

    optimizeRoute(routeId: string): void {
        this.routeService.optimizeRoute(routeId).subscribe({
            next: (optimizedRoute) => {
                const index = this.routes.findIndex(r => r.id === routeId);
                if (index !== -1) {
                    this.routes[index] = optimizedRoute;
                }
                if (this.selectedRoute && this.selectedRoute.id === routeId) {
                    this.selectedRoute = optimizedRoute;
                }
            },
            error: (error) => {
                console.error('Error optimizing route:', error);
                this.errorMessage = 'Failed to optimize route';
            }
        });
    }

    deleteRoute(routeId: string): void {
        if (confirm('Are you sure you want to delete this route?')) {
            this.routeService.deleteRoute(routeId).subscribe({
                next: () => {
                    this.routes = this.routes.filter(r => r.id !== routeId);
                },
                error: (error) => {
                    console.error('Error deleting route:', error);
                    this.errorMessage = 'Failed to delete route';
                }
            });
        }
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

    getVehiclePlate(vehicleId: string): string {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        return vehicle ? vehicle.licensePlate : 'Unknown';
    }

    getDriverName(driverId: string): string {
        const driver = this.drivers.find(d => d.id === driverId);
        return driver ? driver.name : 'Unknown';
    }
}