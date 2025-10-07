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
    role?: string;
    phone?: string;
    licenseNumber?: string;
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
        startAddress: '',
        destinationAddress: '',
        googleMapsUrl: '',
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

    private readonly apiUrl = 'https://fleetmanagerprov2-production.up.railway.app/api';

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
                console.log('All vehicles loaded:', data);
                this.vehicles = data;
                console.log('Vehicles for dropdown:', this.vehicles);
            },
            error: (error) => {
                console.error('Error loading vehicles:', error);
            }
        });
    }

    loadDrivers(): void {
        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        this.http.get<any>(`${this.apiUrl}/users/drivers`, { headers })
            .subscribe({
                next: (allDrivers: any) => {
                    console.log('📋 All drivers loaded:', allDrivers);

                    const attendanceRequests = allDrivers.map((driver: any) =>
                        this.http.get<any>(`${this.apiUrl}/attendance/driver/${driver.id}/today`, { headers })
                            .toPromise()
                            .catch(() => null)
                    );

                    Promise.all(attendanceRequests).then(attendanceResponses => {
                        this.drivers = allDrivers.filter((driver: any, index: number) => {
                            const attendance = attendanceResponses[index];

                            if (!attendance) {
                                console.log(`❌ ${driver.name}: No attendance record`);
                                return false;
                            }

                            const clockedIn = attendance?.data?.clockIn || attendance?.clockIn;
                            const clockedOut = attendance?.data?.clockOut || attendance?.clockOut;

                            const isAvailable = clockedIn && !clockedOut;

                            console.log(`${isAvailable ? '✅' : '❌'} ${driver.name}: Clocked In: ${!!clockedIn}, Clocked Out: ${!!clockedOut}`);

                            return isAvailable;
                        }).map((d: any) => ({
                            id: d.id,
                            name: d.name,
                            email: d.email,
                            phone: d.phone,
                            licenseNumber: d.licenseNumber,
                            role: 'Driver'
                        }));

                        console.log('✅ Available drivers (clocked in, not clocked out):', this.drivers);
                    });
                },
                error: (error: any) => {
                    console.error('Error loading drivers:', error);
                    this.errorMessage = 'Failed to load available drivers. Please try again.';
                    this.drivers = [];
                }
            });
    }

    get filteredRoutes(): Route[] {
        return this.routes.filter(route =>
            (!this.searchRoute ||
                route.name.toLowerCase().includes(this.searchRoute.toLowerCase()) ||
                route.vehiclePlate?.toLowerCase().includes(this.searchRoute.toLowerCase())) &&
            (!this.filterStatus || route.status === this.filterStatus)
        );
    }

    openCreateModal(): void {
        this.showCreateModal = true;
        this.newRoute = {
            name: '',
            description: '',
            vehicleId: '',
            driverId: '',
            startAddress: '',
            destinationAddress: '',
            googleMapsUrl: '',
            stops: []
        };
        this.loadDrivers();
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
        this.errorMessage = '';
    }

    addStopToNewRoute(): void {
        if (this.newStop.address) {
            this.newRoute.stops.push({
                ...this.newStop,
                startAddress: this.newRoute.startAddress || '',
                destinationAddress: this.newRoute.destinationAddress || ''
            });

            this.newStop = {
                stopOrder: this.newRoute.stops.length + 1,
                address: '',
                priority: 'normal',
                notes: '',
                contactName: '',
                contactPhone: ''
            };

            this.updateGoogleMapsUrl();
        }
    }

    removeStopFromNewRoute(index: number): void {
        this.newRoute.stops.splice(index, 1);
        this.newRoute.stops.forEach((stop, idx) => {
            stop.stopOrder = idx + 1;
        });
        this.updateGoogleMapsUrl();
    }

    updateGoogleMapsUrl(): void {
        const baseUrl = 'https://www.google.com/maps/dir/';
        const locations: string[] = [];

        if (this.newRoute.startAddress && this.newRoute.startAddress.trim()) {
            locations.push(encodeURIComponent(this.newRoute.startAddress.trim()));
        }

        this.newRoute.stops
            .sort((a, b) => a.stopOrder - b.stopOrder)
            .forEach(stop => {
                if (stop.address && stop.address.trim()) {
                    locations.push(encodeURIComponent(stop.address.trim()));
                }
            });

        if (this.newRoute.destinationAddress && this.newRoute.destinationAddress.trim()) {
            const lastLocation = locations[locations.length - 1];
            const encodedDestination = encodeURIComponent(this.newRoute.destinationAddress.trim());

            if (lastLocation !== encodedDestination) {
                locations.push(encodedDestination);
            }
        }

        if (locations.length >= 2) {
            this.newRoute.googleMapsUrl = baseUrl + locations.join('/');
        } else if (locations.length === 1) {
            this.newRoute.googleMapsUrl = `https://www.google.com/maps/search/${locations[0]}`;
        } else {
            this.newRoute.googleMapsUrl = '';
        }
    }

    createRoute(): void {
        if (!this.newRoute.name || !this.newRoute.vehicleId || !this.newRoute.driverId || this.newRoute.stops.length === 0) {
            this.errorMessage = 'Please fill in all required fields and add at least one stop';
            return;
        }

        this.newRoute.stops = this.newRoute.stops.map(stop => ({
            ...stop,
            startAddress: this.newRoute.startAddress || '',
            destinationAddress: this.newRoute.destinationAddress || ''
        }));

        if (!this.newRoute.googleMapsUrl) {
            this.updateGoogleMapsUrl();
        }

        console.log('Creating route with data:', this.newRoute);
        this.loading = true;

        this.routeService.createRoute(this.newRoute).subscribe({
            next: (route) => {
                console.log('Route created successfully:', route);
                this.routes.unshift(route);
                this.closeCreateModal();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error creating route:', error);
                this.errorMessage = error.error?.errors ? JSON.stringify(error.error.errors) : 'Failed to create route';
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

    openGoogleMaps(route: Route): void {
        this.routeService.openInGoogleMaps(route);
    }

    previewGoogleMaps(): void {
        const hasStartOrStops = (this.newRoute.startAddress && this.newRoute.startAddress.trim()) || this.newRoute.stops.length > 0;

        if (!hasStartOrStops) {
            alert('Please add a start address or at least one stop to preview the route');
            return;
        }

        this.updateGoogleMapsUrl();

        if (this.newRoute.googleMapsUrl) {
            window.open(this.newRoute.googleMapsUrl, '_blank');
        } else {
            alert('Unable to generate Google Maps URL. Please check your addresses.');
        }
    }

    updateStopStatus(stopId: string, status: string): void {
        const updateData = {
            status: status
        };

        this.routeService.updateStopStatus(stopId, updateData).subscribe({
            next: () => {
                if (this.selectedRoute) {
                    this.routeService.getRouteById(this.selectedRoute.id!).subscribe({
                        next: (updatedRoute) => {
                            this.selectedRoute = updatedRoute;
                            const index = this.routes.findIndex(r => r.id === updatedRoute.id);
                            if (index !== -1) {
                                this.routes[index] = updatedRoute;
                            }
                        },
                        error: (error) => {
                            console.error('Error refreshing route:', error);
                            this.errorMessage = 'Failed to refresh route data';
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
        this.routeService.updateRoute(routeId, { status: 'in_progress', startTime: new Date() }).subscribe({
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
        this.routeService.updateRoute(routeId, { status: 'completed', endTime: new Date() }).subscribe({
            next: () => {
                this.loadRoutes();
            },
            error: (error) => {
                console.error('Error completing route:', error);
                this.errorMessage = 'Failed to complete route';
            }
        });
    }

    // ✅ NEW: Set route to pending
    setPendingRoute(routeId: string): void {
        if (confirm('Are you sure you want to set this route back to pending?')) {
            this.routeService.updateRoute(routeId, { status: 'planned' }).subscribe({
                next: () => {
                    this.loadRoutes();
                },
                error: (error) => {
                    console.error('Error setting route to pending:', error);
                    this.errorMessage = 'Failed to set route to pending';
                }
            });
        }
    }

    // ✅ NEW: Cancel route
    cancelRoute(routeId: string): void {
        if (confirm('Are you sure you want to cancel this route?')) {
            this.routeService.updateRoute(routeId, { status: 'cancelled' }).subscribe({
                next: () => {
                    this.loadRoutes();
                },
                error: (error) => {
                    console.error('Error cancelling route:', error);
                    this.errorMessage = 'Failed to cancel route';
                }
            });
        }
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

    copyGoogleMapsUrl(route: Route): void {
        const url = route.googleMapsUrl || this.routeService.generateGoogleMapsUrl(route);

        if (url) {
            navigator.clipboard.writeText(url).then(() => {
                alert('Google Maps URL copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy URL:', err);
                alert('Failed to copy URL to clipboard');
            });
        } else {
            alert('No Google Maps URL available for this route');
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
