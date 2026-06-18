import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  // Public
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'facilities', loadComponent: () => import('./pages/facilities/facility-list/facility-list.component').then(m => m.FacilityListComponent) },
  { path: 'facilities/:id', loadComponent: () => import('./pages/facilities/facility-detail/facility-detail.component').then(m => m.FacilityDetailComponent) },

  // Admin login - hidden route
  { path: 'admin-portal', loadComponent: () => import('./pages/auth/admin-login/admin-login.component').then(m => m.AdminLoginComponent) },

  // Athlete
  {
    path: 'athlete',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'athlete' },
    children: [
      { path: 'profile', loadComponent: () => import('./pages/athlete/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'search', loadComponent: () => import('./pages/athlete/search/search.component').then(m => m.SearchComponent) },
      { path: 'ads', loadComponent: () => import('./pages/athlete/ads/ads.component').then(m => m.AdsComponent) },
      { path: 'trainers', loadComponent: () => import('./pages/athlete/trainers/trainers.component').then(m => m.TrainersComponent) },
      { path: 'shop', loadComponent: () => import('./pages/athlete/shop/shop.component').then(m => m.ShopComponent) },
      { path: 'statistics', loadComponent: () => import('./pages/athlete/statistics/statistics.component').then(m => m.StatisticsComponent) },
    ]
  },

  // Employee
  {
    path: 'employee',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'employee' },
    children: [
      { path: 'profile', loadComponent: () => import('./pages/employee/profile/profile.component').then(m => m.EmployeeProfileComponent) },
      { path: 'facilities', loadComponent: () => import('./pages/employee/facilities/facilities.component').then(m => m.EmployeeFacilitiesComponent) },
      { path: 'reservations', loadComponent: () => import('./pages/employee/reservations/reservations.component').then(m => m.EmployeeReservationsComponent) },
      { path: 'calendar', loadComponent: () => import('./pages/employee/calendar/calendar.component').then(m => m.EmployeeCalendarComponent) },
      { path: 'promotions', loadComponent: () => import('./pages/employee/promotions/promotions.component').then(m => m.PromotionsComponent) },
      { path: 'reports', loadComponent: () => import('./pages/employee/reports/reports.component').then(m => m.ReportsComponent) },
    ]
  },

  // Admin
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    children: [
      { path: 'users', loadComponent: () => import('./pages/admin/users/users.component').then(m => m.AdminUsersComponent) },
      { path: 'facilities', loadComponent: () => import('./pages/admin/facilities/facilities.component').then(m => m.AdminFacilitiesComponent) },
      { path: 'sports', loadComponent: () => import('./pages/admin/sports/sports.component').then(m => m.AdminSportsComponent) },
      { path: 'trainers', loadComponent: () => import('./pages/admin/trainers/trainers.component').then(m => m.AdminTrainersComponent) },
    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
