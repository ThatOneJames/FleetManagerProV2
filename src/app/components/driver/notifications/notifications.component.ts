import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { RouteService, Route } from '../../../services/route.service';
import { LeaveRequestService, LeaveRequest } from '../../../services/leaverequest.service';
import { MaintenanceService } from '../../../services/maintenance.service';
import { MaintenanceTask } from '../../../models/maintenance.model'; // IMPORT FROM YOUR MODEL
import { VehicleService } from '../../../services/vehicle.service';
import { AuthService } from '../../../services/auth.service';

export interface Notification {
    id: string;
    type: 'trip' | 'leave' | 'maintenance';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
    actionRequired: boolean;
    timestamp: Date;
    isRead: boolean;
    relatedId?: string;
}

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notifications.component.html',
    styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
    notifications: Notification[] = [];
    filteredNotifications: Notification[] = [];
    activeTab: 'all' | 'unread' | 'action' = 'all';

    currentUserId: string = '';
    loading: boolean = false;
    errorMessage: string = '';

    // Subscription for auto-refresh
    private refreshSubscription?: Subscription;

    constructor(
        private routeService: RouteService,
        private leaveService: LeaveRequestService,
        private maintenanceService: MaintenanceService,
        private vehicleService: VehicleService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.currentUserId = this.authService.getCurrentUserId() || '';
        console.log('Current User ID:', this.currentUserId);

        if (!this.currentUserId) {
            this.errorMessage = 'User not authenticated';
            return;
        }

        // Initial load
        this.loadNotifications();

        // Auto-refresh every 30 seconds
        this.refreshSubscription = interval(30000).subscribe(() => {
            this.loadNotifications();
        });
    }

    ngOnDestroy(): void {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
    }

    async loadNotifications(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        this.notifications = [];

        try {
            // Load all notification data in parallel
            await Promise.all([
                this.loadTripNotifications(),
                this.loadLeaveNotifications(),
                this.loadMaintenanceNotifications()
            ]);

            // Sort by timestamp (newest first)
            this.notifications.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // Apply current filter
            this.filterNotifications();

        } catch (error: any) {
            console.error('Error loading notifications:', error);
            this.errorMessage = 'Failed to load notifications';
        } finally {
            this.loading = false;
        }
    }

    private async loadTripNotifications(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.routeService.getRoutesByDriver(this.currentUserId).subscribe({
                next: (routes) => {
                    routes.forEach(route => {
                        // Only show planned and in_progress trips
                        if (route.status === 'planned' || route.status === 'in_progress') {
                            const notification: Notification = {
                                id: `trip-${route.id}`,
                                type: 'trip',
                                title: 'New Trip Assignment',
                                message: this.generateTripMessage(route),
                                priority: this.determineTripPriority(route),
                                category: 'Trip',
                                actionRequired: route.status === 'planned',
                                timestamp: route.createdAt || new Date(),
                                isRead: false,
                                relatedId: route.id
                            };
                            this.notifications.push(notification);
                        }
                    });
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading trip notifications:', error);
                    resolve(); // Continue even if this fails
                }
            });
        });
    }

    private async loadLeaveNotifications(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.leaveService.getLeaveRequestsByDriverId(this.currentUserId).subscribe({
                next: (leaveRequests) => {
                    // Only show approved/rejected leaves (notifications)
                    leaveRequests
                        .filter(req => req.status === 'Approved' || req.status === 'Rejected')
                        .forEach(leave => {
                            const notification: Notification = {
                                id: `leave-${leave.id}`,
                                type: 'leave',
                                title: 'Leave Request ' + leave.status,
                                message: this.generateLeaveMessage(leave),
                                priority: 'low',
                                category: 'Admin',
                                actionRequired: false,
                                timestamp: leave.approvedAt ? new Date(leave.approvedAt) : new Date(leave.updatedAt),
                                isRead: false,
                                relatedId: leave.id
                            };
                            this.notifications.push(notification);
                        });
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading leave notifications:', error);
                    resolve();
                }
            });
        });
    }

    private async loadMaintenanceNotifications(): Promise<void> {
        return new Promise((resolve, reject) => {
            // First, add the hardcoded weekly safety inspection reminder
            this.addWeeklySafetyInspectionReminder();

            // Then get scheduled maintenance tasks from the system
            this.maintenanceService.getAllTasks().subscribe({
                next: (tasks) => {
                    // Filter tasks for vehicles assigned to this driver
                    this.vehicleService.getAllVehicles().subscribe({
                        next: (vehicles) => {
                            const driverVehicles = vehicles.filter(v => v.currentDriverId === this.currentUserId);

                            tasks.forEach(task => {
                                const isDriverVehicle = driverVehicles.some(v => v.id === task.vehicleId);

                                // Only show maintenance for driver's assigned vehicles
                                if (isDriverVehicle && (task.status === 'Scheduled' || task.status === 'Overdue')) {
                                    const vehicle = driverVehicles.find(v => v.id === task.vehicleId);

                                    const notification: Notification = {
                                        id: `maintenance-${task.id}`,
                                        type: 'maintenance',
                                        title: 'Vehicle Inspection Due',
                                        message: this.generateMaintenanceMessage(task, vehicle?.licensePlate || 'Unknown'),
                                        priority: this.determineMaintenancePriority(task),
                                        category: 'Maintenance',
                                        actionRequired: task.priority === 'High',
                                        timestamp: task.scheduledDate ? new Date(task.scheduledDate) : new Date(),
                                        isRead: false,
                                        relatedId: task.id
                                    };
                                    this.notifications.push(notification);
                                }
                            });
                            resolve();
                        },
                        error: (error) => {
                            console.error('Error loading vehicles for maintenance:', error);
                            resolve();
                        }
                    });
                },
                error: (error) => {
                    console.error('Error loading maintenance notifications:', error);
                    // Still add weekly reminder even if tasks fail to load
                    resolve();
                }
            });
        });
    }

    private addWeeklySafetyInspectionReminder(): void {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Calculate next inspection day (let's use Monday as inspection day)
        const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
        const nextInspectionDate = new Date(today);
        nextInspectionDate.setDate(today.getDate() + daysUntilMonday);

        // Get driver's assigned vehicle
        this.vehicleService.getAllVehicles().subscribe({
            next: (vehicles) => {
                const driverVehicle = vehicles.find(v => v.currentDriverId === this.currentUserId);

                if (driverVehicle) {
                    const inspectionDay = this.getNextInspectionDay();
                    const isToday = daysUntilMonday === 0;
                    const isTomorrow = daysUntilMonday === 1;

                    // Determine priority based on how close the inspection day is
                    let priority: 'high' | 'medium' | 'low' = 'medium';
                    let actionRequired = false;

                    if (isToday) {
                        priority = 'high';
                        actionRequired = true;
                    } else if (isTomorrow) {
                        priority = 'high';
                        actionRequired = true;
                    } else if (daysUntilMonday <= 3) {
                        priority = 'medium';
                    }

                    const notification: Notification = {
                        id: `weekly-inspection-${driverVehicle.id}`,
                        type: 'maintenance',
                        title: 'Weekly Safety Inspection Reminder',
                        message: this.generateWeeklySafetyInspectionMessage(
                            driverVehicle.licensePlate || driverVehicle.id,
                            inspectionDay,
                            isToday,
                            isTomorrow
                        ),
                        priority: priority,
                        category: 'Maintenance',
                        actionRequired: actionRequired,
                        timestamp: new Date(),
                        isRead: false,
                        relatedId: `weekly-${driverVehicle.id}`
                    };

                    this.notifications.push(notification);
                }
            },
            error: (error) => {
                console.error('Error loading vehicle for weekly reminder:', error);
            }
        });
    }

    private generateWeeklySafetyInspectionMessage(
        vehiclePlate: string,
        inspectionDay: string,
        isToday: boolean,
        isTomorrow: boolean
    ): string {
        if (isToday) {
            return `Your assigned vehicle ${vehiclePlate} requires a weekly safety inspection TODAY. Please complete the pre-trip inspection checklist covering: engine fluids, brakes, tires, lights, steering, suspension, and emergency equipment before your next trip.`;
        } else if (isTomorrow) {
            return `Your assigned vehicle ${vehiclePlate} requires a weekly safety inspection TOMORROW (${inspectionDay}). Please prepare to complete the inspection covering: engine fluids, brakes, tires, lights, steering, and emergency equipment.`;
        } else {
            return `Your assigned vehicle ${vehiclePlate} requires a weekly safety inspection on ${inspectionDay}. Please complete before your next trip covering: engine fluids, brakes, tires, lights, steering, suspension, and emergency equipment.`;
        }
    }

    private getNextInspectionDay(): string {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;

        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);

        if (daysUntilMonday === 0) {
            return 'Today';
        } else if (daysUntilMonday === 1) {
            return 'Tomorrow';
        } else {
            return nextMonday.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        }
    }


    private generateTripMessage(route: Route): string {
        const scheduledTime = route.startTime
            ? new Date(route.startTime).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
            : 'Not scheduled';

        const firstStop = route.stops && route.stops.length > 0
            ? route.stops.sort((a, b) => a.stopOrder - b.stopOrder)[0].address
            : 'Unknown';

        const lastStop = route.stops && route.stops.length > 0
            ? route.stops.sort((a, b) => b.stopOrder - a.stopOrder)[0].address
            : 'Unknown';

        const vehicleInfo = route.vehiclePlate
            ? `Vehicle: ${route.vehiclePlate}`
            : route.vehicleId
                ? `Vehicle ID: ${route.vehicleId}`
                : '';

        return `You have been assigned to Trip #${route.name || route.id} scheduled for ${scheduledTime}. ${vehicleInfo ? vehicleInfo + '. ' : ''}Route: ${firstStop} → ${lastStop}.`;
    }


    private generateLeaveMessage(leave: LeaveRequest): string {
        if (leave.status === 'Approved') {
            const approver = leave.approverUser?.name || 'Admin';
            return `Your leave request for ${leave.leaveTypeName} has been approved by ${approver}. Have a great day off!`;
        } else {
            const reason = leave.rejectionReason || 'Not specified';
            return `Your leave request for ${leave.leaveTypeName} was not approved. Reason: ${reason}`;
        }
    }

    private generateMaintenanceMessage(task: MaintenanceTask, vehiclePlate: string): string {
        const scheduledDate = task.scheduledDate
            ? new Date(task.scheduledDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            })
            : 'soon';

        return `Your assigned vehicle ${vehiclePlate} requires a ${task.taskType} inspection. Please complete before your next trip.`;
    }

    private determineTripPriority(route: Route): 'high' | 'medium' | 'low' {
        if (!route.startTime) return 'medium';

        const startTime = new Date(route.startTime);
        const now = new Date();
        const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilStart < 24) return 'high';
        if (hoursUntilStart < 72) return 'medium';
        return 'low';
    }

    private determineMaintenancePriority(task: MaintenanceTask): 'high' | 'medium' | 'low' {
        if (task.priority === 'High') return 'high';
        if (task.priority === 'Medium') return 'medium';
        return 'low';
    }

    // Filter and tab management
    filterNotifications(): void {
        switch (this.activeTab) {
            case 'unread':
                this.filteredNotifications = this.notifications.filter(n => !n.isRead);
                break;
            case 'action':
                this.filteredNotifications = this.notifications.filter(n => n.actionRequired);
                break;
            default:
                this.filteredNotifications = [...this.notifications];
        }
    }

    setActiveTab(tab: 'all' | 'unread' | 'action'): void {
        this.activeTab = tab;
        this.filterNotifications();
    }

    markAsRead(notification: Notification): void {
        notification.isRead = true;
        this.filterNotifications();
    }

    markAllAsRead(): void {
        this.notifications.forEach(n => n.isRead = true);
        this.filterNotifications();
    }

    deleteNotification(notification: Notification): void {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.filterNotifications();
    }

    // Getters for stats
    get totalNotifications(): number {
        return this.notifications.length;
    }

    get unreadCount(): number {
        return this.notifications.filter(n => !n.isRead).length;
    }

    get actionRequiredCount(): number {
        return this.notifications.filter(n => n.actionRequired).length;
    }

    getPriorityClass(priority: string): string {
        switch (priority) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return '';
        }
    }

    getCategoryClass(category: string): string {
        switch (category) {
            case 'Trip': return 'category-trip';
            case 'Admin': return 'category-admin';
            case 'Maintenance': return 'category-maintenance';
            default: return '';
        }
    }

    formatTimestamp(timestamp: Date): string {
        const now = new Date();
        const notifDate = new Date(timestamp);
        const diffMs = now.getTime() - notifDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return notifDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: notifDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}
