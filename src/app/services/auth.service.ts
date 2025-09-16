import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, UserRole, UserStatus } from '../models/user.model';  
import firebase from 'firebase/compat/app';
import { BehaviorSubject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUser: User | null = null;
    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();

    constructor(private afAuth: AngularFireAuth) {
        // map Firebase user if using Firebase auth
        this.afAuth.authState.subscribe((firebaseUser: firebase.User | null) => {
            if (!firebaseUser) return;
            const user: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName ?? 'Unknown',
                email: firebaseUser.email ?? '',
                role: 'driver',
                status: 'active'
            };
            this.setUser(user);
        });
    }

    // mock login for testing
    login(email: string, password: string): Observable<User | null> {
        if (email === 'admin@test.com' && password === '123456') {
            const user: User = {
                id: '1',
                name: 'Admin User',
                email,
                role: UserRole.Admin,
                status: UserStatus.Active
            };
            this.setUser(user);
            return of(user).pipe(delay(500));
        } else if (email === 'driver@test.com' && password === '123456') {
            const user: User = {
                id: '2',
                name: 'Driver User',
                email,
                role: UserRole.Driver,
                status: UserStatus.Active
            };
            this.setUser(user);
            return of(user).pipe(delay(500));
        } else {
            return throwError(() => new Error('Invalid credentials'));
        }
    }

    // store user in memory (and optionally localStorage)
    private setUser(user: User) {
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

    async logout(): Promise<void> {
        this.currentUser = null;
        this.userSubject.next(null);
        localStorage.removeItem('currentUser');
        return this.afAuth.signOut();
    }
}
