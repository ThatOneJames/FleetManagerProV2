import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-driver-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class DriverProfileComponent implements OnInit {
    isEditing = false;
    isLoading = false;

    driverDetails: any = {
        id: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        hireDate: '',
        emergencyContact: '',
        profileImageUrl: ''
    };

    private usersApiUrl = 'http://localhost:5129/api/users';

    constructor(private http: HttpClient, private authService: AuthService) { }

    ngOnInit(): void {
        this.loadCurrentUserProfile();
    }

    private sanitize(value: any): string {
        return value ?? '';
    }

    private loadCurrentUserProfile(): void {
        this.isLoading = true;
        console.log('=== Loading Current User Profile ===');
        console.log('Is authenticated:', this.authService.isAuthenticated());

        const currentUser = this.authService.getCurrentUserSync();
        console.log('Current user from AuthService:', currentUser);

        if (currentUser && currentUser.id) {
            console.log('Using cached user data');
            this.populateDriverDetails(currentUser);
            this.isLoading = false;
            return;
        }

        console.log('No cached user, refreshing from API');
        this.authService.refreshCurrentUser().subscribe({
            next: (user) => {
                console.log('Refreshed user from API:', user);
                this.populateDriverDetails(user);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error refreshing user:', err);
                this.handleError('Could not load profile data');
            }
        });
    }

    private populateDriverDetails(user: any): void {
        console.log('Raw user data received:', user);

        this.driverDetails = {
            id: this.sanitize(user.id),
            name: this.sanitize(user.name) || this.sanitize(user.driver?.fullName),
            email: this.sanitize(user.email),
            phone: this.sanitize(user.driver?.phone) || this.sanitize(user.phone) || '',
            address: this.sanitize(user.address) || '',
            dateOfBirth: user.dateOfBirth ? this.formatDate(user.dateOfBirth) : '',
            hireDate: user.hireDate ? this.formatDate(user.hireDate) : '',
            emergencyContact: this.sanitize(user.emergencyContact) || '',
            profileImageUrl: this.sanitize(user.profileImageUrl) || ''
        };


        console.log('Populated driver details:', this.driverDetails);
    }

    private handleError(message: string): void {
        this.isLoading = false;
        alert(message);
    }

    private formatDate(dateString: string | Date): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    toggleEdit(): void { this.isEditing = !this.isEditing; }

    saveChanges(): void {
        const userId = this.authService.getCurrentUserId();
        if (!userId) {
            alert('User ID is missing. Cannot update profile.');
            return;
        }

        const updatePayload: any = {
            phone: this.driverDetails.phone || null,
            address: this.driverDetails.address || null,
            dateOfBirth: this.driverDetails.dateOfBirth ? new Date(this.driverDetails.dateOfBirth).toISOString() : null,
            emergencyContact: this.driverDetails.emergencyContact || null,
            profileImageUrl: this.driverDetails.profileImageUrl || null
        };

        this.http.put<any>(`${this.usersApiUrl}/${userId}`, updatePayload)
            .subscribe({
                next: () => {
                    alert('Profile updated successfully!');
                    this.isEditing = false;
                    this.authService.refreshCurrentUser().subscribe({
                        next: (updatedUser) => this.populateDriverDetails(updatedUser),
                        error: () => this.loadCurrentUserProfile()
                    });
                },
                error: (err) => {
                    if (err.status === 404) {
                        alert('User not found. Please log in again.');
                        this.authService.logout();
                    } else {
                        alert('Error updating profile. Please try again.');
                    }
                }
            });
    }
}
