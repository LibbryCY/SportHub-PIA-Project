import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLogin {
  form = { username: '', password: '' };
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn() && this.auth.hasRole('admin')) {
      this.router.navigate(['/admin/users']);
    }
  }

  submit() {
    this.error = '';
    this.loading = true;
    this.auth.adminLogin(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Pogrešni kredencijali';
      }
    });
  }
}