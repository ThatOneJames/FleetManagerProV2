import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User, UserRole, UserStatus } from '../models/user.model';
import firebase from 'firebase/compat/app';


@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUser: User | null = null;
    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();

    constructor(private afAuth: AngularFireAuth, private http: HttpClient) { }

    login(email: string, password: string): Observable<User> {
        const credentials = { email, password };
        return this.http.post<User>('http://localhost:5129/api/auth/login', credentials)
            .pipe(
                // FIX: Explicitly type the user parameter to User
                tap((user: User) => {
                    this.setUser(user);
                }),
                map(user => user)
            );
    }

    // store user in memory (and optionally localStorage)
    private setUser(user: User) {
        // FIX: The role received from the backend is a string, so we need to
        // convert it to the UserRole enum before storing it.
        if (typeof user.role === 'string') {
            user.role = UserRole[user.role as keyof typeof UserRole];
        }

        this.currentUser = user;
        this.userSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    getToken(): Promise<string | null> {
        return this.afAuth.currentUser.then(user => user ? user.getIdToken() : null);
    }

    getCurrentUser(): Observable<User | null> {
        return this.user$;
    }

    getUserValue(): User | null {
        return this.currentUser;
    }

    // Add a new method to explicitly clear the user from local storage
    clearUser(): void {
        this.currentUser = null;
        this.userSubject.next(null);
        localStorage.removeItem('currentUser');
    }

    async logout(): Promise<void> {
        this.clearUser();
        return this.afAuth.signOut();
    }
}
