import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-employee-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css'
})
export class EmployeeReservations implements OnInit {
  facilities: any[] = [];
  selectedFacilityId = '';
  reservations: any[] = [];
  trainings: any[] = [];
  activeTab: 'reservations' | 'trainings' = 'reservations';

  message = '';
  error = '';
  loading = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getMyFacilities().subscribe({
      next: (d) => {
        this.facilities = d;
        if (d.length > 0) {
          this.selectedFacilityId = d[0]._id;
          this.loadData();
        }
        this.cdr.detectChanges();
      }
    });
  }

  onFacilityChange() {
    this.loadData();
  }

  loadData() {
    if (!this.selectedFacilityId) return;
    this.loading = true;
    this.api.getFacilityReservations(this.selectedFacilityId).subscribe({
      next: (d) => { this.reservations = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
    this.api.getFacilityTrainings(this.selectedFacilityId).subscribe({
      next: (d) => { this.trainings = d; this.cdr.detectChanges(); }
    });
  }

  canAct(reservation: any): boolean {
    const minutesSinceStart = (Date.now() - new Date(reservation.startTime).getTime()) / (1000 * 60);
    return minutesSinceStart >= 0 && minutesSinceStart <= 10 && reservation.status === 'pending';
  }

  confirm(id: string) {
    this.api.confirmReservation(id).subscribe({
      next: () => {
        this.message = 'Rezervacija potvrđena';
        this.loadData();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { this.error = err.error?.message || 'Greška'; this.cdr.detectChanges(); }
    });
  }

  noShow(id: string) {
    this.api.noShowReservation(id).subscribe({
      next: () => {
        this.message = 'Korisnik označen kao odsutan';
        this.loadData();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { this.error = err.error?.message || 'Greška'; this.cdr.detectChanges(); }
    });
  }

  statusLabel(s: string): string {
    const map: any = { pending: 'Na čekanju', confirmed: 'Potvrđena', cancelled: 'Otkazana', 'no-show': 'Nije došao' };
    return map[s] || s;
  }

  trainingStatusLabel(s: string): string {
    const map: any = { scheduled: 'Zakazan', completed: 'Završen', cancelled: 'Otkazan' };
    return map[s] || s;
  }
}