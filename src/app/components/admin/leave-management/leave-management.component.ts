import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    LeaveRequestService,
    LeaveRequest,
    LeaveType,
    LeaveStatus,
    ApproveLeaveRequestDto,
    RejectLeaveRequestDto
} from '../../../services/leaverequest.service';

@Component({
    selector: 'app-leave-management',
    templateUrl: './leave-management.component.html',
    styleUrls: ['./leave-management.component.css']
})
export class LeaveManagementComponent implements OnInit {
    leaveRequests: LeaveRequest[] = [];
    searchText: string = '';
    filterStatus: string = 'Pending';
    filterType: string = 'All';
    filterDriver: string = '';

    showApprovalModal: boolean = false;
    showRejectionModal: boolean = false;
    showDetailsModal: boolean = false;
    selectedRequest: LeaveRequest | null = null;

    approvalForm!: FormGroup;
    rejectionForm!: FormGroup;

    loading: boolean = false;
    successMessage: string = '';
    errorMessage: string = '';

    currentUserId: string = '';
    LeaveType = LeaveType;
    LeaveStatus = LeaveStatus;

    stats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    };

    constructor(
        private leaveRequestService: LeaveRequestService,
        private fb: FormBuilder
    ) {
        this.initializeForms();
        this.getCurrentUser();
    }

    ngOnInit(): void {
        this.loadAllLeaveRequests();
    }

    private getCurrentUser(): void {
        const userData = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');

        if (userData) {
            try {
                const user = JSON.parse(userData);
                this.currentUserId = user.id;
            } catch {
                this.handleAuthError();
            }
        } else if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                this.currentUserId = payload['nameid'] ||
                    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            } catch {
                this.handleAuthError();
            }
        } else {
            this.handleAuthError();
        }
    }

    private handleAuthError(): void {
        this.errorMessage = 'Authentication required. Please log in again.';
    }

    private initializeForms(): void {
        this.approvalForm = this.fb.group({
            notes: ['', Validators.maxLength(250)]
        });

        this.rejectionForm = this.fb.group({
            rejectionReason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
        });
    }

    loadAllLeaveRequests(): void {
        this.loading = true;
        this.leaveRequestService.getAllLeaveRequests().subscribe({
            next: (requests) => {
                this.leaveRequests = requests;
                this.calculateStatistics();
                this.clearMessages();
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to load leave requests';
                console.error('Error loading leave requests:', error);
            },
            complete: () => {
                this.loading = false;
            }
        });
    }

    get filteredRequests(): LeaveRequest[] {
        return this.leaveRequests.filter(request => {
            const matchesSearch = !this.searchText ||
                request.driver?.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
                request.driver?.email?.toLowerCase().includes(this.searchText.toLowerCase()) ||
                request.reason.toLowerCase().includes(this.searchText.toLowerCase());

            const matchesStatus = this.filterStatus === 'All' ||
                request.status === this.filterStatus ||
                this.getLeaveStatusString(request.statusEnum) === this.filterStatus;

            const matchesType = this.filterType === 'All' ||
                this.getLeaveTypeString(request.leaveTypeEnum) === this.filterType;

            const matchesDriver = !this.filterDriver ||
                request.driver?.name?.toLowerCase().includes(this.filterDriver.toLowerCase());

            return matchesSearch && matchesStatus && matchesType && matchesDriver;
        });
    }

    viewDetails(request: LeaveRequest): void {
        this.selectedRequest = request;
        this.showDetailsModal = true;
        this.clearMessages();
    }

    openApprovalModal(request: LeaveRequest): void {
        if (request.status !== 'Pending') {
            this.errorMessage = 'Only pending requests can be approved';
            this.hideMessages();
            return;
        }

        this.selectedRequest = request;
        this.showApprovalModal = true;
        this.approvalForm.reset();
        this.clearMessages();
    }

    openRejectionModal(request: LeaveRequest): void {
        if (request.status !== 'Pending') {
            this.errorMessage = 'Only pending requests can be rejected';
            this.hideMessages();
            return;
        }

        this.selectedRequest = request;
        this.showRejectionModal = true;
        this.rejectionForm.reset();
        this.clearMessages();
    }

    approveRequest(): void {
        if (!this.selectedRequest || !this.currentUserId) return;

        const dto: ApproveLeaveRequestDto = {
            approvedBy: this.currentUserId,
            notes: this.approvalForm.value.notes || undefined
        };

        this.loading = true;
        this.leaveRequestService.approveLeaveRequest(this.selectedRequest.id, dto).subscribe({
            next: (updatedRequest) => {
                this.successMessage = `Leave request for ${this.selectedRequest?.driver?.name} approved successfully!`;
                this.updateRequestInList(updatedRequest);
                this.calculateStatistics();
                this.closeApprovalModal();
                this.hideMessages();
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to approve leave request';
                console.error('Error approving request:', error);
            },
            complete: () => {
                this.loading = false;
            }
        });
    }

    rejectRequest(): void {
        if (!this.selectedRequest || !this.currentUserId || this.rejectionForm.invalid) {
            this.markFormGroupTouched(this.rejectionForm);
            return;
        }

        const dto: RejectLeaveRequestDto = {
            rejectedBy: this.currentUserId,
            rejectionReason: this.rejectionForm.value.rejectionReason
        };

        this.loading = true;
        this.leaveRequestService.rejectLeaveRequest(this.selectedRequest.id, dto).subscribe({
            next: (updatedRequest) => {
                this.successMessage = `Leave request for ${this.selectedRequest?.driver?.name} rejected successfully!`;
                this.updateRequestInList(updatedRequest);
                this.calculateStatistics();
                this.closeRejectionModal();
                this.hideMessages();
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to reject leave request';
                console.error('Error rejecting request:', error);
            },
            complete: () => {
                this.loading = false;
            }
        });
    }

    bulkApprove(): void {
        const pendingRequests = this.filteredRequests.filter(r => r.status === 'Pending');

        if (pendingRequests.length === 0) {
            this.errorMessage = 'No pending requests to approve';
            this.hideMessages();
            return;
        }

        if (!confirm(`Are you sure you want to approve ${pendingRequests.length} pending request(s)?`)) {
            return;
        }

        this.loading = true;
        let completed = 0;
        let failed = 0;

        pendingRequests.forEach(request => {
            const dto: ApproveLeaveRequestDto = {
                approvedBy: this.currentUserId,
                notes: 'Bulk approved'
            };

            this.leaveRequestService.approveLeaveRequest(request.id, dto).subscribe({
                next: (updated) => {
                    this.updateRequestInList(updated);
                    completed++;

                    if (completed + failed === pendingRequests.length) {
                        this.finalizeBulkOperation(completed, failed, 'approved');
                    }
                },
                error: () => {
                    failed++;

                    if (completed + failed === pendingRequests.length) {
                        this.finalizeBulkOperation(completed, failed, 'approved');
                    }
                }
            });
        });
    }

    private finalizeBulkOperation(completed: number, failed: number, operation: string): void {
        this.loading = false;
        this.calculateStatistics();

        if (failed === 0) {
            this.successMessage = `Successfully ${operation} ${completed} request(s)`;
        } else {
            this.errorMessage = `${operation} ${completed} request(s), ${failed} failed`;
        }

        this.hideMessages();
    }

    closeDetailsModal(): void {
        this.showDetailsModal = false;
        this.selectedRequest = null;
    }

    closeApprovalModal(): void {
        this.showApprovalModal = false;
        this.selectedRequest = null;
        this.approvalForm.reset();
    }

    closeRejectionModal(): void {
        this.showRejectionModal = false;
        this.selectedRequest = null;
        this.rejectionForm.reset();
    }

    private updateRequestInList(updatedRequest: LeaveRequest): void {
        const index = this.leaveRequests.findIndex(r => r.id === updatedRequest.id);
        if (index !== -1) {
            this.leaveRequests[index] = updatedRequest;
        }
    }

    private calculateStatistics(): void {
        this.stats.total = this.leaveRequests.length;
        this.stats.pending = this.leaveRequests.filter(r => r.status === 'Pending').length;
        this.stats.approved = this.leaveRequests.filter(r => r.status === 'Approved').length;
        this.stats.rejected = this.leaveRequests.filter(r => r.status === 'Rejected').length;
    }

    getLeaveTypeString(leaveType: LeaveType): string {
        return this.leaveRequestService.getLeaveTypeString(leaveType);
    }

    getLeaveStatusString(status: LeaveStatus): string {
        return this.leaveRequestService.getLeaveStatusString(status);
    }

    getStatusClass(status: string): string {
        return this.leaveRequestService.getStatusClass(status as any);
    }

    getTypeClass(leaveType: LeaveType): string {
        return this.leaveRequestService.getTypeClass(leaveType);
    }

    exportRequests(): void {
        const csvData = this.convertToCSV(this.filteredRequests);
        this.downloadCSV(csvData, `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
    }

    private convertToCSV(data: LeaveRequest[]): string {
        const headers = [
            'Request ID', 'Driver Name', 'Driver Email', 'Leave Type',
            'Start Date', 'End Date', 'Total Days', 'Reason', 'Status',
            'Submitted Date', 'Approved By', 'Approved Date', 'Rejection Reason'
        ];

        const rows = data.map(request => [
            request.id,
            request.driver?.name || 'Unknown',
            request.driver?.email || 'N/A',
            this.getLeaveTypeString(request.leaveTypeEnum),
            new Date(request.startDate).toLocaleDateString(),
            new Date(request.endDate).toLocaleDateString(),
            request.totalDays.toString(),
            request.reason.replace(/"/g, '""'),
            request.status,
            new Date(request.createdAt).toLocaleDateString(),
            request.approverUser?.name || 'N/A',
            request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'N/A',
            request.rejectionReason || 'N/A'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    private downloadCSV(csvContent: string, filename: string): void {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    resetFilters(): void {
        this.searchText = '';
        this.filterStatus = 'Pending';
        this.filterType = 'All';
        this.filterDriver = '';
        this.clearMessages();
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            control?.markAsTouched({ onlySelf: true });
        });
    }

    private clearMessages(): void {
        this.successMessage = '';
        this.errorMessage = '';
    }

    private hideMessages(): void {
        setTimeout(() => {
            this.clearMessages();
        }, 5000);
    }
}