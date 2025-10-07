import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, interval } from 'rxjs';
import { AttendanceService, AttendanceRecord, WeeklyAttendance } from '../../../services/attendance.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-driver-attendance',
    templateUrl: './attendance.component.html',
    styleUrls: ['./attendance.component.css']
})
export class DriverAttendanceComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    currentUser: User | null = null;
    currentTime: string = '';
    currentDate: string = '';

    todayAttendance: AttendanceRecord | null = null;
    isClockingIn: boolean = false;
    isClockingOut: boolean = false;

    selectedDate: Date = new Date();
    selectedDateStr: string = '';
    selectedDateAttendance: AttendanceRecord | null = null;

    weeklyAttendance: WeeklyAttendance | null = null;
    weekDays: Date[] = [];
    recentAttendance: AttendanceRecord[] = [];

    isLoading = true;
    isLoadingToday = false;
    isLoadingWeekly = false;

    errorMessage: string = '';
    successMessage: string = '';

    constructor(
        private attendanceService: AttendanceService,
        private authService: AuthService,
        private http: HttpClient
    ) { }

    ngOnInit(): void {
        this.initializeComponent();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private async initializeComponent(): Promise<void> {
        try {
            this.currentUser = this.authService.getCurrentUserSync();

            if (!this.currentUser) {
                this.errorMessage = 'User not authenticated. Please log in.';
                this.authService.logout();
                return;
            }

            if (this.currentUser.role !== 'Driver') {
                this.errorMessage = 'Access denied. This page is for drivers only.';
                return;
            }

            this.updateTime();
            this.updateCurrentDate();
            this.selectedDateStr = this.dateToInputValue(this.selectedDate);
            this.generateWeekDays();

            await this.loadAllData();
            this.startTimeUpdates();

        } catch (error) {
            console.error('Failed to initialize attendance component:', error);
            this.errorMessage = 'Failed to load attendance data. Please refresh the page.';
        } finally {
            this.isLoading = false;
        }
    }

    private async loadAllData(): Promise<void> {
        if (!this.currentUser) return;

        try {
            await Promise.all([
                this.loadTodayAttendance(),
                this.loadWeeklyAttendance(),
                this.loadRecentAttendance(),
                this.loadSelectedDateAttendance()
            ]);
        } catch (error) {
            console.error('Error loading attendance data:', error);
            this.errorMessage = 'Failed to load some attendance data. Please try refreshing.';
        }
    }

    private async loadTodayAttendance(): Promise<void> {
        if (!this.currentUser) return;

        this.isLoadingToday = true;
        try {
            this.attendanceService.getMyTodayAttendance()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (response) => {
                        this.todayAttendance = response?.data || null;
                        console.log('✅ Today attendance loaded:', this.todayAttendance);
                        this.isLoadingToday = false;
                    },
                    error: (error) => {
                        console.error('Error loading today attendance:', error);
                        this.todayAttendance = null;
                        this.isLoadingToday = false;
                    }
                });
        } catch (error) {
            console.error('Error loading today attendance:', error);
            this.todayAttendance = null;
            this.isLoadingToday = false;
        }
    }

    private async loadWeeklyAttendance(): Promise<void> {
        if (!this.currentUser) return;

        this.isLoadingWeekly = true;
        try {
            const weekStart = this.attendanceService.getCurrentWeekStart();
            this.attendanceService.getMyWeeklyAttendance(weekStart)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (weeklyData) => {
                        this.weeklyAttendance = weeklyData;
                        console.log('✅ Weekly attendance loaded:', weeklyData);
                        this.isLoadingWeekly = false;
                    },
                    error: (error) => {
                        console.error('Error loading weekly attendance:', error);
                        this.weeklyAttendance = null;
                        this.isLoadingWeekly = false;
                    }
                });
        } catch (error) {
            console.error('Error loading weekly attendance:', error);
            this.weeklyAttendance = null;
            this.isLoadingWeekly = false;
        }
    }

    private async loadRecentAttendance(): Promise<void> {
        if (!this.currentUser) return;

        try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            this.attendanceService.getDriverAttendanceByRange(this.currentUser.id, startDate, endDate)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (records) => {
                        this.recentAttendance = records.slice(0, 10);
                        console.log('✅ Recent attendance loaded:', this.recentAttendance);
                    },
                    error: (error) => {
                        console.error('Error loading recent attendance:', error);
                        this.recentAttendance = [];
                    }
                });
        } catch (error) {
            console.error('Error loading recent attendance:', error);
            this.recentAttendance = [];
        }
    }

    private async loadSelectedDateAttendance(): Promise<void> {
        if (!this.currentUser) return;

        try {
            const dateStr = this.selectedDate.toISOString().split('T')[0];

            this.attendanceService.getDriverAttendanceByRange(this.currentUser.id, dateStr, dateStr)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (records) => {
                        this.selectedDateAttendance = records.length > 0 ? records[0] : null;
                    },
                    error: (error) => {
                        console.error('Error loading selected date attendance:', error);
                        this.selectedDateAttendance = null;
                    }
                });
        } catch (error) {
            console.error('Error loading selected date attendance:', error);
            this.selectedDateAttendance = null;
        }
    }

    private startTimeUpdates(): void {
        interval(1000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.updateTime();
                this.updateCurrentDate();
            });
    }

    private updateTime(): void {
        const now = new Date();
        this.currentTime = now.toLocaleTimeString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    private updateCurrentDate(): void {
        const now = new Date();
        this.currentDate = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    }

    async handleClockInOut(): Promise<void> {
        if (!this.currentUser) {
            this.showError('User not authenticated');
            return;
        }

        if (!this.authService.isAuthenticated()) {
            this.showError('Session expired. Please log in again.');
            this.authService.logout();
            return;
        }

        const isClockingIn = !this.todayAttendance?.clockIn;

        if (isClockingIn) {
            this.isClockingIn = true;
        } else {
            this.isClockingOut = true;
        }

        try {
            const request = {
                location: 'Main Depot',
                notes: ''
            };

            if (isClockingIn) {
                this.attendanceService.clockIn(request)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: (response) => {
                            if (response?.data) {
                                this.todayAttendance = response.data;
                                this.showSuccess('Successfully clocked in!');
                                console.log('✅ Clocked in:', response.data);
                            }
                            this.loadWeeklyAttendance();
                            this.loadRecentAttendance();
                            this.isClockingIn = false;
                        },
                        error: (error) => {
                            console.error('Clock in error:', error);
                            this.showError(error.message || 'Failed to clock in');
                            this.isClockingIn = false;
                        }
                    });
            } else {
                this.attendanceService.clockOut(request)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: (response) => {
                            if (response?.data) {
                                this.todayAttendance = response.data;
                                this.showSuccess('Successfully clocked out!');
                                console.log('✅ Clocked out:', response.data);
                            }
                            this.loadWeeklyAttendance();
                            this.loadRecentAttendance();
                            this.isClockingOut = false;
                        },
                        error: (error) => {
                            console.error('Clock out error:', error);
                            this.showError(error.message || 'Failed to clock out');
                            this.isClockingOut = false;
                        }
                    });
            }

        } catch (error) {
            console.error('Clock in/out error:', error);
            this.showError(`Failed to ${isClockingIn ? 'clock in' : 'clock out'}`);
            this.isClockingIn = false;
            this.isClockingOut = false;
        }
    }

    async onSelectedDateChange(): Promise<void> {
        this.selectedDate = new Date(this.selectedDateStr);
        await this.loadSelectedDateAttendance();
    }

    onWeekDayClick(date: Date): void {
        this.selectedDate = date;
        this.selectedDateStr = this.dateToInputValue(date);
        this.loadSelectedDateAttendance();
    }

    generateWeekDays(): void {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - mondayOffset);

        this.weekDays = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(monday);
            day.setDate(monday.getDate() + i);
            return day;
        });
    }

    dateToInputValue(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // ✅ FIXED: Handle backend sending wrong timezone (UTC instead of Philippine time)
    formatTime(timeStr?: string): string {
        if (!timeStr) return 'N/A';

        try {
            console.log('🕐 Formatting time:', timeStr);

            // Remove fractional seconds
            const cleanTime = timeStr.split('.')[0];

            // Backend sends HH:MM format in UTC (needs +8 hours for Philippine time)
            if (cleanTime.length <= 8 && !cleanTime.includes('T') && !cleanTime.includes('Z')) {
                const parts = cleanTime.split(':');
                if (parts.length >= 2) {
                    let hours = parseInt(parts[0], 10);
                    const minutes = parseInt(parts[1], 10);

                    // ✅ Add 8 hours for Philippine timezone (UTC+8)
                    hours = (hours + 8) % 24;

                    // Convert to 12-hour format
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    const displayMinutes = minutes.toString().padStart(2, '0');

                    const result = `${displayHours}:${displayMinutes} ${period}`;
                    console.log(`✅ Converted ${timeStr} -> ${result}`);
                    return result;
                }
            }

            // If it's a full ISO datetime string
            const date = new Date(timeStr);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('en-PH', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
            }

            return 'Invalid time';
        } catch (error) {
            console.error('❌ Error formatting time:', timeStr, error);
            return 'Invalid time';
        }
    }

    getStatusClass(status?: string): string {
        if (!status) return '';
        return this.attendanceService.getStatusClass(status);
    }

    getStatusDisplayName(status?: string): string {
        if (!status) return '';
        return this.attendanceService.getStatusDisplayName(status);
    }

    getRecordForDate(date: Date): AttendanceRecord | undefined {
        if (!this.weeklyAttendance?.records) return undefined;

        const dateStr = date.toISOString().split('T')[0];
        return this.weeklyAttendance.records.find((record: AttendanceRecord) =>
            record.date.split('T')[0] === dateStr
        );
    }

    isDateSelected(date: Date): boolean {
        return date.toDateString() === this.selectedDate.toDateString();
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    get currentStatus(): 'clocked-in' | 'clocked-out' {
        return this.todayAttendance?.clockIn && !this.todayAttendance?.clockOut
            ? 'clocked-in'
            : 'clocked-out';
    }

    get clockButtonText(): string {
        if (this.isClockingIn) return 'Clocking In...';
        if (this.isClockingOut) return 'Clocking Out...';

        return this.currentStatus === 'clocked-in' ? 'Clock Out' : 'Clock In';
    }

    get clockButtonClass(): string {
        const baseClass = 'w-full p-3 rounded font-medium transition-colors';

        if (this.isClockingIn || this.isClockingOut) {
            return `${baseClass} bg-gray-400 text-white cursor-not-allowed`;
        }

        return this.currentStatus === 'clocked-in'
            ? `${baseClass} bg-red-500 hover:bg-red-600 text-white`
            : `${baseClass} bg-blue-500 hover:bg-blue-600 text-white`;
    }

    get todayClockInTime(): string {
        return this.formatTime(this.todayAttendance?.clockIn);
    }

    get todayClockOutTime(): string {
        return this.formatTime(this.todayAttendance?.clockOut);
    }

    get todayTotalHours(): string {
        if (!this.todayAttendance?.totalHours) return '0h';
        return `${this.todayAttendance.totalHours}h`;
    }

    get weeklyStats() {
        return this.weeklyAttendance?.stats || {
            totalHours: 0,
            daysPresent: 0,
            daysAbsent: 0,
            daysLate: 0,
            averageClockIn: 'N/A',
            overtimeHours: 0,
            attendancePercentage: 0
        };
    }

    getDayName(date: Date): string {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    getDayNumber(date: Date): number {
        return date.getDate();
    }

    getAttendanceIcon(record?: AttendanceRecord): string {
        if (!record) return '⚪';

        switch (record.status) {
            case 'Present':
                return '✅';
            case 'Late':
                return '🟡';
            case 'Absent':
                return '❌';
            case 'HalfDay':
                return '🔵';
            case 'OnLeave':
                return '🟣';
            default:
                return '⚪';
        }
    }

    private showError(message: string): void {
        this.errorMessage = message;
        this.successMessage = '';
        setTimeout(() => this.clearMessages(), 5000);
    }

    private showSuccess(message: string): void {
        this.successMessage = message;
        this.errorMessage = '';
        setTimeout(() => this.clearMessages(), 3000);
    }

    clearErrorMessage(): void {
        this.errorMessage = '';
    }

    clearSuccessMessage(): void {
        this.successMessage = '';
    }

    clearMessages(): void {
        this.errorMessage = '';
        this.successMessage = '';
    }

    async refreshData(): Promise<void> {
        this.isLoading = true;
        this.clearMessages();
        try {
            await this.loadAllData();
            this.showSuccess('Data refreshed successfully!');
        } catch (error) {
            this.showError('Failed to refresh data');
        } finally {
            this.isLoading = false;
        }
    }

    get currentUserDisplayName(): string {
        return this.currentUser?.name || 'Driver';
    }

    get isWorkingHours(): boolean {
        return this.attendanceService.isWorkingHours();
    }

    canClockIn(): boolean {
        return !this.todayAttendance?.clockIn && !this.isClockingIn;
    }

    canClockOut(): boolean {
        return !!this.todayAttendance?.clockIn && !this.todayAttendance?.clockOut && !this.isClockingOut;
    }
}
