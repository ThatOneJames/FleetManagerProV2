import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {
        console.log('🔧 AuthInterceptor constructed');
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        console.log('🔄 Intercepting request to:', req.url);

        // Skip auth for public endpoints
        const publicEndpoints = ['/api/auth/login', '/api/auth/register'];
        if (publicEndpoints.some(url => req.url.includes(url))) {
            console.log('⏭️ Skipping auth for public endpoint');
            return next.handle(req);
        }

        // Get token synchronously
        const token = this.authService.getToken();
        console.log('🔑 Retrieved token:', token ? `Token exists (${token.substring(0, 20)}...)` : 'No token found');

        // Debug: Check localStorage directly
        console.log('💾 LocalStorage token:', localStorage.getItem('token'));
        console.log('💾 LocalStorage currentUser:', localStorage.getItem('currentUser'));

        // Debug: Check if user is authenticated
        console.log('🔐 Is authenticated:', this.authService.isAuthenticated());

        if (token) {
            const authReq = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('✅ Added Authorization header to request');
            console.log('📋 Request headers:', authReq.headers.keys());
            return next.handle(authReq);
        }

        console.log('❌ No token available, proceeding without auth header');
        return next.handle(req);
    }
}