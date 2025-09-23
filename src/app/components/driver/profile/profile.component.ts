import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, UserRole } from '../../../models/user.model';

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
    private apiUrl = 'http://localhost:5129/api/driver';
    private usersApiUrl = 'http://localhost:5129/api/users';

    constructor(private http: HttpClient) { }

    ngOnInit() {
        this.loadCurrentUserProfile();
    }

    private loadCurrentUserProfile() {
        this.isLoading = true;

        // First try to get current user from the /current endpoint
        this.http.get<any>(`${this.usersApiUrl}/current`).subscribe({
            next: (user) => {
                console.log('Got current user:', user);
                if (user && user.id) {
                    this.loadDriverData(user.id);
                } else {
                    this.tryAlternativeMethod();
                }
            },
            error: (err) => {
                console.error('Error getting current user:', err);
                this.tryAlternativeMethod();
            }
        });
    }

    private tryAlternativeMethod() {
        // Try to get user ID from localStorage/token
        const userId = this.getCurrentUserIdFromStorage();

        if (userId) {
            console.log('Found user ID in storage:', userId);
            this.loadDriverData(userId);
        } else {
            // Last resort: get all users and try to find current one by email
            this.tryFindUserByEmail();
        }
    }

    private getCurrentUserIdFromStorage(): string | null {
        try {
            // Check localStorage for user data
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user.id;
            }

            // Check token
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.sub || payload.userId || payload.id || payload.nameid;
            }

            return null;
        } catch (error) {
            console.error('Error getting user ID from storage:', error);
            return null;
        }
    }

    private tryFindUserByEmail() {
        const userEmail = this.getCurrentUserEmailFromStorage();

        if (userEmail) {
            this.http.get<any[]>(this.usersApiUrl).subscribe({
                next: (users) => {
                    const currentUser = users.find(u => u.email === userEmail);
                    if (currentUser) {
                        console.log('Found user by email:', currentUser);
                        this.loadDriverData(currentUser.id);
                    } else {
                        this.handleError('User not found');
                    }
                },
                error: (err) => {
                    console.error('Error getting all users:', err);
                    this.handleError('Could not load profile');
                }
            });
        } else {
            this.handleError('Could not identify current user');
        }
    }

    private getCurrentUserEmailFromStorage(): string | null {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                return user.email;
            }

            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.email;
            }

            return null;
        } catch (error) {
            console.error('Error getting email from storage:', error);
            return null;
        }
    }

    private loadDriverData(userId: string) {
        console.log('Loading driver data for user ID:', userId);

        this.http.get<any>(`${this.apiUrl}/${userId}`).subscribe({
            next: (data) => {
                console.log('Driver data received:', data);

                if (data) {
                    // Map the data based on your API response structure
                    this.driverDetails.id = data.id || userId; // Use user ID if driver ID not available
                    this.driverDetails.name = data.name;
                    this.driverDetails.email = data.email;

                    // If the response has a nested driver object
                    if (data.driver) {
                        this.driverDetails.id = data.driver.id || data.id || userId;
                        this.driverDetails.phone = data.driver.contactNumber;
                        this.driverDetails.address = data.driver.currentAddress;
                        this.driverDetails.dateOfBirth = this.formatDate(data.driver.dateOfBirth);
                        this.driverDetails.hireDate = this.formatDate(data.driver.hireDate);
                        this.driverDetails.emergencyContact = data.driver.emergencyContact;
                        this.driverDetails.profileImageUrl = data.driver.profileImageUrl;
                    } else {
                        // If the response is flat (user data directly)
                        this.driverDetails.phone = data.phone;
                        this.driverDetails.address = data.address;
                        this.driverDetails.dateOfBirth = this.formatDate(data.dateOfBirth);
                        this.driverDetails.hireDate = this.formatDate(data.hireDate);
                        this.driverDetails.emergencyContact = data.emergencyContact;
                        this.driverDetails.profileImageUrl = data.profileImageUrl;
                    }

                    console.log('Final driver details:', this.driverDetails);
                } else {
                    this.handleError('No data received');
                }

                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching driver details:', err);
                // If driver API fails, try users API
                this.loadUserData(userId);
            }
        });
    }

    private loadUserData(userId: string) {
        console.log('Trying users API for user ID:', userId);

        this.http.get<any>(`${this.usersApiUrl}/${userId}`).subscribe({
            next: (data) => {
                console.log('User data received:', data);

                if (data) {
                    this.driverDetails.id = data.id;
                    this.driverDetails.name = data.name;
                    this.driverDetails.email = data.email;
                    this.driverDetails.phone = data.phone;
                    this.driverDetails.address = data.address;
                    this.driverDetails.dateOfBirth = this.formatDate(data.dateOfBirth);
                    this.driverDetails.hireDate = this.formatDate(data.hireDate);
                    this.driverDetails.emergencyContact = data.emergencyContact;
                    this.driverDetails.profileImageUrl = data.profileImageUrl;
                }

                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching user details:', err);
                this.handleError('Could not load profile data');
            }
        });
    }

    private handleError(message: string) {
        this.isLoading = false;
        console.error(message);
        alert(`${message}. Please try logging in again.`);
    }

    // Utility function to format date strings to YYYY-MM-DD
    private formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
    }

    saveChanges() {
        if (!this.driverDetails.id) {
            console.error('Driver ID is missing. Cannot update profile.');
            alert('Could not save changes. Driver ID is missing.');
            return;
        }

        console.log('Saving changes for driver:', this.driverDetails);

        // Prepare the update payload
        const updatePayload = {
            id: this.driverDetails.id,
            name: this.driverDetails.name,
            email: this.driverDetails.email,
            phone: this.driverDetails.phone,
            address: this.driverDetails.address,
            dateOfBirth: this.driverDetails.dateOfBirth,
            hireDate: this.driverDetails.hireDate,
            emergencyContact: this.driverDetails.emergencyContact,
            profileImageUrl: this.driverDetails.profileImageUrl
        };

        // Try updating via users API first
        this.http.put<any>(`${this.usersApiUrl}/${this.driverDetails.id}`, updatePayload)
            .subscribe({
                next: () => {
                    alert('Profile updated successfully!');
                    this.isEditing = false;
                    this.loadCurrentUserProfile(); // Reload to show updated data
                },
                error: (err) => {
                    console.error('Error updating via users API:', err);
                    // Try driver API as fallback
                    this.http.put<any>(`${this.apiUrl}/${this.driverDetails.id}`, updatePayload)
                        .subscribe({
                            next: () => {
                                alert('Profile updated successfully!');
                                this.isEditing = false;
                                this.loadCurrentUserProfile();
                            },
                            error: (driverErr) => {
                                console.error('Error updating via driver API:', driverErr);
                                alert('Error updating profile. Please try again.');
                            }
                        });
                }
            });
    }
}