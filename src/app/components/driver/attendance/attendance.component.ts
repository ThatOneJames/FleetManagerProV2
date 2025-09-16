import { Component, OnInit } from '@angular/core';

interface AttendanceRecord {
    date: string;
    status: 'present' | 'absent' | 'late' | 'partial';
    clockIn?: string;
    clockOut?: string;
    totalHours?: number;
    notes?: string;
    location?: string;
}

@Component({
    selector: 'app-driver-attendance',
    templateUrl: './attendance.component.html',
})
export class DriverAttendanceComponent implements OnInit {
    currentTime: string = '';
    currentStatus: 'clocked-in' | 'clocked-out' = 'clocked-out';
    todayClockIn: string = '';
    isClockingIn: boolean = false;

    selectedDate: Date = new Date();
    selectedDateStr: string = '';

    attendanceRecords: AttendanceRecord[] = [
        {
            date: '2025-08-20',
            status: 'present',
            clockIn: '08:00',
            clockOut: '17:00',
            totalHours: 9,
            notes: 'On time',
            location: 'Main Depot',
        },
        {
            date: '2025-08-19',
            status: 'late',
            clockIn: '09:15',
            clockOut: '17:00',
            totalHours: 7.75,
            notes: 'Traffic delay',
            location: 'Main Depot',
        },
        {
            date: '2025-08-18',
            status: 'absent',
            location: 'Main Depot',
        },
    ];

    weeklyStats = {
        totalHours: 16.75,
        daysPresent: 2,
        averageClockIn: '08:37',
        overtimeHours: 0,
    };

    weekDays: Date[] = [];

    ngOnInit(): void {
        this.updateTime();
        this.generateWeekDays();
        this.selectedDateStr = this.dateToInputValue(this.selectedDate);
    }

    updateTime() {
        setInterval(() => {
            const now = new Date();
            this.currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }, 1000);
    }

    handleClockInOut() {
        this.isClockingIn = true;
        setTimeout(() => {
            if (this.currentStatus === 'clocked-out') {
                this.currentStatus = 'clocked-in';
                this.todayClockIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                this.currentStatus = 'clocked-out';
            }
            this.isClockingIn = false;
        }, 1000);
    }

    getRecordForDate(date: Date): AttendanceRecord | undefined {
        const dateStr = date.toISOString().split('T')[0];
        return this.attendanceRecords.find(record => record.date === dateStr);
    }

    getStatusColor(status: 'present' | 'absent' | 'late' | 'partial' | undefined) {
        switch (status) {
            case 'present':
                return 'bg-green-200 text-green-800';
            case 'absent':
                return 'bg-red-200 text-red-800';
            case 'late':
                return 'bg-yellow-200 text-yellow-800';
            case 'partial':
                return 'bg-blue-200 text-blue-800';
            default:
                return '';
        }
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }

    dateToInputValue(date: Date): string {
        // Converts Date to 'yyyy-MM-dd' format for input type="date"
        return date.toISOString().split('T')[0];
    }

    generateWeekDays() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
        const start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek + 1); // Monday
        this.weekDays = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }
}
