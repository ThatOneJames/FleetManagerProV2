import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { VehicleService } from '../../../services/vehicle.service';
import { RouteService } from '../../../services/route.service';
import { DriverService } from '../../../services/driver.service';
import { environment } from '../../../../environments/environment';
import { MaintenanceService } from '../../../services/maintenance.service';

interface DashboardStats {
    totalVehicles: number;
    totalDrivers: number;
    activeRoutes: number;
    maintenanceDue: number;
    fuelConsumption: number;
    totalMileage: number;
}

interface VehicleStatus {
    id: string;
    licensePlate: string;
    driver: string;
    status: string;
    location: string;
    fuelLevel: number;
    make?: string;
    model?: string;
}

interface Activity {
    id: number;
    type: string;
    message: string;
    timestamp: Date;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-admin-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private readonly apiUrl = `${environment.apiUrl}`;

    stats: DashboardStats = {
        totalVehicles: 0,
        totalDrivers: 0,
        activeRoutes: 0,
        maintenanceDue: 0,
        fuelConsumption: 0,
        totalMileage: 0
    };

    vehicles: VehicleStatus[] = [];
    recentActivities: Activity[] = [];
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    // Chart data
    chartData = {
        fuelConsumption: [
            { name: 'Mon', value: 0 },
            { name: 'Tue', value: 0 },
            { name: 'Wed', value: 0 },
            { name: 'Thu', value: 0 },
            { name: 'Fri', value: 0 },
            { name: 'Sat', value: 0 },
            { name: 'Sun', value: 0 }
        ],
        vehicleStatus: [
            { name: 'Active', value: 0, color: '#4caf50' },
            { name: 'Maintenance', value: 0, color: '#ff9800' },
            { name: 'Idle', value: 0, color: '#9e9e9e' }
        ]
    };

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private vehicleService: VehicleService,
        private routeService: RouteService,
        private driverService: DriverService,
        private maintenanceService: MaintenanceService
    ) { }

    ngOnInit(): void {
        this.loadDashboardData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private getHttpOptions() {
        const token = this.authService.getToken();
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            })
        };
    }

    private processVehicles(vehicles: any[]): void {
        this.stats.totalVehicles = vehicles.length;

        this.vehicles = vehicles.slice(0, 10).map(v => ({
            id: v.id,
            licensePlate: v.licensePlate,
            make: v.make,
            model: v.model,
            driver: v.currentDriver?.name || 'Unassigned',
            status: v.status || 'Idle',
            location: v.location || 'Unknown',
            fuelLevel: v.fuelLevel || 0
        }));

        const activeCount = vehicles.filter(v =>
            v.status === 'Active' || v.status === 'InUse' || v.status === 'OnRoute'
        ).length;
        const maintenanceCount = vehicles.filter(v =>
            v.status === 'Maintenance' || v.status === 'OutOfService'
        ).length;
        const idleCount = vehicles.filter(v =>
            v.status === 'Idle' || v.status === 'Ready' || v.status === 'NotAvailable'
        ).length;

        this.chartData.vehicleStatus = [
            { name: 'Active', value: activeCount, color: '#4caf50' },
            { name: 'Maintenance', value: maintenanceCount, color: '#ff9800' },
            { name: 'Idle', value: idleCount, color: '#9e9e9e' }
        ];

        this.stats.totalMileage = vehicles.reduce((sum, v) => sum + (v.currentMileage || 0), 0);

        const totalFuel = vehicles.reduce((sum, v) => sum + (v.fuelLevel || 0), 0);
        this.stats.fuelConsumption = vehicles.length > 0 ? totalFuel / vehicles.length : 0;

        // Set initial maintenanceDue from vehicle status
        // This will be overridden by processMaintenance() if maintenance data exists
        this.stats.maintenanceDue = maintenanceCount;
    }


    private processDrivers(drivers: any[]): void {
        this.stats.totalDrivers = drivers.filter(d => d.role === 'Driver').length;
    }

    private processRoutes(routes: any[]): void {
        this.stats.activeRoutes = routes.filter(r =>
            r.status === 'in_progress' || r.status === 'planned'
        ).length;
    }


    async loadDashboardData(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            forkJoin({
                vehicles: this.vehicleService.getAllVehicles().pipe(
                    catchError(err => {
                        console.error('Error loading vehicles:', err);
                        return of([]);
                    })
                ),
                drivers: this.driverService.getAllDrivers().pipe(
                    catchError(err => {
                        console.error('Error loading drivers:', err);
                        return of([]);
                    })
                ),
                routes: this.routeService.getAllRoutes().pipe(
                    catchError(err => {
                        console.error('Error loading routes:', err);
                        return of([]);
                    })
                ),
                // Use MaintenanceService instead of direct HTTP call
                maintenance: this.maintenanceService.getAllTasks().pipe(
                    catchError(err => {
                        console.warn('Maintenance endpoint not available:', err);
                        return of([]); // Return empty array if maintenance endpoint doesn't exist
                    })
                )
            }).pipe(
                takeUntil(this.destroy$)
            ).subscribe({
                next: (data) => {
                    console.log('Dashboard data loaded:', data);
                    this.processVehicles(data.vehicles);
                    this.processDrivers(data.drivers);
                    this.processRoutes(data.routes);
                    this.processMaintenance(data.maintenance);
                    this.generateActivities(data);
                    this.isLoading = false;
                    this.successMessage = 'Dashboard loaded successfully';
                    this.clearMessages();
                },
                error: (error) => {
                    console.error('Error loading dashboard:', error);
                    this.errorMessage = 'Failed to load dashboard data';
                    this.isLoading = false;
                    this.clearMessages();
                }
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.errorMessage = 'Failed to load dashboard data';
            this.isLoading = false;
        }
    }

    private processMaintenance(maintenance: any[]): void {
        if (!maintenance || maintenance.length === 0) {
            // Calculate from vehicle status - only vehicles currently in maintenance
            this.stats.maintenanceDue = this.vehicles.filter(v =>
                v.status === 'Maintenance' || v.status === 'OutOfService'
            ).length;
            return;
        }

        // Count ONLY pending/scheduled/in-progress maintenance (NOT completed)
        this.stats.maintenanceDue = maintenance.filter(m =>
            m.status === 'Scheduled' || m.status === 'Pending' || m.status === 'InProgress'
        ).length;

        // ALSO check vehicle status and take the higher number
        const vehiclesInMaintenance = this.vehicles.filter(v =>
            v.status === 'Maintenance' || v.status === 'OutOfService'
        ).length;

        const activeTasks = maintenance.filter(m => 
        m.status === 'Scheduled' || m.status === 'Pending' || m.status === 'InProgress'
    ).length;

        // Override with active task count if maintenance data is available
        this.stats.maintenanceDue = activeTasks;
    }



    private generateActivities(data: any): void {
        const activities: Activity[] = [];

        // Generate activities from recent routes
        data.routes?.slice(0, 3).forEach((route: any, index: number) => {
            if (route.status === 'completed') {
                activities.push({
                    id: activities.length + 1,
                    type: 'route_completed',
                    message: `Route "${route.name}" completed by ${route.driverName || 'Unknown'}`,
                    timestamp: new Date(route.endTime || route.updatedAt || Date.now() - index * 300000),
                    icon: 'check_circle',
                    color: 'success'
                });
            } else if (route.status === 'in_progress') {
                activities.push({
                    id: activities.length + 1,
                    type: 'route_started',
                    message: `Route "${route.name}" started by ${route.driverName || 'Unknown'}`,
                    timestamp: new Date(route.startTime || route.updatedAt || Date.now() - index * 600000),
                    icon: 'directions',
                    color: 'info'
                });
            }
        });

        // Generate activities from maintenance
        data.maintenance?.slice(0, 2).forEach((maint: any, index: number) => {
            const vehicle = data.vehicles.find((v: any) => v.id === maint.vehicleId);
            const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown Vehicle';

            activities.push({
                id: activities.length + 1,
                type: 'maintenance_scheduled',
                message: `${vehicleName} scheduled for ${maint.type || 'maintenance'}`,
                timestamp: new Date(maint.scheduledDate || maint.createdAt || Date.now() - index * 900000),
                icon: 'build',
                color: 'warning'
            });
        });

        // Generate activities from vehicle status changes
        data.vehicles?.slice(0, 2).forEach((vehicle: any, index: number) => {
            if (vehicle.status === 'OnRoute' || vehicle.status === 'InUse') {
                activities.push({
                    id: activities.length + 1,
                    type: 'vehicle_deployed',
                    message: `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}) deployed`,
                    timestamp: new Date(vehicle.updatedAt || Date.now() - index * 1200000),
                    icon: 'local_shipping',
                    color: 'info'
                });
            }
        });

        this.recentActivities = activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
    }

    private getDriverNameById(driverId?: string): string | null {
        // This will be populated from the drivers array after loading
        return null;
    }

    getStatusColor(status: string): string {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower === 'inuse' || statusLower === 'onroute') {
            return 'success';
        }
        if (statusLower === 'maintenance' || statusLower === 'outofservice') {
            return 'warn';
        }
        if (statusLower === 'idle' || statusLower === 'ready') {
            return 'accent';
        }
        return 'primary';
    }

    get displayVehicles(): VehicleStatus[] {
        return this.vehicles;
    }

    getFuelLevelColor(level: number): string {
        if (level > 70) return 'success';
        if (level > 30) return 'warn';
        return 'danger';
    }

    getRelativeTime(date: Date): string {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    refreshData(): void {
        this.loadDashboardData();
    }

    private clearMessages(): void {
        setTimeout(() => {
            this.successMessage = '';
            this.errorMessage = '';
        }, 3000);
    }
}
