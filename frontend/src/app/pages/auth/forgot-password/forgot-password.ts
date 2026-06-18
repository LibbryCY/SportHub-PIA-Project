import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  usernameOrEmail = '';
  message = '';
  error = '';
  loading = false;

  constructor(private api: ApiService) {}

  submit() {
    this.error = '';
    this.message = '';
    this.loading = true;
    this.api.forgotPassword({ usernameOrEmail: this.usernameOrEmail }).subscribe({
      next: (res) => {
        this.loading = false;
        this.message = res.message;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Greška';
      }
    });
  }
}