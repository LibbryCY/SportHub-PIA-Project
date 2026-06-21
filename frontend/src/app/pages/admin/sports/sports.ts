import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-admin-sports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sports.html',
  styleUrl: './sports.css'
})
export class AdminSports implements OnInit {
  sports: any[] = [];
  newSportName = '';
  message = '';
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getSports().subscribe({
      next: (d) => { this.sports = d; this.cdr.detectChanges(); }
    });
  }

  addSport() {
    if (!this.newSportName.trim()) return;
    this.api.createSport(this.newSportName).subscribe({
      next: () => {
        this.message = 'Sport dodat';
        this.newSportName = '';
        this.load();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { this.error = err.error?.message || 'Greška'; this.cdr.detectChanges(); }
    });
  }

  deactivate(id: string) {
    if (!confirm('Deaktivirati ovaj sport?')) return;
    this.api.deactivateSport(id).subscribe({
      next: () => { this.message = 'Sport deaktiviran'; this.load(); this.cdr.detectChanges(); },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }
}