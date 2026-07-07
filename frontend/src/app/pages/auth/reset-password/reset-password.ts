import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  error = '';
  loading = false;
  success = false;

  pwRegex = /^(?=[A-Za-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,12}$/;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'Nevažeći link za reset lozinke.';
    }
  }

  submit() {
    this.error = '';
    if (!this.pwRegex.test(this.newPassword)) {
      this.error = 'Lozinka mora imati 8-12 karaktera, počinjati slovom, sadržati veliko slovo, broj i specijalni karakter';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Lozinke se ne poklapaju';
      return;
    }
    this.loading = true;
    this.api.resetPassword({ token: this.token, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Greška link jeistekao (važi 30 minuta)';
      }
    });
  }
}