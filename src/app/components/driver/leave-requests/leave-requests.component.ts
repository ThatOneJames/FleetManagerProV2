import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
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

    // ========== ENHANCED FORM INITIALIZATION WITH VALIDATION ==========
    private initializeForms(): void {
        this.createLeaveForm = this.fb.group({
            leaveType: [LeaveType.Annual, [Validators.required]],
            startDate: ['', [
                Validators.required,
                this.futureDateValidator()
            ]],
            endDate: ['', [
                Validators.required,
                this.futureDateValidator()
            ]],
            reason: ['', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(500)
            ]]
        }, {
            validators: this.dateRangeValidator()
        });

        this.approvalForm = this.fb.group({
            notes: ['', [Validators.maxLength(500)]]
        });

        this.rejectionForm = this.fb.group({
            rejectionReason: ['', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(500)
            ]]
        });
    }

    // ========== CUSTOM VALIDATORS ==========
    private futureDateValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const inputDate = new Date(control.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (inputDate < today) {
                return { pastDate: true };
            }

            return null;
        };
    }

    private dateRangeValidator(): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const startDate = group.get('startDate')?.value;
            const endDate = group.get('endDate')?.value;

            if (!startDate || !endDate) {
                return null;
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (end < start) {
                return { invalidDateRange: true };
            }

            // Check if date range exceeds 30 days
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 30) {
                return { exceedsMaxDuration: true };
            }

            return null;
        };
    }

    // ========== ERROR MESSAGE HANDLER ==========
    getFieldErrorMessage(form: FormGroup, fieldName: string): string {
        const control = form.get(fieldName);

        if (!control || !control.errors || !control.touched) {
            return '';
        }

        const errors = control.errors;

        if (errors['required']) {
            return `${this.getFieldLabel(fieldName)} is required`;
        }

        if (errors['minlength']) {
            return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
        }

        if (errors['maxlength']) {
            return `${this.getFieldLabel(fieldName)} cannot exceed ${errors['maxlength'].requiredLength} characters`;
        }

        if (errors['pastDate']) {
            return 'Date must be today or in the future';
        }

        return 'Invalid input';
    }

    getFormErrorMessage(form: FormGroup): string {
        if (form.errors?.['invalidDateRange']) {
            return 'End date must be after start date';
        }

        if (form.errors?.['exceedsMaxDuration']) {
            return 'Leave duration cannot exceed 30 days';
        }

        return '';
    }

    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            leaveType: 'Leave Type',
            startDate: 'Start Date',
            endDate: 'End Date',
            reason: 'Reason',
            rejectionReason: 'Rejection Reason',
            notes: 'Notes'
        };

        return labels[fieldName] || fieldName;
    }

    isFieldInvalid(form: FormGroup, fieldName: string): boolean {
        const field = form.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    // ========== DATA LOADING ==========
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
            this.hideMessages();
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

    // ========== LEAVE REQUEST OPERATIONS WITH VALIDATION ==========
    toggleCreateForm(): void {
        this.showCreateForm = !this.showCreateForm;
        if (this.showCreateForm) {
            this.createLeaveForm.reset();
            this.createLeaveForm.patchValue({ leaveType: LeaveType.Annual });
            this.clearMessages();
        }
    }

    async submitLeaveRequest(): Promise<void> {
        this.markFormGroupTouched(this.createLeaveForm);

        if (this.createLeaveForm.invalid) {
            const errors: string[] = [];

            // Check form-level errors
            const formError = this.getFormErrorMessage(this.createLeaveForm);
            if (formError) {
                errors.push(formError);
            }

            // Check field-level errors
            Object.keys(this.createLeaveForm.controls).forEach(key => {
                const control = this.createLeaveForm.get(key);
                if (control && control.invalid) {
                    const message = this.getFieldErrorMessage(this.createLeaveForm, key);
                    if (message && !errors.includes(message)) {
                        errors.push(message);
                    }
                }
            });

            this.errorMessage = errors.length > 0 ? errors.join('. ') : 'Please fill out all required fields correctly';
            this.hideMessages();
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
            this.hideMessages();
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
                error: (error) => {
                    this.errorMessage = error.error?.message || error.message || 'Failed to submit leave request';
                    this.hideMessages();
                },
                complete: () => { this.loading = false; }
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to submit leave request';
            this.loading = false;
            this.hideMessages();
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

        this.markFormGroupTouched(this.approvalForm);

        const dto: ApproveLeaveRequestDto = {
            approvedBy: this.currentDriverId,
            notes: this.approvalForm.value.notes || ''
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
                error: (error) => {
                    this.errorMessage = error.error?.message || error.message || 'Failed to approve leave request';
                    this.hideMessages();
                },
                complete: () => { this.loading = false; }
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to approve leave request';
            this.loading = false;
            this.hideMessages();
        }
    }

    async rejectRequest(): Promise<void> {
        if (!this.selectedRequest) return;

        this.markFormGroupTouched(this.rejectionForm);

        if (this.rejectionForm.invalid) {
            const errors: string[] = [];
            Object.keys(this.rejectionForm.controls).forEach(key => {
                const control = this.rejectionForm.get(key);
                if (control && control.invalid) {
                    const message = this.getFieldErrorMessage(this.rejectionForm, key);
                    if (message) {
                        errors.push(message);
                    }
                }
            });

            this.errorMessage = errors.length > 0 ? errors.join('. ') : 'Please provide a rejection reason';
            this.hideMessages();
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
                error: (error) => {
                    this.errorMessage = error.error?.message || error.message || 'Failed to reject leave request';
                    this.hideMessages();
                },
                complete: () => { this.loading = false; }
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to reject leave request';
            this.loading = false;
            this.hideMessages();
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
                error: (error) => {
                    this.errorMessage = error.error?.message || error.message || 'Failed to delete leave request';
                    this.hideMessages();
                },
                complete: () => { this.loading = false; }
            });
        } catch (error: any) {
            this.errorMessage = error.message || 'Failed to delete leave request';
            this.loading = false;
            this.hideMessages();
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

    // ========== PERMISSION HELPERS ==========
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

    // ========== DISPLAY HELPERS ==========
    getLeaveTypeString(leaveType: LeaveType): string {
        return this.leaveRequestService.getLeaveTypeString(leaveType);
    }

    getLeaveStatusString(status: string): string {
        return status;
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

    // ========== PRIVATE HELPER METHODS ==========
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

    // ========== CSV EXPORT ==========
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
