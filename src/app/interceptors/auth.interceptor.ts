import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; // Adjust path if needed

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Skip interceptor for public/unauthenticated endpoints (e.g., login)
        const publicEndpoints = ['/api/auth/login']; // Add more like '/api/auth/register' if needed
        if (publicEndpoints.some(endpoint => req.url.includes(endpoint))) {
            return next.handle(req);
        }

        // For authenticated requests, fetch token and add to header
        return from(this.authService.getToken()).pipe(
            switchMap((token) => {
                if (token) {
                    const authReq = req.clone({
                        setHeaders: { Authorization: `Bearer ${token}` }
                    });
                    return next.handle(authReq);
                }
                // If no token, proceed without auth (or you could redirect/handle unauthorized here)
                return next.handle(req);
            })
        );
    }
}
