import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviorment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Facilities
  getFacilities(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<any[]>(`${this.base}/facilities`, { params: p });
  }
  getTop3(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/facilities/top3`);
  }
  getFacility(id: string): Observable<any> {
    console.log('CALLING API WITH ID:', id);

    return this.http.get<any>(`${this.base}/facilities/${id}`);
  }
  getCities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/facilities/cities`);
  }

  // Promotions
  getPromotions(limit?: number): Observable<any[]> {
    let p = new HttpParams();
    if (limit) p = p.set('limit', limit);
    return this.http.get<any[]>(`${this.base}/promotions`, { params: p });
  }

  // Sports
  getSports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/sports`);
  }

  // Auth
  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/login`, data);
  }
  adminLogin(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/admin-login`, data);
  }
  register(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/register`, data);
  }
  forgotPassword(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/forgot-password`, data);
  }
  resetPassword(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/auth/reset-password`, data);
  }

  // Users
  getMe(): Observable<any> {
    return this.http.get<any>(`${this.base}/users/me`);
  }
  updateMe(data: FormData): Observable<any> {
    return this.http.put<any>(`${this.base}/users/me`, data);
  }
  getPendingUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/users/pending`);
  }
  approveUser(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/users/${id}/approve`, {});
  }
  rejectUser(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/users/${id}/reject`, {});
  }
  getAllUsers(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<any[]>(`${this.base}/users`, { params: p });
  }

  // Reservations
  getMyReservations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/reservations/my`);
  }
  createReservation(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/reservations`, data);
  }
  cancelReservation(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/reservations/${id}/cancel`, {});
  }
  getCalendar(facilityId: string, courtId: string, start: string, end: string): Observable<any[]> {
    let p = new HttpParams().set('start', start).set('end', end);
    return this.http.get<any[]>(`${this.base}/reservations/calendar/${facilityId}/${courtId}`, { params: p });
  }
  getFacilityReservations(facilityId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/reservations/facility/${facilityId}`);
  }
  confirmReservation(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/reservations/${id}/confirm`, {});
  }
  noShowReservation(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/reservations/${id}/no-show`, {});
  }

  // Equipment
  getEquipment(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<any[]>(`${this.base}/equipment`, { params: p });
  }
  createOrder(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/equipment/orders`, data);
  }
  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/equipment/orders/my`);
  }
  cancelOrder(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/equipment/orders/${id}/cancel`, {});
  }

  // Ads
  getAds(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/ads`);
  }
  createAd(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/ads`, data);
  }
  joinAd(id: string): Observable<any> {
    return this.http.post<any>(`${this.base}/ads/${id}/join`, {});
  }
  closeAd(id: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/ads/${id}/close`, {});
  }

  // Trainers
  getTrainers(params?: any): Observable<any[]> {
    let p = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) p = p.set(k, params[k]); });
    return this.http.get<any[]>(`${this.base}/trainers`, { params: p });
  }
  getMyTrainings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/trainers/trainings/my`);
  }
  scheduleTraining(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/trainers/trainings`, data);
  }
}