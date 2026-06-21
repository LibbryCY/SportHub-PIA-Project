import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-employee-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class EmployeeProfile implements OnInit {
  user: any = null;
  facilities: any[] = [];
  editMode = false;
  editForm: any = {};
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;
  message = '';
  error = '';
  loading = true;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.api.getMe().subscribe({
      next: (data) => {
        this.user = data;
        this.editForm = {
          firstName: data.firstName, lastName: data.lastName,
          phone: data.phone, email: data.email
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.api.getMyFacilities().subscribe({
      next: (data) => { this.facilities = data; this.cdr.detectChanges(); }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.profileImageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => { this.profileImagePreview = e.target.result; this.cdr.detectChanges(); };
    reader.readAsDataURL(file);
  }

  saveProfile() {
    const formData = new FormData();
    formData.append('firstName', this.editForm.firstName);
    formData.append('lastName', this.editForm.lastName);
    formData.append('phone', this.editForm.phone);
    formData.append('email', this.editForm.email);
    if (this.profileImageFile) formData.append('profileImage', this.profileImageFile);

    this.api.updateMe(formData).subscribe({
      next: (data) => {
        this.user = data;
        this.editMode = false;
        this.message = 'Profil ažuriran';
        this.profileImageFile = null;
        this.profileImagePreview = null;
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => { this.error = 'Greška pri ažuriranju'; this.cdr.detectChanges(); }
    });
  }

  cancelEdit() {
    this.editMode = false;
    this.editForm = { firstName: this.user.firstName, lastName: this.user.lastName, phone: this.user.phone, email: this.user.email };
    this.profileImageFile = null;
    this.profileImagePreview = null;
  }

  getImageUrl(img: string): string {
    if (!img || img === 'default-avatar.png') return 'assets/default-avatar.png';
    return `http://localhost:3000/uploads/profiles/${img}`;
  }

  statusLabel(s: string): string {
    const map: any = { pending: 'Na čekanju', active: 'Aktivan', inactive: 'Neaktivan' };
    return map[s] || s;
  }

  totalCourts(f: any): number {
    return f.courts?.length || 0;
  }
}