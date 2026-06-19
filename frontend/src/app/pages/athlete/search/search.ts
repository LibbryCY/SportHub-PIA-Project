import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-athlete-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class AthleteSearch implements OnInit {
  sports: any[] = [];
  cities: string[] = [];
  searchResults: any[] = [];
  searched = false;
  sortColumn = '';
  sortAsc = true;

  searchForm = {
    name: '',
    city: '',
    sport: '',
    courtType: '',
    todayOnly: false
  };

  selectedFacility: any = null;
  selectedCourtIndex = 0;

  // kalendar
  calendarWeekStart: Date = this.getMonday(new Date());
  calendarReservations: any[] = [];
  hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 - 22:00
  days = ['PON', 'UTO', 'SRI', 'ČET', 'PET', 'SUB', 'NED'];
  today: Date = new Date();

  // rezervacijaa
  selectedSlots: { day: Date, hour: number }[] = [];
  reservationForm = { sportId: '' };
  reservationMessage = '';
  reservationError = '';

  loading = false;
  calendarLoading = false;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.getSports().subscribe(d => { this.sports = d; this.cdr.detectChanges(); });
    this.api.getCities().subscribe(d => { this.cities = d; this.cdr.detectChanges(); });
  }

  search() {
    this.loading = true;
    this.selectedFacility = null;
    this.api.getFacilities(this.searchForm).subscribe({
      next: (data) => {
        this.searchResults = data;
        this.searched = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  resetSearch() {
    this.searchForm = { name: '', city: '', sport: '', courtType: '', todayOnly: false };
    this.searchResults = [];  

    this.searched = false;
    this.selectedFacility = null;
  }

  sort(col: string) {
    if (this.sortColumn === col) this.sortAsc = !this.sortAsc;
    else { this.sortColumn = col; this.sortAsc = true; }
    this.searchResults.sort((a, b) => {
      const va = a[col] ?? '';
      const vb = b[col] ?? '';
      return this.sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  selectFacility(facility: any) {
    this.selectedFacility = facility;
    this.selectedCourtIndex = 0;
    this.selectedSlots = [];
    this.reservationMessage = '';
    this.reservationError = '';
    this.calendarWeekStart = this.getMonday(new Date());
    this.loadCalendar();
  }

  get selectedCourt() {
    return this.selectedFacility?.courts?.[this.selectedCourtIndex];
  }

  prevCourt() {
    if (this.selectedCourtIndex > 0) {
      this.selectedCourtIndex--;
      this.selectedSlots = [];
      this.loadCalendar();
    }
  }

  nextCourt() {
    if (this.selectedCourtIndex < this.selectedFacility.courts.length - 1) {
      this.selectedCourtIndex++;
      this.selectedSlots = [];
      this.loadCalendar();
    }
  }

  prevWeek() {
    this.calendarWeekStart = new Date(this.calendarWeekStart.getTime() - 7 * 86400000);
    this.selectedSlots = [];
    this.loadCalendar();
  }

  nextWeek() {
    this.calendarWeekStart = new Date(this.calendarWeekStart.getTime() + 7 * 86400000);
    this.selectedSlots = [];
    this.loadCalendar();
  }

  loadCalendar() {
    if (!this.selectedFacility || !this.selectedCourt) return;
    this.calendarLoading = true;
    const start = this.calendarWeekStart.toISOString();
    const end = new Date(this.calendarWeekStart.getTime() + 7 * 86400000).toISOString();
    this.api.getCalendar(this.selectedFacility._id, this.selectedCourt._id, start, end).subscribe({
      next: (data) => {
        this.calendarReservations = data;
        this.calendarLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.calendarLoading = false; this.cdr.detectChanges(); }
    });
  }

  getWeekDays(): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.calendarWeekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  isTaken(day: Date, hour: number): boolean {
    return this.calendarReservations.some(r => {
      const start = new Date(r.startTime);
      const end = new Date(r.endTime);
      const slotStart = new Date(day);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(day);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      return start < slotEnd && end > slotStart;
    });
  }

  isSelected(day: Date, hour: number): boolean {
    return this.selectedSlots.some(s =>
      s.day.toDateString() === day.toDateString() && s.hour === hour
    );
  }

  isPast(day: Date, hour: number): boolean {
    const slot = new Date(day);
    slot.setHours(hour, 0, 0, 0);
    return slot < new Date();
  }

  toggleSlot(day: Date, hour: number) {
    if (this.isTaken(day, hour) || this.isPast(day, hour)) return;

    const idx = this.selectedSlots.findIndex(s =>
      s.day.toDateString() === day.toDateString() && s.hour === hour
    );

    if (idx !== -1) {
      this.selectedSlots.splice(idx, 1);
      return;
    }

    // Mora biti isti dan i uzastopni sati
    if (this.selectedSlots.length > 0) {
      const sameDay = this.selectedSlots[0].day.toDateString() === day.toDateString();
      if (!sameDay) { this.selectedSlots = []; }

      const hours = this.selectedSlots.map(s => s.hour).sort((a, b) => a - b);
      const minH = hours[0];
      const maxH = hours[hours.length - 1];
      if (hour !== minH - 1 && hour !== maxH + 1) {
        this.selectedSlots = [];
      }
    }

    this.selectedSlots.push({ day: new Date(day), hour });
    this.selectedSlots.sort((a, b) => a.hour - b.hour);
  }

  get reservationSummary(): string {
    if (!this.selectedSlots.length) return '';
    const sorted = [...this.selectedSlots].sort((a, b) => a.hour - b.hour);
    const day = sorted[0].day;
    const from = sorted[0].hour;
    const to = sorted[sorted.length - 1].hour + 1;
    return `${day.toLocaleDateString('sr-RS')} od ${from}:00 do ${to}:00`;
  }

  makeReservation() {
    if (!this.selectedSlots.length) {
      this.reservationError = 'Odaberite termin na kalendaru';
      return;
    }

    const sorted = [...this.selectedSlots].sort((a, b) => a.hour - b.hour);
    const startTime = new Date(sorted[0].day);
    startTime.setHours(sorted[0].hour, 0, 0, 0);
    const endTime = new Date(sorted[sorted.length - 1].day);
    endTime.setHours(sorted[sorted.length - 1].hour + 1, 0, 0, 0);

    const data = {
      facilityId: this.selectedFacility._id,
      courtId: this.selectedCourt._id,
      courtName: this.selectedCourt.name,
      sportId: this.reservationForm.sportId || null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };

    this.api.createReservation(data).subscribe({
      next: () => {
        this.reservationMessage = `Rezervacija uspešna: ${this.reservationSummary}`;
        this.reservationError = '';
        this.selectedSlots = [];
        this.loadCalendar();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.reservationError = err.error?.message || 'Greška pri rezervaciji';
        this.cdr.detectChanges();
      }
    });
  }

  getMonday(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  courtTypeLabel(type: string): string {
    if (type === 'outdoor') return 'Otvoreni';
    if (type === 'indoor') return 'Zatvoreni';
    if (type === 'hall') return 'Dvorana';
    return type;
  }

  sortIcon(col: string): string {
    if (this.sortColumn !== col) return '';
    return this.sortAsc ? ' ↑' : ' ↓';
  }
}