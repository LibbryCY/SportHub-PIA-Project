import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-athlete-trainers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trainers.html',
  styleUrl: './trainers.css'
})
export class AthleteTrainers implements OnInit {
  trainers: any[] = [];
  sports: any[] = [];
  facilities: any[] = [];
  trainings: any[] = [];

  filterSport = '';
  filterFacility = '';

  showBookForm = false;
  selectedTrainer: any = null;
  bookForm = { startTime: '', endTime: '', facilityId: '' };

  message = '';
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getSports().subscribe(d => { this.sports = d; this.cdr.detectChanges(); });
    this.api.getFacilities().subscribe(d => { this.facilities = d; this.cdr.detectChanges(); });
    this.loadTrainers();
    this.loadMyTrainings();
  }

  loadTrainers() {
    const params: any = {};
    if (this.filterSport) params.sportId = this.filterSport;
    if (this.filterFacility) params.facilityId = this.filterFacility;
    this.api.getTrainers(params).subscribe({
      next: (d) => { this.trainers = d; this.cdr.detectChanges(); }
    });
  }

  loadMyTrainings() {
    this.api.getMyTrainings().subscribe({
      next: (d) => { this.trainings = d; this.cdr.detectChanges(); }
    });
  }

  openBookForm(trainer: any) {
    this.selectedTrainer = trainer;
    this.showBookForm = true;
    this.bookForm = { startTime: '', endTime: '', facilityId: trainer.facility?._id || '' };
  }

  bookTraining() {
    if (!this.bookForm.startTime || !this.bookForm.endTime) {
      this.error = 'Unesite vreme treninga';
      return;
    }
    const data = {
      trainer: this.selectedTrainer._id,
      facility: this.bookForm.facilityId || this.selectedTrainer.facility?._id,
      startTime: new Date(this.bookForm.startTime).toISOString(),
      endTime: new Date(this.bookForm.endTime).toISOString()
    };
    this.api.scheduleTraining(data).subscribe({
      next: () => {
        this.message = 'Trening zakazan!';
        this.showBookForm = false;
        this.selectedTrainer = null;
        this.loadMyTrainings();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri zakazivanju';
        this.cdr.detectChanges();
      }
    });
  }

  avgRating(trainer: any): string {
    if (!trainer.ratings?.length) return 'Nema ocena';
    const avg = trainer.ratings.reduce((s: number, r: any) => s + r.score, 0) / trainer.ratings.length;
    return avg.toFixed(1) + ' ⭐';
  }

  trainingStatusLabel(s: string): string {
    const map: any = { scheduled: 'Zakazan', completed: 'Završen', cancelled: 'Otkazan' };
    return map[s] || s;
  }
}