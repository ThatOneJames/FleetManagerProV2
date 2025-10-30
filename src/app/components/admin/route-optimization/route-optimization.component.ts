import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
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
    showEditModal: boolean = false;
    showStopsModal: boolean = false;
    selectedRoute: Route | null = null;
    editingRoute: Route | null = null;

    // Forms with validation
    createRouteForm!: FormGroup;
    editRouteForm!: FormGroup;
    newStopForm!: FormGroup;
    editStopForm!: FormGroup;

    // Backup data structures
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

    editRoute: any = {
        name: '',
        description: '',
        vehicleId: '',
        driverId: '',
        startAddress: '',
        destinationAddress: '',
        googleMapsUrl: '',
        stops: []
    };

    loading: boolean = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    private readonly apiUrl = 'https://fleetmanagerprov2-production.up.railway.app/api';

    constructor(
        private routeService: RouteService,
        private vehicleService: VehicleService,
        private authService: AuthService,
        private http: HttpClient,
        private fb: FormBuilder
    ) { }

    ngOnInit(): void {
        this.initializeForms();
        this.loadRoutes();
        this.loadVehicles();
        this.loadDrivers();
    }

    // ========== FORM INITIALIZATION WITH VALIDATION ==========
    initializeForms(): void {
        this.createRouteForm = this.fb.group({
            name: ['', [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(100)
            ]],
            description: ['', [Validators.maxLength(500)]],
            vehicleId: ['', [Validators.required]],
            driverId: ['', [Validators.required]],
            startAddress: ['', [
                Validators.minLength(5),
                Validators.maxLength(500)
            ]],
            destinationAddress: ['', [
                Validators.minLength(5),
                Validators.maxLength(500)
            ]],
            googleMapsUrl: ['']
        });

        this.editRouteForm = this.fb.group({
            name: ['', [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(100)
            ]],
            description: ['', [Validators.maxLength(500)]],
            vehicleId: ['', [Validators.required]],
            driverId: ['', [Validators.required]],
            startAddress: ['', [Validators.maxLength(500)]],
            destinationAddress: ['', [Validators.maxLength(500)]],
            googleMapsUrl: ['']
        });

        this.newStopForm = this.fb.group({
            address: ['', [
                Validators.required,
                Validators.minLength(5),
                Validators.maxLength(500)
            ]],
            priority: ['normal', [Validators.required]],
            notes: ['', [Validators.maxLength(500)]],
            contactName: ['', [Validators.maxLength(100)]],
            contactPhone: ['', [
                Validators.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
            ]]
        });

        this.editStopForm = this.fb.group({
            address: ['', [
                Validators.required,
                Validators.minLength(5),
                Validators.maxLength(500)
            ]],
            priority: ['normal', [Validators.required]],
            notes: ['', [Validators.maxLength(500)]],
            contactName: ['', [Validators.maxLength(100)]],
            contactPhone: ['', [
                Validators.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
            ]]
        });
    }

    // ========== ERROR MESSAGE HANDLER ==========
    getFieldErrorMessage(form: FormGroup, fieldName: string): string {
        const control = form.get(fieldName);

        if (!control || !control.errors || !control.touched) {
            return '';
        }

        const errors = control.errors;

        if (errors['required']) {
            return `${this.getFieldLabel(fieldName)} is required`;
        }

        if (errors['minlength']) {
            return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
        }

        if (errors['maxlength']) {
            return `${this.getFieldLabel(fieldName)} cannot exceed ${errors['maxlength'].requiredLength} characters`;
        }

        if (errors['pattern']) {
            return this.getPatternErrorMessage(fieldName);
        }

        return 'Invalid input';
    }

    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            name: 'Route Name',
            description: 'Description',
            vehicleId: 'Vehicle',
            driverId: 'Driver',
            startAddress: 'Start Address',
            destinationAddress: 'Destination Address',
            address: 'Stop Address',
            priority: 'Priority',
            notes: 'Notes',
            contactName: 'Contact Name',
            contactPhone: 'Contact Phone'
        };

        return labels[fieldName] || fieldName;
    }

    private getPatternErrorMessage(fieldName: string): string {
        const messages: { [key: string]: string } = {
            contactPhone: 'Please enter a valid phone number'
        };

        return messages[fieldName] || 'Invalid format';
    }

    isFieldInvalid(form: FormGroup, fieldName: string): boolean {
        const field = form.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    // ========== LOAD DATA METHODS ==========
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
                this.clearMessages();
            }
        });
    }

    loadVehicles(): void {
        this.vehicleService.getAllVehicles().subscribe({
            next: (data) => {
                this.vehicles = data.filter(v =>
                    v.status !== 'Maintenance' &&
                    v.status !== 'OutOfService' &&
                    v.status !== 'Retired' &&
                    v.status !== 'InRoute'
                );
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

        this.http.get<any[]>(`${this.apiUrl}/routes`, { headers }).subscribe({
            next: (allRoutes) => {
                const driversOnRoute = new Set(
                    allRoutes
                        .filter(r => r.status === 'in_progress')
                        .map(r => r.driverId)
                );

                this.http.get<any>(`${this.apiUrl}/users/drivers`, { headers })
                    .subscribe({
                        next: (allDrivers: any) => {
                            const attendanceRequests = allDrivers.map((driver: any) =>
                                this.http.get<any>(`${this.apiUrl}/attendance/driver/${driver.id}/today`, { headers })
                                    .toPromise()
                                    .catch(() => null)
                            );

                            Promise.all(attendanceRequests).then(attendanceResponses => {
                                this.drivers = allDrivers.filter((driver: any, index: number) => {
                                    const attendance = attendanceResponses[index];

                                    if (driversOnRoute.has(driver.id)) {
                                        return false;
                                    }

                                    if (!attendance) {
                                        return false;
                                    }

                                    const clockedIn = attendance?.data?.clockIn || attendance?.clockIn;
                                    const clockedOut = attendance?.data?.clockOut || attendance?.clockOut;

                                    return clockedIn && !clockedOut;
                                }).map((d: any) => ({
                                    id: d.id,
                                    name: d.name,
                                    email: d.email,
                                    phone: d.phone,
                                    licenseNumber: d.licenseNumber,
                                    role: 'Driver'
                                }));
                            });
                        },
                        error: (error: any) => {
                            console.error('Error loading drivers:', error);
                            this.errorMessage = 'Failed to load available drivers. Please try again.';
                            this.drivers = [];
                            this.clearMessages();
                        }
                    });
            },
            error: (error) => {
                console.error('Error loading routes for driver check:', error);
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

    // ========== CREATE ROUTE WITH VALIDATION ==========
    openCreateModal(): void {
        this.showCreateModal = true;
        this.createRouteForm.reset({
            name: '',
            description: '',
            vehicleId: '',
            driverId: '',
            startAddress: '',
            destinationAddress: '',
            googleMapsUrl: '',
            priority: 'normal'
        });
        this.newRoute.stops = [];
        this.newStopForm.reset({ priority: 'normal' });
        this.loadDrivers();
        this.loadVehicles();
        this.errorMessage = null;
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
        this.errorMessage = null;
    }

    addStopToNewRoute(): void {
        this.markFormGroupTouched(this.newStopForm);

        if (this.newStopForm.invalid) {
            this.errorMessage = 'Please fill out all required stop fields correctly';
            return;
        }

        const stopData = this.newStopForm.value;
        this.newRoute.stops.push({
            stopOrder: this.newRoute.stops.length + 1,
            address: stopData.address,
            priority: stopData.priority,
            notes: stopData.notes || '',
            contactName: stopData.contactName || '',
            contactPhone: stopData.contactPhone || ''
        });

        this.newStopForm.reset({ priority: 'normal' });
        this.updateGoogleMapsUrl();
        this.errorMessage = null;
    }

    removeStopFromNewRoute(index: number): void {
        this.newRoute.stops.splice(index, 1);
        this.newRoute.stops.forEach((stop, idx) => {
            stop.stopOrder = idx + 1;
        });
        this.updateGoogleMapsUrl();
    }

    createRoute(): void {
        this.markFormGroupTouched(this.createRouteForm);

        if (this.createRouteForm.invalid) {
            const errors: string[] = [];
            Object.keys(this.createRouteForm.controls).forEach(key => {
                const control = this.createRouteForm.get(key);
                if (control && control.invalid) {
                    const message = this.getFieldErrorMessage(this.createRouteForm, key);
                    if (message) {
                        errors.push(message);
                    }
                }
            });

            this.errorMessage = errors.length > 0 ? errors.join('. ') : 'Please fill out all required fields correctly';
            return;
        }

        if (this.newRoute.stops.length === 0) {
            this.errorMessage = 'Please add at least one stop to the route';
            return;
        }

        const formData = this.createRouteForm.value;
        this.newRoute = {
            ...formData,
            stops: this.newRoute.stops,
            googleMapsUrl: formData.googleMapsUrl || this.generateGoogleMapsUrl(formData, this.newRoute.stops)
        };

        this.loading = true;

        this.routeService.createRoute(this.newRoute).subscribe({
            next: (route) => {
                this.routes.unshift(route);
                this.successMessage = 'Route created successfully!';
                this.closeCreateModal();
                this.loading = false;
                this.clearMessages();
            },
            error: (error) => {
                console.error('Error creating route:', error);
                this.errorMessage = error.error?.errors ? JSON.stringify(error.error.errors) : 'Failed to create route';
                this.loading = false;
                this.clearMessages();
            }
        });
    }

    // ========== EDIT ROUTE WITH VALIDATION ==========
    openEditModal(route: Route): void {
        this.editingRoute = route;
        this.editRouteForm.patchValue({
            name: route.name,
            description: route.description || '',
            vehicleId: route.vehicleId,
            driverId: route.driverId,
            startAddress: '',
            destinationAddress: '',
            googleMapsUrl: route.googleMapsUrl || ''
        });
        this.editRoute.stops = JSON.parse(JSON.stringify(route.stops));
        this.editStopForm.reset({ priority: 'normal' });
        this.showEditModal = true;
        this.loadDrivers();
        this.loadVehicles();
        this.errorMessage = null;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editingRoute = null;
        this.errorMessage = null;
    }

    addStopToEdit(): void {
        this.markFormGroupTouched(this.editStopForm);

        if (this.editStopForm.invalid) {
            this.errorMessage = 'Please fill out all required stop fields correctly';
            return;
        }

        const stopData = this.editStopForm.value;
        this.editRoute.stops.push({
            stopOrder: this.editRoute.stops.length + 1,
            address: stopData.address,
            priority: stopData.priority,
            notes: stopData.notes || '',
            contactName: stopData.contactName || '',
            contactPhone: stopData.contactPhone || ''
        });

        this.editStopForm.reset({ priority: 'normal' });
        this.updateEditGoogleMapsUrl();
        this.errorMessage = null;
    }

    removeStopFromEdit(index: number): void {
        this.editRoute.stops.splice(index, 1);
        this.editRoute.stops.forEach((stop: any, idx: number) => {
            stop.stopOrder = idx + 1;
        });
        this.updateEditGoogleMapsUrl();
    }

    autoOptimizeStops(): void {
        const stops = this.editRoute.stops;
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        stops.sort((a: any, b: any) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 1));
        stops.forEach((stop: any, idx: number) => {
            stop.stopOrder = idx + 1;
        });
        this.editRoute.stops = [...stops];
        this.updateEditGoogleMapsUrl();
    }

    saveEditedRoute(): void {
        this.markFormGroupTouched(this.editRouteForm);

        if (!this.editingRoute) return;

        if (this.editRouteForm.invalid) {
            const errors: string[] = [];
            Object.keys(this.editRouteForm.controls).forEach(key => {
                const control = this.editRouteForm.get(key);
                if (control && control.invalid) {
                    const message = this.getFieldErrorMessage(this.editRouteForm, key);
                    if (message) {
                        errors.push(message);
                    }
                }
            });

            this.errorMessage = errors.length > 0 ? errors.join('. ') : 'Please fill out all required fields correctly';
            return;
        }

        const formData = this.editRouteForm.value;
        this.updateEditGoogleMapsUrl();

        const updateData = {
            name: formData.name,
            description: formData.description,
            vehicleId: formData.vehicleId,
            driverId: formData.driverId,
            googleMapsUrl: formData.googleMapsUrl || this.editRoute.googleMapsUrl,
            stops: this.editRoute.stops
        };

        this.loading = true;

        this.routeService.updateRoute(this.editingRoute.id!, updateData).subscribe({
            next: (updatedRoute) => {
                const index = this.routes.findIndex(r => r.id === updatedRoute.id);
                if (index !== -1) {
                    this.routes[index] = updatedRoute;
                }
                this.successMessage = 'Route updated successfully!';
                this.closeEditModal();
                this.loading = false;
                this.clearMessages();
            },
            error: (error) => {
                console.error('Error updating route:', error);
                this.errorMessage = 'Failed to update route';
                this.loading = false;
                this.clearMessages();
            }
        });
    }

    // ========== GOOGLE MAPS URL GENERATION ==========
    updateGoogleMapsUrl(): void {
        const formData = this.createRouteForm.value;
        const url = this.generateGoogleMapsUrl(formData, this.newRoute.stops);
        this.createRouteForm.patchValue({ googleMapsUrl: url });
    }

    updateEditGoogleMapsUrl(): void {
        const formData = this.editRouteForm.value;
        const url = this.generateGoogleMapsUrl(formData, this.editRoute.stops);
        this.editRouteForm.patchValue({ googleMapsUrl: url });
        this.editRoute.googleMapsUrl = url;
    }

    private generateGoogleMapsUrl(formData: any, stops: any[]): string {
        const baseUrl = 'https://www.google.com/maps/dir/';
        const locations: string[] = [];

        if (formData.startAddress && formData.startAddress.trim()) {
            locations.push(encodeURIComponent(formData.startAddress.trim()));
        }

        stops
            .sort((a, b) => a.stopOrder - b.stopOrder)
            .forEach(stop => {
                if (stop.address && stop.address.trim()) {
                    locations.push(encodeURIComponent(stop.address.trim()));
                }
            });

        if (formData.destinationAddress && formData.destinationAddress.trim()) {
            const lastLocation = locations[locations.length - 1];
            const encodedDestination = encodeURIComponent(formData.destinationAddress.trim());

            if (lastLocation !== encodedDestination) {
                locations.push(encodedDestination);
            }
        }

        if (locations.length >= 2) {
            return baseUrl + locations.join('/');
        } else if (locations.length === 1) {
            return `https://www.google.com/maps/search/${locations[0]}`;
        } else {
            return '';
        }
    }

    previewGoogleMaps(): void {
        const formData = this.createRouteForm.value;
        const hasStartOrStops = (formData.startAddress && formData.startAddress.trim()) || this.newRoute.stops.length > 0;

        if (!hasStartOrStops) {
            alert('Please add a start address or at least one stop to preview the route');
            return;
        }

        this.updateGoogleMapsUrl();
        const url = this.createRouteForm.value.googleMapsUrl;

        if (url) {
            window.open(url, '_blank');
        } else {
            alert('Unable to generate Google Maps URL. Please check your addresses.');
        }
    }

    previewEditGoogleMaps(): void {
        this.updateEditGoogleMapsUrl();
        const url = this.editRouteForm.value.googleMapsUrl;

        if (url) {
            window.open(url, '_blank');
        } else {
            alert('Unable to generate Google Maps URL. Please check your addresses.');
        }
    }

    // ========== ALL YOUR EXISTING METHODS BELOW (UNCHANGED) ==========
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
                            this.clearMessages();
                        }
                    });
                }
            },
            error: (error) => {
                console.error('Error updating stop status:', error);
                this.errorMessage = 'Failed to update stop status';
                this.clearMessages();
            }
        });
    }

    startRoute(routeId: string): void {
        this.routeService.updateRoute(routeId, { status: 'in_progress', startTime: new Date() }).subscribe({
            next: () => {
                this.successMessage = 'Route started successfully!';
                this.loadRoutes();
                this.loadVehicles();
                this.loadDrivers();
                this.clearMessages();
            },
            error: (error) => {
                console.error('Error starting route:', error);
                this.errorMessage = 'Failed to start route';
                this.clearMessages();
            }
        });
    }

    completeRoute(routeId: string): void {
        this.routeService.updateRoute(routeId, { status: 'completed', endTime: new Date() }).subscribe({
            next: () => {
                this.successMessage = 'Route completed successfully!';
                this.loadRoutes();
                this.loadVehicles();
                this.loadDrivers();
                this.clearMessages();
            },
            error: (error) => {
                console.error('Error completing route:', error);
                this.errorMessage = 'Failed to complete route';
                this.clearMessages();
            }
        });
    }

    setPendingRoute(routeId: string): void {
        if (confirm('Are you sure you want to set this route back to pending?')) {
            this.routeService.updateRoute(routeId, { status: 'planned' }).subscribe({
                next: () => {
                    this.successMessage = 'Route set to pending!';
                    this.loadRoutes();
                    this.loadVehicles();
                    this.loadDrivers();
                    this.clearMessages();
                },
                error: (error) => {
                    console.error('Error setting route to pending:', error);
                    this.errorMessage = 'Failed to set route to pending';
                    this.clearMessages();
                }
            });
        }
    }

    cancelRoute(routeId: string): void {
        if (confirm('Are you sure you want to cancel this route?')) {
            this.routeService.updateRoute(routeId, { status: 'cancelled' }).subscribe({
                next: () => {
                    this.successMessage = 'Route cancelled!';
                    this.loadRoutes();
                    this.loadVehicles();
                    this.loadDrivers();
                    this.clearMessages();
                },
                error: (error) => {
                    console.error('Error cancelling route:', error);
                    this.errorMessage = 'Failed to cancel route';
                    this.clearMessages();
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
                this.successMessage = 'Route optimized!';
                this.clearMessages();
            },
            error: (error) => {
                console.error('Error optimizing route:', error);
                this.errorMessage = 'Failed to optimize route';
                this.clearMessages();
            }
        });
    }

    deleteRoute(routeId: string): void {
        if (confirm('Are you sure you want to delete this route?')) {
            this.routeService.deleteRoute(routeId).subscribe({
                next: () => {
                    this.routes = this.routes.filter(r => r.id !== routeId);
                    this.successMessage = 'Route deleted successfully!';
                    this.clearMessages();
                },
                error: (error) => {
                    console.error('Error deleting route:', error);
                    this.errorMessage = 'Failed to delete route';
                    this.clearMessages();
                }
            });
        }
    }

    copyGoogleMapsUrl(route: Route): void {
        const url = route.googleMapsUrl || this.routeService.generateGoogleMapsUrl(route);

        if (url) {
            navigator.clipboard.writeText(url).then(() => {
                this.successMessage = 'Google Maps URL copied to clipboard!';
                this.clearMessages();
            }).catch(err => {
                console.error('Failed to copy URL:', err);
                this.errorMessage = 'Failed to copy URL to clipboard';
                this.clearMessages();
            });
        } else {
            this.errorMessage = 'No Google Maps URL available for this route';
            this.clearMessages();
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

    // ========== PRIVATE HELPER METHODS ==========
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            control?.markAsTouched({ onlySelf: true });
        });
    }

    private clearMessages(): void {
        setTimeout(() => {
            this.successMessage = null;
            this.errorMessage = null;
        }, 5000);
    }
}
