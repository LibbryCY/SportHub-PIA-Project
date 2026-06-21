import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';
import { RoleGuard } from './guards/role-guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login').then(m => m.Login) },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then(m => m.ForgotPassword) 
  },
  { path: 'register', loadComponent: () => import('./pages/auth/register/register').then(m => m.Register) },
  { path: 'facilities', loadComponent: () => import('./pages/facilities/facility-list/facility-list').then(m => m.FacilityList) },
  { path: 'facilities/:id', loadComponent: () => import('./pages/facilities/facility-detail/facility-detail').then(m => m.FacilityDetail) },

  {
    path: 'athlete',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'athlete' },
    children: [
      { path: 'profile', loadComponent: () => import('./pages/athlete/profile/profile').then(m => m.AthleteProfile) },
      { path: 'search', loadComponent: () => import('./pages/athlete/search/search').then(m => m.AthleteSearch) },
      { path: 'ads', loadComponent: () => import('./pages/athlete/ads/ads').then(m => m.AthleteAds) },
      { path: 'trainers', loadComponent: () => import('./pages/athlete/trainers/trainers').then(m => m.AthleteTrainers) },
      { path: 'shop', loadComponent: () => import('./pages/athlete/shop/shop').then(m => m.AthleteShop) },
      { path: 'statistics', loadComponent: () => import('./pages/athlete/statistics/statistics').then(m => m.AthleteStatistics) },
    ]
  },
  {
    path: 'employee',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'employee' },
    children: [
      { path: 'profile', loadComponent: () => import('./pages/employee/profile/profile').then(m => m.EmployeeProfile) },
      { path: 'facilities', loadComponent: () => import('./pages/employee/facilities/facilities').then(m => m.EmployeeFacilities) },
      { path: 'reservations', loadComponent: () => import('./pages/employee/reservations/reservations').then(m => m.Reservations) },
      { path: 'calendar', loadComponent: () => import('./pages/employee/calendar/calendar').then(m => m.Calendar) },
      { path: 'promotions', loadComponent: () => import('./pages/employee/promotions/promotions').then(m => m.Promotions) },
      { path: 'reports', loadComponent: () => import('./pages/employee/reports/reports').then(m => m.Reports) },
    ]
  },


{ path: 'admin-login', loadComponent: () => import('./pages/admin/admin-login/admin-login').then(m => m.AdminLogin) },
{
  path: 'admin',
  canActivate: [AuthGuard, RoleGuard],
  data: { role: 'admin' },
  children: [
    { path: 'users', loadComponent: () => import('./pages/admin/users/users').then(m => m.AdminUsers) },
    { path: 'facilities', loadComponent: () => import('./pages/admin/facilities/facilities').then(m => m.AdminFacilities) },
    { path: 'sports', loadComponent: () => import('./pages/admin/sports/sports').then(m => m.AdminSports) },
    { path: 'trainers', loadComponent: () => import('./pages/admin/trainers/trainers').then(m => m.AdminTrainers) },
  ]
},

  { path: '**', redirectTo: '' }
];