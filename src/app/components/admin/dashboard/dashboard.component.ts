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
import { MaintenanceRequestService } from '../../../services/maintenancerequest.service';

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
        private maintenanceService: MaintenanceService,
        private maintenanceRequestService: MaintenanceRequestService
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
            fuelLevel: v.fuelLevel || 0
        }));

        const activeCount = vehicles.filter(v =>
            v.status === 'Active' ||
            v.status === 'InUse' ||
            v.status === 'OnRoute' ||
            v.status === 'Ready'
        ).length;

        const maintenanceCount = vehicles.filter(v =>
            v.status === 'Maintenance' || v.status === 'OutOfService'
        ).length;

        const idleCount = vehicles.filter(v =>
            v.status === 'Idle' || v.status === 'NotAvailable'
        ).length;

        this.chartData.vehicleStatus = [
            { name: 'Active', value: activeCount, color: '#4caf50' },
            { name: 'Maintenance', value: maintenanceCount, color: '#ff9800' },
            { name: 'Idle', value: idleCount, color: '#9e9e9e' }
        ];

        this.stats.totalMileage = vehicles.reduce((sum, v) => sum + (v.currentMileage || 0), 0);

        const totalFuel = vehicles.reduce((sum, v) => sum + (v.fuelLevel || 0), 0);
        this.stats.fuelConsumption = vehicles.length > 0 ? Math.round(totalFuel / vehicles.length) : 0;
    }

    private async processDrivers(drivers: any[]): Promise<void> {
        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        this.routeService.getAllRoutes().subscribe({
            next: (routes) => {
                const driversOnRoute = new Set(
                    routes
                        .filter(r => r.status === 'in_progress')
                        .map(r => r.driverId)
                );

                const driverPromises = drivers
                    .filter(d => d.role === 'Driver')
                    .map(driver =>
                        this.http.get<any>(`${this.apiUrl}/attendance/driver/${driver.id}/today`, { headers })
                            .toPromise()
                            .then(attendance => {
                                const clockedIn = attendance?.data?.clockIn || attendance?.clockIn;
                                const clockedOut = attendance?.data?.clockOut || attendance?.clockOut;

                                return clockedIn && !clockedOut ? 1 : 0;
                            })
                            .catch(() => 0)
                    );

                Promise.all(driverPromises).then(counts => {
                    this.stats.totalDrivers = counts.reduce((sum, count) => sum + count, 0);
                });
            },
            error: (err) => {
                console.error('Error loading routes for driver check:', err);
                this.stats.totalDrivers = drivers.filter(d => d.role === 'Driver').length;
            }
        });
    }

    private processRoutes(routes: any[]): void {
        this.stats.activeRoutes = routes.filter(r =>
            r.status === 'in_progress' ||
            r.status === 'planned' ||
            r.status === 'scheduled'
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
                maintenanceTasks: this.maintenanceService.getAllTasks().pipe(
                    catchError(err => {
                        console.warn('Maintenance tasks endpoint not available:', err);
                        return of([]);
                    })
                ),
                maintenanceRequests: this.maintenanceRequestService.getAllRequests().pipe(
                    catchError(err => {
                        console.warn('Maintenance requests endpoint not available:', err);
                        return of([]);
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
                    this.processMaintenance(data.maintenanceTasks, data.maintenanceRequests, data.vehicles);
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

    private processMaintenance(tasks: any[], requests: any[], vehicles: any[]): void {
        let maintenanceCount = 0;

        if (tasks && tasks.length > 0) {
            const activeTasks = tasks.filter(t =>
                t.status === 'Scheduled' ||
                t.status === 'Pending' ||
                t.status === 'InProgress' ||
                t.status === 'Overdue'
            );
            maintenanceCount += activeTasks.length;
        }

        if (requests && requests.length > 0) {
            const activeRequests = requests.filter(r => {
                const status = r.status?.replace(/\s+/g, '');
                return status === 'Pending' || status === 'InProgress';
            });
            maintenanceCount += activeRequests.length;
        }

        const vehiclesInMaintenance = vehicles.filter(v =>
            v.status === 'Maintenance' || v.status === 'OutOfService'
        ).length;

        this.stats.maintenanceDue = Math.max(maintenanceCount, vehiclesInMaintenance);

        console.log('=== Maintenance Due Calculation ===');
        console.log('Active tasks:', maintenanceCount);
        console.log('Vehicles in maintenance:', vehiclesInMaintenance);
        console.log('Final Maintenance Due:', this.stats.maintenanceDue);
        console.log('===================================');
    }

    private generateActivities(data: any): void {
        const activities: Activity[] = [];

        const getDriverName = (driverId: string): string => {
            if (!driverId || !data.drivers) return 'Unknown';
            const driver = data.drivers.find((d: any) => d.id === driverId);
            return driver ? driver.name : 'Unknown';
        };

        if (data.routes && Array.isArray(data.routes)) {
            data.routes.slice(0, 5).forEach((route: any, index: number) => {
                if (!route) return;

                const driverName = getDriverName(route.driverId);

                if (route.status === 'completed') {
                    activities.push({
                        id: activities.length + 1,
                        type: 'route_completed',
                        message: `Route "${route.name || 'Unnamed'}" completed by ${driverName}`,
                        timestamp: new Date(route.endTime || route.updatedAt || Date.now() - index * 300000),
                        icon: 'check_circle',
                        color: 'success'
                    });
                } else if (route.status === 'in_progress') {
                    activities.push({
                        id: activities.length + 1,
                        type: 'route_started',
                        message: `Route "${route.name || 'Unnamed'}" started by ${driverName}`,
                        timestamp: new Date(route.startTime || route.updatedAt || Date.now() - index * 600000),
                        icon: 'directions',
                        color: 'info'
                    });
                } else if (route.status === 'planned' || route.status === 'scheduled') {
                    activities.push({
                        id: activities.length + 1,
                        type: 'route_planned',
                        message: `Route "${route.name || 'Unnamed'}" scheduled for ${driverName}`,
                        timestamp: new Date(route.createdAt || route.updatedAt || Date.now() - index * 400000),
                        icon: 'schedule',
                        color: 'info'
                    });
                }
            });
        }

        if (data.maintenanceTasks && Array.isArray(data.maintenanceTasks)) {
            data.maintenanceTasks.slice(0, 2).forEach((maint: any, index: number) => {
                if (!maint) return;

                const vehicle = data.vehicles?.find((v: any) => v.id === maint.vehicleId);
                const vehicleName = vehicle
                    ? `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.licensePlate || ''})`.trim()
                    : 'Unknown Vehicle';

                activities.push({
                    id: activities.length + 1,
                    type: 'maintenance_scheduled',
                    message: `${vehicleName} scheduled for ${maint.taskType || 'maintenance'}`,
                    timestamp: new Date(maint.scheduledDate || maint.createdAt || Date.now() - index * 900000),
                    icon: 'build',
                    color: 'warning'
                });
            });
        }

        if (data.maintenanceRequests && Array.isArray(data.maintenanceRequests)) {
            data.maintenanceRequests.slice(0, 2).forEach((request: any, index: number) => {
                if (!request || request.status === 'Completed') return;

                const vehicle = data.vehicles?.find((v: any) => v.id === request.vehicleId);
                const vehicleName = vehicle
                    ? `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.licensePlate || ''})`.trim()
                    : 'Unknown Vehicle';

                activities.push({
                    id: activities.length + 1,
                    type: 'maintenance_requested',
                    message: `${vehicleName} - ${request.issueType || 'Issue'} reported (${request.issueSeverity || 'Unknown'} priority)`,
                    timestamp: new Date(request.reportedDate || request.createdAt || Date.now() - index * 700000),
                    icon: 'build',
                    color: 'warning'
                });
            });
        }

        if (data.vehicles && Array.isArray(data.vehicles)) {
            data.vehicles.slice(0, 2).forEach((vehicle: any, index: number) => {
                if (!vehicle) return;

                if (vehicle.status === 'OnRoute' || vehicle.status === 'InUse' || vehicle.status === 'Active') {
                    const vehicleName = `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.licensePlate || ''})`.trim();

                    activities.push({
                        id: activities.length + 1,
                        type: 'vehicle_deployed',
                        message: `${vehicleName} deployed`,
                        timestamp: new Date(vehicle.updatedAt || Date.now() - index * 1200000),
                        icon: 'local_shipping',
                        color: 'info'
                    });
                }
            });
        }

        this.recentActivities = activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
    }

    getStatusColor(status: string): string {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower === 'inuse' || statusLower === 'onroute' || statusLower === 'ready') {
            return 'success';
        }
        if (statusLower === 'maintenance' || statusLower === 'outofservice') {
            return 'warn';
        }
        if (statusLower === 'idle' || statusLower === 'notavailable') {
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
