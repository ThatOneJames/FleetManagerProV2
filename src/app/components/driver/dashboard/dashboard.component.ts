import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { RouteService } from '../../../services/route.service';
import { AttendanceService } from '../../../services/attendance.service';
import { LeaveRequestService } from '../../../services/leaverequest.service';
import { environment } from '../../../../environments/environment';

interface TripStop {
    address: string;
    status: 'completed' | 'current' | 'pending';
}

interface CurrentTrip {
    destination: string;
    estimatedArrival: string;
    distance: string;
    stops: TripStop[];
}

interface ScheduleItem {
    time: string;
    task: string;
    status: 'completed' | 'in-progress' | 'pending';
}

interface Notification {
    id: number;
    message: string;
    time: string;
    priority: 'high' | 'medium' | 'low';
}

interface DriverStats {
    milesThisWeek: number;
    tripsCompleted: number;
    onTimeDeliveries: number;
    fuelEfficiency: number;
    hoursWorked: number;
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
    todaySchedule: ScheduleItem[] = [];
    notifications: Notification[] = [];
    driverStats: DriverStats = {
        milesThisWeek: 0,
        tripsCompleted: 0,
        onTimeDeliveries: 0,
        fuelEfficiency: 0,
        hoursWorked: 0
    };

    isLoading = true;
    errorMessage = '';
    assignedVehicle: string = 'Not Assigned';

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private routeService: RouteService,
        private attendanceService: AttendanceService,
        private leaveRequestService: LeaveRequestService
    ) { }

    ngOnInit(): void {
        this.loadCurrentUser();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ✅ FIXED: Load fresh user data from API
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

        console.log('📡 Loading current user from API...');

        this.http.get<any>(`${environment.apiUrl}/users/current`, { headers })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (user) => {
                    console.log('✅ Current user loaded:', user);
                    this.currentUser = user;
                    // Load dashboard data after user is loaded
                    this.loadDashboardData();
                },
                error: (err) => {
                    console.error('❌ Error loading current user:', err);
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
            console.error('❌ No current user, cannot load dashboard data');
            this.isLoading = false;
            return;
        }

        console.log('📊 Loading dashboard data for user:', this.currentUser.id);

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
            leaveRequests: this.http.get<any[]>(`${environment.apiUrl}/leaverequests/driver/${this.currentUser.id}/active`, this.getHttpOptions()).pipe(
                catchError(err => {
                    console.error('Error loading leave requests:', err);
                    return of([]);
                })
            )
        }).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (data) => {
                console.log('✅ Dashboard data loaded:', data);
                this.processRoutes(data.routes);
                this.processAttendance(data.attendance);
                this.processLeaveRequests(data.leaveRequests);
                this.generateSchedule(data);
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
            this.currentTrip = {
                destination: activeRoute.destinationAddress || 'Unknown',
                estimatedArrival: this.calculateETA(activeRoute),
                distance: this.calculateDistance(activeRoute),
                stops: this.mapStops(activeRoute.stops || [])
            };

            this.assignedVehicle = activeRoute.vehiclePlate || 'Unknown';
        }

        const completedRoutes = myRoutes.filter(r => r.status === 'completed');
        this.driverStats.tripsCompleted = completedRoutes.length;
        this.driverStats.onTimeDeliveries = completedRoutes.filter(r => this.isOnTime(r)).length;

        this.driverStats.milesThisWeek = completedRoutes.reduce((sum, r) => {
            return sum + (r.stops?.length * 5 || 10);
        }, 0);

        this.driverStats.fuelEfficiency = 8.4;
    }

    private processAttendance(attendance: any): void {
        if (!attendance || !attendance.clockIn) {
            this.driverStats.hoursWorked = 0;
            return;
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        try {
            const clockInStr = attendance.clockIn.split('.')[0];
            const clockInDateTime = new Date(`${today}T${clockInStr}`);
            const diffMs = now.getTime() - clockInDateTime.getTime();

            if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
                this.driverStats.hoursWorked = Math.floor(diffMs / (1000 * 60 * 60));
            } else {
                this.driverStats.hoursWorked = 0;
            }
        } catch (error) {
            console.error('Error parsing clock-in time:', error);
            this.driverStats.hoursWorked = 0;
        }
    }

    private processLeaveRequests(leaveRequests: any[]): void {
        // Leave requests will be shown in notifications
    }

    private generateSchedule(data: any): void {
        const schedule: ScheduleItem[] = [];
        const now = new Date();
        const currentHour = now.getHours();

        schedule.push({
            time: '8:00 AM',
            task: 'Vehicle Inspection',
            status: currentHour > 8 ? 'completed' : currentHour === 8 ? 'in-progress' : 'pending'
        });

        data.routes?.forEach((route: any, index: number) => {
            if (route.driverId === this.currentUser?.id && route.status !== 'cancelled') {
                const startTime = route.startTime ? new Date(route.startTime) : null;
                const timeStr = startTime ? startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : `${9 + index}:00 AM`;

                schedule.push({
                    time: timeStr,
                    task: `Route: ${route.name}`,
                    status: route.status === 'completed' ? 'completed' : route.status === 'in_progress' ? 'in-progress' : 'pending'
                });
            }
        });

        schedule.push({
            time: '12:00 PM',
            task: 'Lunch Break',
            status: currentHour > 12 ? 'completed' : currentHour === 12 ? 'in-progress' : 'pending'
        });

        schedule.push({
            time: '5:00 PM',
            task: 'End of Shift',
            status: currentHour >= 17 ? 'completed' : 'pending'
        });

        this.todaySchedule = schedule.sort((a, b) => {
            const timeA = this.convertTo24Hour(a.time);
            const timeB = this.convertTo24Hour(b.time);
            return timeA - timeB;
        });
    }

    private generateNotifications(data: any): void {
        const notifications: Notification[] = [];
        let idCounter = 1;

        const upcomingRoutes = data.routes?.filter((r: any) =>
            r.driverId === this.currentUser?.id && r.status === 'planned'
        ) || [];

        if (upcomingRoutes.length > 0) {
            notifications.push({
                id: idCounter++,
                message: `${upcomingRoutes.length} new route(s) assigned`,
                time: '10 min ago',
                priority: 'medium'
            });
        }

        data.leaveRequests?.forEach((lr: any) => {
            if (lr.status === 'Approved') {
                notifications.push({
                    id: idCounter++,
                    message: `Leave request approved for ${new Date(lr.startDate).toLocaleDateString()}`,
                    time: '1 hour ago',
                    priority: 'medium'
                });
            } else if (lr.status === 'Pending') {
                notifications.push({
                    id: idCounter++,
                    message: 'Leave request pending approval',
                    time: '2 hours ago',
                    priority: 'low'
                });
            }
        });

        if (notifications.length === 0) {
            notifications.push({
                id: 1,
                message: 'All caught up! No new notifications.',
                time: 'Just now',
                priority: 'low'
            });
        }

        this.notifications = notifications;
    }

    private mapStops(stops: any[]): TripStop[] {
        return stops.map((stop, index) => ({
            address: stop.address,
            status: stop.status === 'completed' ? 'completed' :
                stop.status === 'in_progress' ? 'current' : 'pending'
        }));
    }

    private calculateETA(route: any): string {
        const now = new Date();
        now.setHours(now.getHours() + 2);
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    private calculateDistance(route: any): string {
        const stops = route.stops?.length || 0;
        return `${(stops * 3.5).toFixed(1)} km`;
    }

    private isOnTime(route: any): boolean {
        return Math.random() > 0.2;
    }

    private convertTo24Hour(time: string): number {
        const [timeStr, period] = time.split(' ');
        const [hours, minutes] = timeStr.split(':').map(Number);
        let hour24 = hours;

        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;

        return hour24 * 60 + minutes;
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in-progress': return 'bg-blue-100 text-blue-700';
            case 'current': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-100 text-gray-500';
        }
    }

    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-100 text-gray-500';
        }
    }

    getOnTimeRate(): number {
        if (this.driverStats.tripsCompleted === 0) return 0;
        return Math.round((this.driverStats.onTimeDeliveries / this.driverStats.tripsCompleted) * 100);
    }

    getDriverName(): string {
        return this.currentUser?.name || 'Driver';
    }
}
