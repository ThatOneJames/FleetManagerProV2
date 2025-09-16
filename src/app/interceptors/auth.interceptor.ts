import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service'; // <-- correct path

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // getToken() returns a Promise, so use from(...).pipe(switchMap(...))
        return from(this.authService.getToken()).pipe(
            switchMap((token) => {
                if (token) {
                    const authReq = req.clone({
                        setHeaders: { Authorization: `Bearer ${token}` }
                    });
                    return next.handle(authReq);
                }
                return next.handle(req);
            })
        );
    }
}
