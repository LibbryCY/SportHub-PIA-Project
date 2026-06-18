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

//   {
//     path: 'athlete',
//     canActivate: [AuthGuard, RoleGuard],
//     data: { role: 'athlete' },
//     children: [
//       { path: 'profile', loadComponent: () => import('./pages/athlete/profile/profile').then(m => m.ProfileComponent) },
//       { path: 'search', loadComponent: () => import('./pages/athlete/search/search.component').then(m => m.SearchComponent) },
//       { path: 'ads', loadComponent: () => import('./pages/athlete/ads/ads.component').then(m => m.AdsComponent) },
//       { path: 'trainers', loadComponent: () => import('./pages/athlete/trainers/trainers.component').then(m => m.TrainersComponent) },
//       { path: 'shop', loadComponent: () => import('./pages/athlete/shop/shop.component').then(m => m.ShopComponent) },
//       { path: 'statistics', loadComponent: () => import('./pages/athlete/statistics/statistics.component').then(m => m.StatisticsComponent) },
//     ]
//   },
//   {
//     path: 'employee',
//     canActivate: [AuthGuard, RoleGuard],
//     data: { role: 'employee' },
//     children: [
//       { path: 'profile', loadComponent: () => import('./pages/employee/profile/profile.component').then(m => m.EmployeeProfileComponent) },
//       { path: 'facilities', loadComponent: () => import('./pages/employee/facilities/facilities.component').then(m => m.EmployeeFacilitiesComponent) },
//       { path: 'reservations', loadComponent: () => import('./pages/employee/reservations/reservations.component').then(m => m.EmployeeReservationsComponent) },
//       { path: 'calendar', loadComponent: () => import('./pages/employee/calendar/calendar.component').then(m => m.EmployeeCalendarComponent) },
//       { path: 'promotions', loadComponent: () => import('./pages/employee/promotions/promotions.component').then(m => m.PromotionsComponent) },
//       { path: 'reports', loadComponent: () => import('./pages/employee/reports/reports.component').then(m => m.ReportsComponent) },
//     ]
//   },

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