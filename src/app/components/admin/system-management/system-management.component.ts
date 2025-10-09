import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { interval, Subscription } from 'rxjs';
import { DriverService, CreateDriverDto, UpdateDriverDto } from '../../../services/driver.service';
import { NotificationService, Notification, NotificationRule } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-system-management',
    templateUrl: './system-management.component.html',
    styleUrls: ['./system-management.component.css']
})
export class SystemManagementComponent implements OnInit, OnDestroy {
    selectedTabIndex = 0;
    users: User[] = [];
    userColumns: string[] = ['name', 'email', 'role', 'status', 'lastLogin', 'actions'];
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
    attendanceStats = {
        totalDrivers: 0,
        avgAttendanceRate: 0,
        totalHours: 0,
        overtimeHours: 0
    };
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

    private async loadAllData(): Promise<void> {
        this.loading = true;
        try {
            await Promise.all([
                this.loadUsers(),
                this.loadNotifications(),
                this.loadNotificationRules(),
                this.loadReports(),
                this.loadAttendanceStats()
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
            this.notificationService.getNotifications().subscribe({
                next: (data) => {
                    this.notifications = data.sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    ).slice(0, 100);
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading notifications:', error);
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
        this.reports = [
            { reportName: 'Monthly Trip Report - January 2024', type: 'Trips', generatedDate: new Date('2024-01-31'), size: '2.4 MB', format: 'PDF' },
            { reportName: 'Driver Performance Report', type: 'Drivers', generatedDate: new Date('2024-01-30'), size: '1.8 MB', format: 'Excel' }
        ];
    }

    async downloadReport(report: any): Promise<void> {
        this.showSnackbar(`Downloading ${report.reportName}...`, 'success');
    }

    private async loadAttendanceStats(): Promise<void> {
        return new Promise((resolve) => {
            this.driverService.getAllUsers().subscribe({
                next: async (users) => {
                    const drivers = users.filter(u => u.role === 'Driver');
                    const totalDrivers = drivers.length;

                    let totalHours = 0;
                    let totalDaysPresent = 0;
                    let totalDaysLate = 0;
                    let overtimeHours = 0;

                    for (const driver of drivers) {
                        try {
                            const endDate = new Date().toISOString().split('T')[0];
                            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                            await new Promise<void>((resolveDriver) => {
                                this.http.get<any[]>(`${environment.apiUrl}/attendance/driver/${driver.id}/range?startDate=${startDate}&endDate=${endDate}`)
                                    .subscribe({
                                        next: (records) => {
                                            records.forEach(record => {
                                                if (record.totalHours) {
                                                    totalHours += parseFloat(record.totalHours);
                                                    if (record.totalHours > 8) {
                                                        overtimeHours += (parseFloat(record.totalHours) - 8);
                                                    }
                                                }
                                                if (record.status === 'Present') totalDaysPresent++;
                                                if (record.status === 'Late') totalDaysLate++;
                                            });
                                            resolveDriver();
                                        },
                                        error: () => resolveDriver()
                                    });
                            });
                        } catch (error) {
                            console.error(`Error loading attendance for driver ${driver.id}:`, error);
                        }
                    }

                    const workDays = 22;
                    const avgAttendanceRate = totalDrivers > 0
                        ? ((totalDaysPresent / (totalDrivers * workDays)) * 100).toFixed(1)
                        : 0;

                    this.attendanceStats = {
                        totalDrivers: totalDrivers,
                        avgAttendanceRate: parseFloat(avgAttendanceRate as string),
                        totalHours: Math.round(totalHours),
                        overtimeHours: Math.round(overtimeHours)
                    };

                    console.log('✅ Attendance stats loaded:', this.attendanceStats);
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading attendance stats:', error);
                    this.attendanceStats = {
                        totalDrivers: 0,
                        avgAttendanceRate: 0,
                        totalHours: 0,
                        overtimeHours: 0
                    };
                    resolve();
                }
            });
        });
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
