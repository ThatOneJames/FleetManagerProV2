import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { RouteService } from '../../../services/route.service';
import { AttendanceService, AttendanceRecord, WeeklyAttendance } from '../../../services/attendance.service';
import { LeaveRequestService } from '../../../services/leaverequest.service';
import { MaintenanceService } from '../../../services/maintenance.service';
import { VehicleService } from '../../../services/vehicle.service';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

interface TripStop {
    address: string;
    status: 'completed' | 'current' | 'pending';
}

interface CurrentTrip {
    destination: string;
    distance: string;
    stops: TripStop[];
}

interface Notification {
    id: string;
    type: 'trip' | 'leave' | 'maintenance';
    message: string;
    time: string;
    priority: 'high' | 'medium' | 'low';
}

interface DriverStats {
    tripsCompleted: number;
    hoursWorkedThisWeek: number;
}

@Component({
    selector: 'app-driver-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    currentUser: any = null;
    currentTrip: CurrentTrip | null = null;
    notifications: Notification[] = [];

    driverStats: DriverStats = {
        tripsCompleted: 0,
        hoursWorkedThisWeek: 0
    };

    todayAttendance: AttendanceRecord | null = null;
    weeklyAttendance: WeeklyAttendance | null = null;

    isLoading = true;
    errorMessage = '';
    assignedVehicle: string = 'Not Assigned';

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private routeService: RouteService,
        private attendanceService: AttendanceService,
        private leaveRequestService: LeaveRequestService,
        private maintenanceService: MaintenanceService,
        private vehicleService: VehicleService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadCurrentUser();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadCurrentUser(): void {
        const token = this.authService.getToken();
        if (!token) {
            this.errorMessage = 'Not authenticated';
            this.isLoading = false;
            return;
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        console.log('Loading current user from API...');
        this.http.get<any>(`${environment.apiUrl}/users/current`, { headers })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user) => {
                    console.log('✅ Current user loaded:', user);
                    this.currentUser = user;
                    this.loadDashboardData();
                },
                error: (err) => {
                    console.error('Error loading current user:', err);
                    this.errorMessage = 'Failed to load user data';
                    this.isLoading = false;
                }
            });
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

    private loadDashboardData(): void {
        if (!this.currentUser || !this.currentUser.id) {
            console.error('No current user, cannot load dashboard data');
            this.isLoading = false;
            return;
        }

        console.log('Loading dashboard data for user:', this.currentUser.id);

        const weekStart = this.attendanceService.getCurrentWeekStart();

        forkJoin({
            routes: this.routeService.getAllRoutes().pipe(
                catchError(err => {
                    console.error('Error loading routes:', err);
                    return of([]);
                })
            ),
            attendance: this.attendanceService.getMyTodayAttendance().pipe(
                catchError(err => {
                    console.error('Error loading attendance:', err);
                    return of(null);
                })
            ),
            weeklyAttendance: this.attendanceService.getMyWeeklyAttendance(weekStart).pipe(
                catchError(err => {
                    console.error('Error loading weekly attendance:', err);
                    return of(null);
                })
            ),
            leaveRequests: this.http.get<any>(`${environment.apiUrl}/leaverequests/driver/${this.currentUser.id}/active`, this.getHttpOptions()).pipe(
                catchError(err => {
                    console.error('Error loading leave requests:', err);
                    return of([]);
                })
            )
        }).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (data) => {
                console.log('Dashboard data loaded:', data);
                this.processRoutes(data.routes);
                this.processAttendance(data.attendance);
                this.processWeeklyAttendance(data.weeklyAttendance);
                this.generateNotifications(data);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading dashboard:', error);
                this.errorMessage = 'Failed to load dashboard data';
                this.isLoading = false;
            }
        });
    }

    private processRoutes(routes: any[]): void {
        const myRoutes = routes.filter(r => r.driverId === this.currentUser?.id);
        const activeRoute = myRoutes.find(r => r.status === 'in_progress');

        if (activeRoute) {
            let destination = 'Unknown';

            if (activeRoute.destinationAddress) {
                destination = activeRoute.destinationAddress;
            } else if (activeRoute.stops && activeRoute.stops.length > 0) {
                const sortedStops = activeRoute.stops.sort((a: any, b: any) => b.stopOrder - a.stopOrder);
                destination = sortedStops[0].address || activeRoute.name || 'Unknown';
            } else if (activeRoute.name) {
                destination = activeRoute.name;
            }

            this.currentTrip = {
                destination: destination,
                distance: this.calculateDistance(activeRoute),
                stops: this.mapStops(activeRoute.stops)
            };
            this.assignedVehicle = activeRoute.vehiclePlate || 'Unknown';
        }

        const completedRoutes = myRoutes.filter(r => r.status === 'completed');
        this.driverStats.tripsCompleted = completedRoutes.length;
    }

    private processAttendance(attendance: any): void {
        if (!attendance || !attendance.data) {
            this.todayAttendance = null;
            return;
        }

        this.todayAttendance = attendance.data;
    }

    private processWeeklyAttendance(weeklyData: any): void {
        if (!weeklyData) {
            this.weeklyAttendance = null;
            this.driverStats.hoursWorkedThisWeek = 0;
            return;
        }

        this.weeklyAttendance = weeklyData;
        this.driverStats.hoursWorkedThisWeek = weeklyData.stats?.totalHours || 0;

        console.log('✅ Weekly hours loaded:', this.driverStats.hoursWorkedThisWeek);
    }

    private generateNotifications(data: any): void {
        const notifications: Notification[] = [];
        let idCounter = 1;

        const upcomingRoutes = data.routes?.filter((r: any) =>
            r.driverId === this.currentUser?.id && r.status === 'planned'
        );

        if (upcomingRoutes && upcomingRoutes.length > 0) {
            notifications.push({
                id: `notif-${idCounter++}`,
                type: 'trip',
                message: `${upcomingRoutes.length} new ${upcomingRoutes.length === 1 ? 'route' : 'routes'} assigned`,
                time: 'Just now',
                priority: 'medium'
            });
        }

        data.leaveRequests?.forEach((lr: any) => {
            if (lr.status === 'Approved') {
                notifications.push({
                    id: `notif-${idCounter++}`,
                    type: 'leave',
                    message: `Leave request approved for ${new Date(lr.startDate).toLocaleDateString()}`,
                    time: '1 hour ago',
                    priority: 'low'
                });
            } else if (lr.status === 'Pending') {
                notifications.push({
                    id: `notif-${idCounter++}`,
                    type: 'leave',
                    message: 'Leave request pending approval',
                    time: '2 hours ago',
                    priority: 'low'
                });
            }
        });

        if (notifications.length === 0) {
            notifications.push({
                id: 'notif-1',
                type: 'trip',
                message: 'All caught up! No new notifications.',
                time: 'Just now',
                priority: 'low'
            });
        }

        this.notifications = notifications.slice(0, 3);
    }

    private mapStops(stops: any[]): TripStop[] {
        if (!stops) return [];
        return stops.map((stop, index) => ({
            address: stop.address || stop.location,
            status: stop.status === 'completed' ? 'completed' : (stop.status === 'in_progress' ? 'current' : 'pending')
        }));
    }

    private calculateDistance(route: any): string {
        if (route.totalDistance) {
            return `${route.totalDistance.toFixed(1)} km`;
        }

        const stops = route.stops?.length || 0;
        if (stops === 0) return '0.0 km';

        return `${(stops * 5.5).toFixed(1)} km`;
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'in-progress':
                return 'bg-blue-100 text-blue-700';
            case 'current':
                return 'bg-blue-100 text-blue-700';
            case 'pending':
                return 'bg-gray-100 text-gray-500';
            default:
                return 'bg-gray-100 text-gray-500';
        }
    }

    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700';
            case 'low':
                return 'bg-gray-100 text-gray-500';
            default:
                return 'bg-gray-100 text-gray-500';
        }
    }

    getDriverName(): string {
        return this.currentUser?.name || 'Driver';
    }

    get displayHoursWorked(): string {
        const hours = Math.floor(this.driverStats.hoursWorkedThisWeek);
        const minutes = Math.round((this.driverStats.hoursWorkedThisWeek - hours) * 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    viewAllNotifications(): void {
        this.router.navigate(['/driver/notifications']);
    }
}
