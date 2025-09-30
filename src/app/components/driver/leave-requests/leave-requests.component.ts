import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
    LeaveRequestService,
    LeaveRequest,
    LeaveBalance,
    LeaveType,
    LeaveStatus,
    CreateLeaveRequestDto,
    ApproveLeaveRequestDto,
    RejectLeaveRequestDto,
    LeaveTypeInfo
} from '../../../services/leaverequest.service';

@Component({
    selector: 'app-leave-requests',
    templateUrl: './leave-requests.component.html',
    styleUrls: ['./leave-requests.component.css']
})
export class LeaveRequestsComponent implements OnInit {
    leaveRequests: LeaveRequest[] = [];
    leaveBalance: LeaveBalance | null = null;
    leaveTypes: LeaveTypeInfo[] = [];
    currentDriverId: string = '';
    userRole: string = 'Driver';
    searchText: string = '';
    filterStatus: string = 'All';
    filterType: string = 'All';
    showCreateForm: boolean = false;
    showApprovalModal: boolean = false;
    showRejectionModal: boolean = false;
    loading: boolean = false;
    createLeaveForm!: FormGroup;
    approvalForm!: FormGroup;
    rejectionForm!: FormGroup;
    selectedRequest: LeaveRequest | null = null;
    successMessage: string = '';
    errorMessage: string = '';
    LeaveType = LeaveType;
    LeaveStatus = LeaveStatus;

    constructor(
        private leaveRequestService: LeaveRequestService,
        private fb: FormBuilder
    ) {
        this.initializeForms();
        this.getCurrentUser();
    }

    ngOnInit(): void {
        this.loadData();
    }

    private getCurrentUser(): void {
        const userData = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                this.currentDriverId = user.id;
                this.userRole = user.role;
            } catch {
                this.handleAuthError();
            }
        } else if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                this.currentDriverId = payload['nameid'] || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
                this.userRole = payload['role'] || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            } catch {
                this.handleAuthError();
            }
        } else {
            this.handleAuthError();
        }
        if (!this.currentDriverId || this.currentDriverId === '') {
            this.errorMessage = 'Unable to identify current user. Please log in again.';
        }
    }

    private handleAuthError(): void {
        this.errorMessage = 'Please log in to access this feature';
    }

    private initializeForms(): void {
        this.createLeaveForm = this.fb.group({
            leaveType: [LeaveType.Annual, Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            reason: ['', [Validators.required, Validators.minLength(10)]]
        });
        this.approvalForm = this.fb.group({
            notes: ['']
        });
        this.rejectionForm = this.fb.group({
            rejectionReason: ['', [Validators.required, Validators.minLength(10)]]
        });
    }

    async loadData(): Promise<void> {
        this.loading = true;
        try {
            if (this.isAdminOrManager()) {
                await this.loadAllLeaveRequests();
            } else {
                await this.loadDriverLeaveRequests();
            }
            if (this.currentDriverId) {
                await this.loadLeaveBalance();
            }
            await this.loadLeaveTypes();
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to load data';
        } finally {
            this.loading = false;
        }
    }

    async loadAllLeaveRequests(): Promise<void> {
        this.leaveRequestService.getAllLeaveRequests().subscribe({
            next: (requests) => { this.leaveRequests = requests; },
            error: (error) => { throw error; }
        });
    }

    async loadDriverLeaveRequests(): Promise<void> {
        if (!this.currentDriverId) return;
        this.leaveRequestService.getLeaveRequestsByDriverId(this.currentDriverId).subscribe({
            next: (requests) => { this.leaveRequests = requests; },
            error: (error) => { throw error; }
        });
    }

    async loadLeaveBalance(): Promise<void> {
        this.leaveRequestService.getLeaveBalance(this.currentDriverId).subscribe({
            next: (balance) => { this.leaveBalance = balance; },
            error: (error) => { console.error('Failed to load leave balance:', error); }
        });
    }

    async loadLeaveTypes(): Promise<void> {
        this.leaveRequestService.getLeaveTypes().subscribe({
            next: (types) => { this.leaveTypes = types; },
            error: (error) => { console.error('Failed to load leave types:', error); }
        });
    }

    get filteredRequests(): LeaveRequest[] {
        return this.leaveRequests.filter(request => {
            const matchesSearch = !this.searchText ||
                request.driver?.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
                request.reason.toLowerCase().includes(this.searchText.toLowerCase());
            const matchesStatus = this.filterStatus === 'All' ||
                request.status === this.filterStatus;
            const matchesType = this.filterType === 'All' ||
                this.getLeaveTypeString(request.leaveTypeEnum) === this.filterType;
            return matchesSearch && matchesStatus && matchesType;
        });
    }

    toggleCreateForm(): void {
        this.showCreateForm = !this.showCreateForm;
        if (this.showCreateForm) {
            this.createLeaveForm.reset();
            this.createLeaveForm.patchValue({ leaveType: LeaveType.Annual });
            this.clearMessages();
        }
    }

    async submitLeaveRequest(): Promise<void> {
        if (this.createLeaveForm.invalid) {
            this.markFormGroupTouched(this.createLeaveForm);
            return;
        }
        const formValue = this.createLeaveForm.value;
        const dto: CreateLeaveRequestDto = {
            driverId: this.currentDriverId,
            leaveType: parseInt(formValue.leaveType),
            startDate: new Date(formValue.startDate).toISOString(),
            endDate: new Date(formValue.endDate).toISOString(),
            reason: formValue.reason
        };
        const validationErrors = this.leaveRequestService.validateLeaveRequest(dto);
        if (validationErrors.length > 0) {
            this.errorMessage = validationErrors.join(', ');
            return;
        }
        try {
            this.loading = true;
            this.leaveRequestService.createLeaveRequest(dto).subscribe({
                next: (request) => {
                    this.successMessage = 'Leave request submitted successfully!';
                    this.leaveRequests.unshift(request);
                    this.showCreateForm = false;
                    this.createLeaveForm.reset();
                    this.loadLeaveBalance();
                    this.hideMessages();
                },
                error: (error) => { this.errorMessage = error.message || 'Failed to submit leave request'; },
                complete: () => { this.loading = false; }
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to submit leave request';
            this.loading = false;
        }
    }

    openApprovalModal(request: LeaveRequest): void {
        this.selectedRequest = request;
        this.showApprovalModal = true;
        this.approvalForm.reset();
        this.clearMessages();
    }

    openRejectionModal(request: LeaveRequest): void {
        this.selectedRequest = request;
        this.showRejectionModal = true;
        this.rejectionForm.reset();
        this.clearMessages();
    }

    async approveRequest(): Promise<void> {
        if (!this.selectedRequest) return;
        const dto: ApproveLeaveRequestDto = {
            approvedBy: this.currentDriverId,
            notes: this.approvalForm.value.notes
        };
        try {
            this.loading = true;
            this.leaveRequestService.approveLeaveRequest(this.selectedRequest.id, dto).subscribe({
                next: (updatedRequest) => {
                    this.successMessage = 'Leave request approved successfully!';
                    this.updateRequestInList(updatedRequest);
                    this.closeApprovalModal();
                    this.hideMessages();
                },
                error: (error) => { this.errorMessage = error.message || 'Failed to approve leave request'; },
                complete: () => { this.loading = false; }
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to approve leave request';
            this.loading = false;
        }
    }

    async rejectRequest(): Promise<void> {
        if (!this.selectedRequest || this.rejectionForm.invalid) {
            this.markFormGroupTouched(this.rejectionForm);
            return;
        }
        const dto: RejectLeaveRequestDto = {
            rejectedBy: this.currentDriverId,
            rejectionReason: this.rejectionForm.value.rejectionReason
        };
        try {
            this.loading = true;
            this.leaveRequestService.rejectLeaveRequest(this.selectedRequest.id, dto).subscribe({
                next: (updatedRequest) => {
                    this.successMessage = 'Leave request rejected successfully!';
                    this.updateRequestInList(updatedRequest);
                    this.closeRejectionModal();
                    this.hideMessages();
                },
                error: (error) => { this.errorMessage = error.message || 'Failed to reject leave request'; },
                complete: () => { this.loading = false; }
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to reject leave request';
            this.loading = false;
        }
    }

    async deleteRequest(request: LeaveRequest): Promise<void> {
        if (!confirm(`Are you sure you want to delete this leave request?`)) {
            return;
        }
        try {
            this.loading = true;
            this.leaveRequestService.deleteLeaveRequest(request.id).subscribe({
                next: () => {
                    this.successMessage = 'Leave request deleted successfully!';
                    this.leaveRequests = this.leaveRequests.filter(r => r.id !== request.id);
                    this.hideMessages();
                },
                error: (error) => { this.errorMessage = error.message || 'Failed to delete leave request'; },
                complete: () => { this.loading = false; }
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to delete leave request';
            this.loading = false;
        }
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

    isAdminOrManager(): boolean {
        return this.userRole === 'Admin' || this.userRole === 'FleetManager';
    }

    canApproveReject(request: LeaveRequest): boolean {
        return this.isAdminOrManager() && request.status === 'Pending';
    }

    canDelete(request: LeaveRequest): boolean {
        return request.status === 'Pending' &&
            (this.isAdminOrManager() || request.driverId === this.currentDriverId);
    }

    getLeaveTypeString(leaveType: LeaveType): string {
        return this.leaveRequestService.getLeaveTypeString(leaveType);
    }

    getLeaveStatusString(status: string): string {
        return status; // Since status is already a string, just return it
    }

    getStatusClass(status: string): string {
        return this.leaveRequestService.getStatusClass(status);
    }

    getTypeClass(leaveType: LeaveType): string {
        return this.leaveRequestService.getTypeClass(leaveType);
    }

    calculateDays(): void {
        const startDate = this.createLeaveForm.get('startDate')?.value;
        const endDate = this.createLeaveForm.get('endDate')?.value;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = this.leaveRequestService.calculateBusinessDays(start, end);
            console.log(`Business days: ${days}`);
        }
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

    exportRequests(): void {
        const csvData = this.convertToCSV(this.filteredRequests);
        this.downloadCSV(csvData, 'leave_requests_export.csv');
    }

    private convertToCSV(data: LeaveRequest[]): string {
        const headers = [
            'Driver Name', 'Leave Type', 'Start Date', 'End Date', 'Days',
            'Reason', 'Status', 'Submitted Date', 'Approved By'
        ];
        const rows = data.map(request => [
            request.driver?.name || 'Unknown',
            this.getLeaveTypeString(request.leaveTypeEnum),
            new Date(request.startDate).toLocaleDateString(),
            new Date(request.endDate).toLocaleDateString(),
            request.totalDays.toString(),
            request.reason,
            request.status,
            new Date(request.createdAt).toLocaleDateString(),
            request.approverUser?.name || 'N/A'
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
}