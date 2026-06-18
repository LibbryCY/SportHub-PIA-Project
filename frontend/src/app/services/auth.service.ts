import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../eviorment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser() { return this.currentUserSubject.value; }
  get token() { return localStorage.getItem('token'); }
  isLoggedIn() { return !!this.token; }
  hasRole(role: string) { return this.currentUser?.role === role; }

  login(data: any): Observable<any> {
    console.log('Login data:', data);
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, data).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  adminLogin(data: any): Observable<any> {
    console.log('Admin login data:', data); 
    return this.http.post<any>(`${environment.apiUrl}/auth/admin-login`, data).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  navigateByRole() {
    const role = this.currentUser?.role;
    if (role === 'athlete') this.router.navigate(['/athlete/profile']);
    else if (role === 'employee') this.router.navigate(['/employee/profile']);
    else if (role === 'admin') this.router.navigate(['/admin/users']);
  }

  private storeAuth(res: any) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  private getStoredUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }
}