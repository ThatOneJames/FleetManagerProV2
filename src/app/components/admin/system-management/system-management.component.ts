import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { interval, Subscription } from 'rxjs';
import { DriverService, CreateDriverDto, UpdateDriverDto } from '../../../services/driver.service';
import { NotificationService, Notification, NotificationRule } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-system-management',
    templateUrl: './system-management.component.html',
    styleUrls: ['./system-management.component.css']
})
export class SystemManagementComponent implements OnInit, OnDestroy {
    selectedTabIndex = 0;
    users: User[] = [];
    vehicles: any[] = [];
    userColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
    userForm!: FormGroup;
    editingUser: User | null = null;
    showUserForm = false;
    notifications: Notification[] = [];
    notificationRules: NotificationRule[] = [];
    sendNotificationForm!: FormGroup;
    notificationRuleForm!: FormGroup;
    editingRule: NotificationRule | null = null;
    notificationSubTab = 0;
    rulesColumns: string[] = ['name', 'triggerType', 'recipients', 'channels', 'isActive', 'triggeredCount', 'lastTriggered', 'actions'];
    historyColumns: string[] = ['id', 'title', 'type', 'recipients', 'createdAt', 'status', 'actions'];
    reports: any[] = [];
    reportColumns: string[] = ['reportName', 'type', 'generatedDate', 'size', 'format', 'actions'];
    loading = false;
    savingUser = false;
    savingRule = false;
    sendingNotification = false;
    roles = [
        { id: 'Admin', name: 'Admin' },
        { id: 'Manager', name: 'Manager' },
        { id: 'Driver', name: 'Driver' }
    ];
    statusOptions = ['Active', 'Inactive', 'Suspended'];
    notificationTypes = ['Info', 'Warning', 'Success', 'Error'];
    notificationCategories = ['System', 'Trip', 'Maintenance', 'Leave', 'Admin', 'Announcement'];
    triggerTypes = [
        'TripAssigned',
        'TripCompleted',
        'MaintenanceDue',
        'MaintenanceOverdue',
        'LeaveApproved',
        'LeaveRejected',
        'LeaveRequested',
        'InspectionReportSubmitted',
        'RouteCompleted',
        'DriverStatusChange',
        'VehicleStatusChange',
        'SystemMaintenance',
        'EmergencyAlert'
    ];
    private refreshSubscription?: Subscription;

    constructor(
        private fb: FormBuilder,
        private notificationService: NotificationService,
        private driverService: DriverService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private http: HttpClient
    ) {
        this.initializeForms();
    }

    ngOnInit(): void {
        this.loadAllData();
        this.refreshSubscription = interval(30000).subscribe(() => {
            this.refreshData();
        });
        this.createDefaultNotificationRules();
    }

    ngOnDestroy(): void {
        this.refreshSubscription?.unsubscribe();
    }

    private initializeForms(): void {
        this.userForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            address: [''],
            role: ['Driver', Validators.required],
            status: ['Active', Validators.required],
            password: ['', [Validators.minLength(6)]]
        });
        this.sendNotificationForm = this.fb.group({
            recipientType: ['all', Validators.required],
            specificUsers: [[]],
            specificRoles: [[]],
            title: ['', [Validators.required, Validators.maxLength(255)]],
            message: ['', Validators.required],
            type: ['Info', Validators.required],
            category: ['System', Validators.required],
            sendEmail: [false],
            sendSms: [false],
            scheduleType: ['immediate'],
            scheduledTime: [null]
        });
        this.notificationRuleForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            triggerType: ['', Validators.required],
            conditionText: ['', Validators.maxLength(500)],
            recipientType: ['all', Validators.required],
            specificUsers: [[]],
            specificRoles: [[]],
            sendEmail: [false],
            sendSms: [false],
            isActive: [true]
        });
        this.sendNotificationForm.get('recipientType')?.valueChanges.subscribe(value => {
            this.updateRecipientValidators(this.sendNotificationForm, value);
        });
        this.notificationRuleForm.get('recipientType')?.valueChanges.subscribe(value => {
            this.updateRecipientValidators(this.notificationRuleForm, value);
        });
        this.sendNotificationForm.get('scheduleType')?.valueChanges.subscribe(value => {
            const scheduledTimeControl = this.sendNotificationForm.get('scheduledTime');
            if (value === 'scheduled') {
                scheduledTimeControl?.setValidators([Validators.required]);
            } else {
                scheduledTimeControl?.clearValidators();
            }
            scheduledTimeControl?.updateValueAndValidity();
        });
    }

    private updateRecipientValidators(form: FormGroup, recipientType: string): void {
        const usersControl = form.get('specificUsers');
        const rolesControl = form.get('specificRoles');
        usersControl?.clearValidators();
        rolesControl?.clearValidators();
        if (recipientType === 'specific') {
            usersControl?.setValidators([Validators.required]);
        } else if (recipientType === 'role') {
            rolesControl?.setValidators([Validators.required]);
        }
        usersControl?.updateValueAndValidity();
        rolesControl?.updateValueAndValidity();
    }

    private async createDefaultNotificationRules(): Promise<void> {
        const defaultRules = [
            {
                name: 'Leave Request Notification',
                triggerType: 'LeaveRequested',
                conditionText: 'Notify admin when a driver submits a leave request',
                recipients: 'Admin',
                sendEmail: true,
                sendSms: false,
                isActive: true
            },
            {
                name: 'Inspection Report Notification',
                triggerType: 'InspectionReportSubmitted',
                conditionText: 'Notify admin when an inspection report is submitted',
                recipients: 'Admin',
                sendEmail: true,
                sendSms: false,
                isActive: true
            },
            {
                name: 'Route Completion Notification',
                triggerType: 'RouteCompleted',
                conditionText: 'Notify admin when a driver completes a route',
                recipients: 'Admin',
                sendEmail: false,
                sendSms: false,
                isActive: true
            }
        ];

        for (const rule of defaultRules) {
            const exists = this.notificationRules.some(r => r.name === rule.name);
            if (!exists) {
                try {
                    await this.notificationService.createRule(rule).toPromise();
                } catch (error) {
                    console.error(`Error creating rule ${rule.name}:`, error);
                }
            }
        }
    }

    private async loadAllData(): Promise<void> {
        this.loading = true;
        try {
            await Promise.all([
                this.loadUsers(),
                this.loadVehicles(),
                this.loadNotifications(),
                this.loadNotificationRules(),
                this.loadReports()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showSnackbar('Error loading system data', 'error');
        } finally {
            this.loading = false;
        }
    }

    private async refreshData(): Promise<void> {
        await Promise.all([
            this.loadUsers(),
            this.loadNotifications(),
            this.loadNotificationRules()
        ]);
    }

    private async loadUsers(): Promise<void> {
        return new Promise((resolve) => {
            this.driverService.getAllUsers().subscribe({
                next: (data) => {
                    this.users = data;
                    console.log('✅ Loaded users:', this.users.length);
                    resolve();
                },
                error: (error) => {
                    console.error('❌ Error loading users:', error);
                    resolve();
                }
            });
        });
    }

    private async loadVehicles(): Promise<void> {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        return new Promise((resolve) => {
            this.http.get<any[]>(`${environment.apiUrl}/vehicles`, { headers }).subscribe({
                next: (data) => {
                    this.vehicles = data;
                    resolve();
                },
                error: () => resolve()
            });
        });
    }

    toggleUserForm(): void {
        this.showUserForm = !this.showUserForm;
        if (!this.showUserForm) {
            this.editingUser = null;
            this.userForm.reset({ role: 'Driver', status: 'Active' });
        }
    }

    async saveUser(): Promise<void> {
        if (this.userForm.invalid) {
            this.showSnackbar('Please fill all required fields', 'error');
            return;
        }
        this.savingUser = true;
        try {
            if (this.editingUser) {
                const updateData: UpdateDriverDto = {
                    name: this.userForm.get('name')?.value,
                    email: this.userForm.get('email')?.value,
                    phone: this.userForm.get('phone')?.value,
                    address: this.userForm.get('address')?.value,
                    status: this.userForm.get('status')?.value
                };
                await this.driverService.updateDriver(this.editingUser.id, updateData).toPromise();
                this.showSnackbar('User updated successfully', 'success');
            } else {
                const password = this.userForm.get('password')?.value;
                if (!password) {
                    this.showSnackbar('Password is required for new users', 'error');
                    this.savingUser = false;
                    return;
                }
                const createData: CreateDriverDto = {
                    name: this.userForm.get('name')?.value,
                    email: this.userForm.get('email')?.value,
                    password: password,
                    role: this.userForm.get('role')?.value || 'Driver',
                    phone: this.userForm.get('phone')?.value || '',
                    address: this.userForm.get('address')?.value || '',
                    status: this.userForm.get('status')?.value || 'Active',
                    isAvailable: true,
                    hasHelper: false,
                    totalMilesDriven: 0,
                    safetyRating: 5
                };
                await this.driverService.createDriver(createData).toPromise();
                this.showSnackbar('User created successfully', 'success');
            }
            this.userForm.reset({ role: 'Driver', status: 'Active' });
            this.editingUser = null;
            this.showUserForm = false;
            await this.loadUsers();
        } catch (error: any) {
            console.error('Error saving user:', error);
            const errorMessage = error?.message || 'Error saving user';
            this.showSnackbar(errorMessage, 'error');
        } finally {
            this.savingUser = false;
        }
    }

    editUser(user: User): void {
        this.editingUser = user;
        this.showUserForm = true;
        this.userForm.patchValue({
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            status: user.status
        });
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
    }

    async toggleUserStatus(user: User): Promise<void> {
        try {
            const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
            await this.driverService.updateDriverStatus(user.id, newStatus).toPromise();
            user.status = newStatus;
            this.showSnackbar(`User ${newStatus.toLowerCase()}`, 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
            this.showSnackbar('Error updating user status', 'error');
        }
    }

    async deleteUser(user: User): Promise<void> {
        if (!confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return;
        try {
            await this.driverService.deleteDriver(user.id).toPromise();
            this.showSnackbar('User deleted successfully', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showSnackbar('Error deleting user', 'error');
        }
    }

    cancelEditUser(): void {
        this.editingUser = null;
        this.showUserForm = false;
        this.userForm.reset({ role: 'Driver', status: 'Active' });
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.userForm.get('password')?.updateValueAndValidity();
    }

    private async loadNotifications(): Promise<void> {
        return new Promise((resolve) => {
            console.log('🔄 Loading notifications...');
            const token = this.authService.getToken();
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`
            });

            this.http.get<any[]>(`${environment.apiUrl}/notifications`, { headers }).subscribe({
                next: (data) => {
                    console.log('✅ Notifications loaded:', data);
                    this.notifications = data.sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    ).slice(0, 100);
                    console.log('📊 Notifications array:', this.notifications);
                    resolve();
                },
                error: (error) => {
                    console.error('❌ Error loading notifications:', error);
                    resolve();
                }
            });
        });
    }

    private async loadNotificationRules(): Promise<void> {
        return new Promise((resolve) => {
            this.notificationService.getRules().subscribe({
                next: (data) => {
                    this.notificationRules = data;
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading rules:', error);
                    resolve();
                }
            });
        });
    }

    async markAsRead(notification: Notification): Promise<void> {
        try {
            const token = this.authService.getToken();
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`
            });

            await this.http.put(`${environment.apiUrl}/notifications/${notification.id}/read`, {}, { headers }).toPromise();
            notification.isRead = true;

            this.showSnackbar('Notification marked as read', 'success');
            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            this.showSnackbar('Error updating notification', 'error');
        }
    }

    async sendNotification(): Promise<void> {
        if (this.sendNotificationForm.invalid) {
            this.showSnackbar('Please fill all required fields', 'error');
            return;
        }
        this.sendingNotification = true;
        try {
            const formValue = this.sendNotificationForm.value;
            const recipients = this.getRecipients(formValue.recipientType, formValue.specificUsers, formValue.specificRoles);
            for (const userId of recipients) {
                const notification: Partial<Notification> = {
                    userId: userId,
                    title: formValue.title,
                    message: formValue.message,
                    type: formValue.type,
                    category: formValue.category,
                    sendEmail: formValue.sendEmail,
                    sendSms: formValue.sendSms
                };
                await this.notificationService.createNotification(notification).toPromise();
            }
            this.showSnackbar(`Notification sent to ${recipients.length} user(s)`, 'success');
            this.sendNotificationForm.reset({
                recipientType: 'all',
                type: 'Info',
                category: 'System',
                sendEmail: false,
                sendSms: false,
                scheduleType: 'immediate'
            });
            await this.loadNotifications();
        } catch (error) {
            console.error('Error sending notification:', error);
            this.showSnackbar('Error sending notification', 'error');
        } finally {
            this.sendingNotification = false;
        }
    }

    async saveNotificationRule(): Promise<void> {
        if (this.notificationRuleForm.invalid) {
            this.showSnackbar('Please fill all required fields', 'error');
            return;
        }
        this.savingRule = true;
        try {
            const formValue = this.notificationRuleForm.value;
            const recipients = this.getRecipientString(formValue.recipientType, formValue.specificUsers, formValue.specificRoles);
            const rule: Partial<NotificationRule> = {
                name: formValue.name,
                triggerType: formValue.triggerType,
                conditionText: formValue.conditionText,
                recipients: recipients,
                sendEmail: formValue.sendEmail,
                sendSms: formValue.sendSms,
                isActive: formValue.isActive
            };
            if (this.editingRule) {
                await this.notificationService.updateRule(this.editingRule.id, rule).toPromise();
                this.showSnackbar('Rule updated', 'success');
            } else {
                await this.notificationService.createRule(rule).toPromise();
                this.showSnackbar('Rule created', 'success');
            }
            this.notificationRuleForm.reset({
                recipientType: 'all',
                sendEmail: false,
                sendSms: false,
                isActive: true
            });
            this.editingRule = null;
            await this.loadNotificationRules();
        } catch (error) {
            console.error('Error saving rule:', error);
            this.showSnackbar('Error saving rule', 'error');
        } finally {
            this.savingRule = false;
        }
    }

    editRule(rule: NotificationRule): void {
        this.editingRule = rule;
        this.notificationSubTab = 0;
        let recipientType = 'all';
        let specificUsers: string[] = [];
        let specificRoles: string[] = [];
        if (rule.recipients === 'all') {
            recipientType = 'all';
        } else if (this.roles.some(r => rule.recipients?.includes(r.id))) {
            recipientType = 'role';
            specificRoles = rule.recipients?.split(',') || [];
        } else {
            recipientType = 'specific';
            specificUsers = rule.recipients?.split(',') || [];
        }
        this.notificationRuleForm.patchValue({
            name: rule.name,
            triggerType: rule.triggerType,
            conditionText: rule.conditionText,
            recipientType: recipientType,
            specificUsers: specificUsers,
            specificRoles: specificRoles,
            sendEmail: rule.sendEmail,
            sendSms: rule.sendSms,
            isActive: rule.isActive
        });
    }

    async toggleRuleStatus(rule: NotificationRule): Promise<void> {
        try {
            await this.notificationService.updateRule(rule.id, { isActive: !rule.isActive }).toPromise();
            rule.isActive = !rule.isActive;
            this.showSnackbar(`Rule ${rule.isActive ? 'activated' : 'deactivated'}`, 'success');
        } catch (error) {
            this.showSnackbar('Error updating rule', 'error');
        }
    }

    async deleteRule(rule: NotificationRule): Promise<void> {
        if (!confirm(`Delete rule "${rule.name}"?`)) return;
        try {
            await this.notificationService.deleteRule(rule.id).toPromise();
            this.showSnackbar('Rule deleted', 'success');
            await this.loadNotificationRules();
        } catch (error) {
            this.showSnackbar('Error deleting rule', 'error');
        }
    }

    cancelEditRule(): void {
        this.editingRule = null;
        this.notificationRuleForm.reset({
            recipientType: 'all',
            sendEmail: false,
            sendSms: false,
            isActive: true
        });
    }

    private getRecipients(type: string, users: string[], roles: string[]): string[] {
        if (type === 'all') {
            return this.users.map(u => u.id);
        } else if (type === 'specific') {
            return users;
        } else if (type === 'role') {
            return this.users.filter(u => u.role && roles.includes(u.role)).map(u => u.id);
        }
        return [];
    }

    private getRecipientString(type: string, users: string[], roles: string[]): string {
        if (type === 'all') return 'all';
        if (type === 'specific') return users.join(',');
        if (type === 'role') return roles.join(',');
        return '';
    }

    private async loadReports(): Promise<void> {
        const token = localStorage.getItem('token');
        if (!token) {
            this.reports = [];
            return;
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        this.driverService.getAllUsers().subscribe({
            next: async (users) => {
                const drivers = users.filter(u => u.role === 'Driver');
                const currentMonth = new Date();
                const attendanceReports: any[] = [];

                for (let i = 0; i < 6; i++) {
                    const targetMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
                    const year = targetMonth.getFullYear();
                    const month = targetMonth.getMonth();
                    const monthName = targetMonth.toLocaleString('default', { month: 'long' });
                    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
                    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

                    const attendanceData: any[] = [];

                    for (const driver of drivers) {
                        try {
                            const records = await this.http.get<any[]>(
                                `${environment.apiUrl}/attendance/driver/${driver.id}/range?startDate=${startDate}&endDate=${endDate}`,
                                { headers }
                            ).toPromise();

                            if (records && records.length > 0) {
                                attendanceData.push({
                                    driverId: driver.id,
                                    driverName: driver.name,
                                    records: records
                                });
                            }
                        } catch (error) {
                            console.error(`Error loading attendance for ${driver.name}:`, error);
                        }
                    }

                    if (attendanceData.length > 0) {
                        attendanceReports.push({
                            reportName: `Driver Attendance Report - ${monthName} ${year}`,
                            type: 'Attendance',
                            generatedDate: new Date(),
                            size: `${(attendanceData.length * 0.05).toFixed(1)} MB`,
                            format: 'CSV',
                            monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
                            attendanceData: attendanceData
                        });
                    }
                }

                this.http.get<any[]>(`${environment.apiUrl}/routes`, { headers }).subscribe({
                    next: (routes) => {
                        const completedRoutes = routes.filter(r => r.status === 'completed');
                        const monthlyGroups = this.groupRoutesByMonth(completedRoutes);

                        const tripReports = Object.keys(monthlyGroups).map(monthKey => {
                            const [year, month] = monthKey.split('-');
                            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });
                            const routeCount = monthlyGroups[monthKey].length;

                            return {
                                reportName: `Monthly Trip Report - ${monthName} ${year}`,
                                type: 'Trips',
                                generatedDate: new Date(),
                                size: `${(routeCount * 0.1).toFixed(1)} MB`,
                                format: 'CSV',
                                monthKey: monthKey,
                                routes: monthlyGroups[monthKey]
                            };
                        }).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

                        this.reports = [...attendanceReports, ...tripReports].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
                    },
                    error: (err) => {
                        console.error('Error loading trip reports:', err);
                        this.reports = attendanceReports;
                    }
                });
            },
            error: (err) => {
                console.error('Error loading reports:', err);
                this.reports = [];
            }
        });
    }

    private groupRoutesByMonth(routes: any[]): { [key: string]: any[] } {
        return routes.reduce((groups: any, route) => {
            const endDate = new Date(route.endTime || route.updatedAt);
            const monthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;

            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(route);
            return groups;
        }, {});
    }

    async downloadReport(report: any): Promise<void> {
        let csv = '';
        if (report.type === 'Attendance') {
            csv = this.generateAttendanceReportCSV(report.attendanceData);
        } else {
            csv = this.generateTripReportCSV(report.routes);
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${report.reportName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showSnackbar(`Downloaded ${report.reportName}`, 'success');
    }

    private generateAttendanceReportCSV(attendanceData: any[]): string {
        const headers = [
            'Driver ID',
            'Driver Name',
            'Date',
            'Clock In',
            'Clock Out',
            'Total Hours',
            'Break Duration',
            'Overtime Hours',
            'Status',
            'Location',
            'Notes'
        ];

        const rows: any[] = [];

        attendanceData.forEach(driverData => {
            driverData.records.forEach((record: any) => {
                rows.push([
                    driverData.driverId || '',
                    driverData.driverName || '',
                    record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
                    record.clockIn || 'N/A',
                    record.clockOut || 'N/A',
                    record.totalHours || '0',
                    record.breakDuration || '0',
                    record.overtimeHours || '0',
                    record.status || 'N/A',
                    record.location || 'N/A',
                    record.notes || ''
                ]);
            });
        });

        return [headers, ...rows]
            .map(row => row.map((field: any) => `"${field}"`).join(','))
            .join('\n');
    }

    private generateTripReportCSV(routes: any[]): string {
        const headers = [
            'Route ID',
            'Route Name',
            'Driver',
            'Vehicle',
            'Start Date',
            'End Date',
            'Total Stops',
            'Completed Stops',
            'Status',
            'Duration (hours)',
            'Distance (km)'
        ];

        const rows = routes.map(route => {
            const driverName = this.users.find(u => u.id === route.driverId)?.name || 'N/A';
            const vehiclePlate = this.vehicles.find(v => v.id === route.vehicleId)?.licensePlate || 'N/A';
            const completedStops = route.stops?.filter((s: any) => s.status === 'completed').length || 0;

            return [
                route.id || '',
                route.name || '',
                driverName,
                vehiclePlate,
                route.startTime ? new Date(route.startTime).toLocaleString() : 'N/A',
                route.endTime ? new Date(route.endTime).toLocaleString() : 'N/A',
                route.stops?.length || 0,
                completedStops,
                route.status || 'N/A',
                route.startTime && route.endTime ?
                    ((new Date(route.endTime).getTime() - new Date(route.startTime).getTime()) / (1000 * 60 * 60)).toFixed(2) : 'N/A',
                route.totalDistance || route.estimated_distance || 'N/A'
            ];
        });

        return [headers, ...rows]
            .map(row => row.map((field: any) => `"${field}"`).join(','))
            .join('\n');
    }

    getUserName(userId: string): string {
        const user = this.users.find(u => u.id === userId);
        return user ? user.name : 'Unknown';
    }

    formatDate(date: Date | string | undefined): string {
        if (!date) return 'Never';
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    getStatusBadgeClass(notification: Notification): string {
        if (notification.scheduledSendTime && !notification.isSent) return 'status-scheduled';
        if (notification.isSent) return 'status-sent';
        return 'status-pending';
    }

    getStatusText(notification: Notification): string {
        if (notification.scheduledSendTime && !notification.isSent) return 'Scheduled';
        if (notification.isSent) return 'Sent';
        return 'Pending';
    }

    getRoleBadgeClass(role: string): string {
        return `role-${role?.toLowerCase() || 'unknown'}`;
    }

    private showSnackbar(message: string, type: 'success' | 'error'): void {
        this.snackBar.open(message, 'Dismiss', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
        });
    }
}
