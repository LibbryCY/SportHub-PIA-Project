import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-admin-facilities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facilities.html',
  styleUrl: './facilities.css'
})
export class AdminFacilities implements OnInit {
  pending: any[] = [];
  all: any[] = [];
  activeTab: 'pending' | 'all' = 'pending';
  message = '';
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadPending();
    this.loadAll();
  }

  loadPending() {
    this.api.getAllFacilities('pending').subscribe({
      next: (d) => { this.pending = d; this.cdr.detectChanges(); }
    });
  }

  loadAll() {
    this.api.getAllFacilities().subscribe({
      next: (d) => { this.all = d; this.cdr.detectChanges(); }
    });
  }

  approve(id: string) {
    this.api.approveFacility(id).subscribe({
      next: () => {
        this.message = 'Objekat odobren';
        this.loadPending();
        this.loadAll();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }

  reject(id: string) {
    this.api.rejectFacility(id).subscribe({
      next: () => {
        this.message = 'Objekat odbijen';
        this.loadPending();
        this.loadAll();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }

  statusLabel(s: string): string {
    const map: any = { pending: 'Na čekanju', active: 'Aktivan', inactive: 'Neaktivan' };
    return map[s] || s;
  }
}