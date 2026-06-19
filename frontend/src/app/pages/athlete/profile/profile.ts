import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-athlete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class AthleteProfile implements OnInit {
  user: any = null;
  reservations: any[] = [];
  sports: any[] = [];
  
  editMode = false;
  editForm: any = {};
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;

  sortColumn = '';
  sortAsc = true;

  message = '';
  error = '';
  loading = true;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.api.getMe().subscribe({
      next: (data) => {
        this.user = data;
        this.editForm = {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          favoriteSports: data.favoriteSports?.map((s: any) => s._id || s) || []
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.api.getMyReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.cdr.detectChanges();
      }
    });

    this.api.getSports().subscribe({
      next: (data) => {
        this.sports = data;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSport(id: string) {
    const idx = this.editForm.favoriteSports.indexOf(id);
    if (idx === -1) {
      if (this.editForm.favoriteSports.length < 5) this.editForm.favoriteSports.push(id);
    } else {
      this.editForm.favoriteSports.splice(idx, 1);
    }
  }

  isSportSelected(id: string): boolean {
    return this.editForm.favoriteSports.includes(id);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.profileImageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profileImagePreview = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  saveProfile() {
    const formData = new FormData();
    formData.append('firstName', this.editForm.firstName);
    formData.append('lastName', this.editForm.lastName);
    formData.append('phone', this.editForm.phone);
    formData.append('email', this.editForm.email);
    formData.append('favoriteSports', JSON.stringify(this.editForm.favoriteSports));
    if (this.profileImageFile) formData.append('profileImage', this.profileImageFile);

    this.api.updateMe(formData).subscribe({
      next: (data) => {
        this.user = data;
        this.editMode = false;
        this.message = 'Profil uspešno ažuriran';
        this.profileImageFile = null;
        this.profileImagePreview = null;
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => {
        this.error = 'Greška pri ažuriranju profila';
        this.cdr.detectChanges();
      }
    });
  }

  cancelEdit() {
    this.editMode = false;
    this.editForm = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      phone: this.user.phone,
      email: this.user.email,
      favoriteSports: this.user.favoriteSports?.map((s: any) => s._id || s) || []
    };
    this.profileImageFile = null;
    this.profileImagePreview = null;
  }

  sort(col: string) {
    if (this.sortColumn === col) this.sortAsc = !this.sortAsc;
    else { this.sortColumn = col; this.sortAsc = true; }
    this.reservations.sort((a, b) => {
      let va = a[col] ?? '';
      let vb = b[col] ?? '';
      if (col === 'startTime' || col === 'endTime') {
        va = new Date(va).getTime();
        vb = new Date(vb).getTime();
        return this.sortAsc ? va - vb : vb - va;
      }
      return this.sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  canCancel(reservation: any): boolean {
    const hoursUntil = (new Date(reservation.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 12 && reservation.status !== 'cancelled';
  }

  cancelReservation(id: string) {
    if (!confirm('Otkazati rezervaciju?')) return;
    this.api.cancelReservation(id).subscribe({
      next: () => {
        const r = this.reservations.find(r => r._id === id);
        if (r) r.status = 'cancelled';
        this.message = 'Rezervacija otkazana';
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri otkazivanju';
        this.cdr.detectChanges();
      }
    });
  }

  getImageUrl(img: string): string {
    if (!img || img === 'default-avatar.png') return 'assets/default-avatar.png';
    return `http://localhost:3000/uploads/profiles/${img}`;
  }

  statusLabel(s: string): string {
    const map: any = { pending: 'Na čekanju', confirmed: 'Potvrđena', cancelled: 'Otkazana', 'no-show': 'Nije došao' };
    return map[s] || s;
  }

  sortIcon(col: string): string {
    if (this.sortColumn !== col) return '';
    return this.sortAsc ? ' ↑' : ' ↓';
  }
}