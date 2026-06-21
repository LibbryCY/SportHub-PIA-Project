import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-admin-trainers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trainers.html',
  styleUrl: './trainers.css'
})
export class AdminTrainers implements OnInit {
  trainers: any[] = [];
  sports: any[] = [];
  facilities: any[] = [];

  showForm = false;
  newTrainer = {
    firstName: '', lastName: '', facility: '', sport: '',
    specialization: '', pricePerHour: 0
  };

  message = '';
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
    this.api.getSports().subscribe(d => { this.sports = d; this.cdr.detectChanges(); });
    this.api.getFacilities().subscribe(d => { this.facilities = d; this.cdr.detectChanges(); });
  }

  load() {
    this.api.getTrainers().subscribe({
      next: (d) => { this.trainers = d; this.cdr.detectChanges(); }
    });
  }

  addTrainer() {
    if (!this.newTrainer.firstName || !this.newTrainer.lastName || !this.newTrainer.facility || !this.newTrainer.sport) {
      this.error = 'Popunite sva obavezna polja';
      return;
    }
    this.api.createTrainer(this.newTrainer).subscribe({
      next: () => {
        this.message = 'Trener dodat';
        this.showForm = false;
        this.newTrainer = { firstName: '', lastName: '', facility: '', sport: '', specialization: '', pricePerHour: 0 };
        this.load();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { this.error = err.error?.message || 'Greška'; this.cdr.detectChanges(); }
    });
  }

  deactivate(id: string) {
    if (!confirm('Deaktivirati ovog trenera?')) return;
    this.api.deactivateTrainer(id).subscribe({
      next: () => { this.message = 'Trener deaktiviran'; this.load(); this.cdr.detectChanges(); },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }

  avgRating(t: any): string {
    if (!t.ratings?.length) return '—';
    const avg = t.ratings.reduce((s: number, r: any) => s + r.score, 0) / t.ratings.length;
    return avg.toFixed(1);
  }
}