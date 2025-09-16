import { Component } from '@angular/core';

interface LeaveBalance {
    used: number;
    total: number;
}

interface LeaveRequest {
    id: string;
    type: 'sick' | 'vacation' | 'personal' | 'emergency';
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedDate: string;
    approvedBy?: string;
}

type LeaveTypes = keyof typeof leaveBalance; // 'vacation' | 'sick' | 'personal'

const leaveBalance = {
    vacation: { used: 5, total: 15 },
    sick: { used: 2, total: 10 },
    personal: { used: 1, total: 5 }
};

@Component({
    selector: 'app-leave-requests',
    templateUrl: './leave-requests.component.html',
    styleUrls: ['./leave-requests.component.css']
})
export class LeaveRequestsComponent {
    leaveBalance: Record<LeaveTypes, LeaveBalance> = leaveBalance;

    leaveRequests: LeaveRequest[] = [
        { id: 'L001', type: 'vacation', startDate: '2024-03-15', endDate: '2024-03-17', days: 3, reason: 'Family vacation', status: 'approved', submittedDate: '2024-02-10', approvedBy: 'Fleet Manager' },
        { id: 'L002', type: 'sick', startDate: '2024-02-20', endDate: '2024-02-20', days: 1, reason: 'Medical appointment', status: 'approved', submittedDate: '2024-02-18', approvedBy: 'Fleet Manager' },
        { id: 'L003', type: 'personal', startDate: '2024-02-25', endDate: '2024-02-25', days: 1, reason: 'Personal matter', status: 'pending', submittedDate: '2024-02-12' }
    ];

    leaveTypes: LeaveTypes[] = ['vacation', 'sick', 'personal'];

    getStatusColor(status: LeaveRequest['status']) {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return '';
        }
    }

    getTypeColor(type: LeaveRequest['type']) {
        switch (type) {
            case 'vacation': return 'bg-blue-100 text-blue-700';
            case 'sick': return 'bg-red-100 text-red-700';
            case 'personal': return 'bg-gray-200 text-gray-700';
            case 'emergency': return 'bg-red-200 text-red-800';
            default: return '';
        }
    }
}
