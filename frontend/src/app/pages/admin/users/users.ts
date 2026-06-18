import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class AdminUsers implements OnInit {
  pendingUsers: any[] = [];
  allUsers: any[] = [];
  activeTab: 'pending' | 'all' = 'pending';
  message = '';
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadPending();
    this.loadAll();
    this.activeTab = 'pending';
  }


  loadPending() {
    this.api.getPendingUsers().subscribe(data => this.pendingUsers = data);
  }

  loadAll() {
    this.api.getAllUsers().subscribe(data => this.allUsers = data);
  }

  approve(id: string) {
    this.api.approveUser(id).subscribe({
      next: () => {
        this.message = 'Korisnik odobren';
        this.loadPending();
        this.loadAll();
      },
      error: () => this.error = 'Greška'
    });
  }

  reject(id: string) {
    this.api.rejectUser(id).subscribe({
      next: () => {
        this.message = 'Korisnik odbijen';
        this.loadPending();
        this.loadAll();
      },
      error: () => this.error = 'Greška'
    });
  }

  deleteUser(id: string) {
    if (!confirm('Obrisati korisnika?')) return;
    this.api.getAllUsers().subscribe(); // placeholder
  }

  roleLabel(role: string): string {
    const map: any = { athlete: 'Sportista', employee: 'Zaposleni', admin: 'Admin' };
    return map[role] || role;
  }

  statusLabel(status: string): string {
    const map: any = { pending: 'Na čekanju', active: 'Aktivan', blocked: 'Blokiran', rejected: 'Odbijen' };
    return map[status] || status;
  }
}