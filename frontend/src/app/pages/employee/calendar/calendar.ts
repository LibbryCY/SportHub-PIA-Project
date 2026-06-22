import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-employee-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class EmployeeCalendar implements OnInit {
  facilities: any[] = [];
  selectedFacilityId = '';
  selectedCourtId = '';

  weekStart: Date = this.getMonday(new Date());
  days = ['PON', 'UTO', 'SRI', 'ČET', 'PET', 'SUB', 'NED'];
  hours = Array.from({ length: 15 }, (_, i) => i + 8);

  reservations: any[] = [];
  trainings: any[] = [];

  draggedItem: any = null;

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
          if (d[0].courts?.length > 0) this.selectedCourtId = d[0].courts[0]._id;
          this.loadData();
        }
        this.cdr.detectChanges();
      }
    });
  }

  get selectedFacility() {
    return this.facilities.find(f => f._id === this.selectedFacilityId);
  }

  get selectedCourt() {
    return this.selectedFacility?.courts?.find((c: any) => c._id === this.selectedCourtId);
  }

  onFacilityChange() {
    const f = this.selectedFacility;
    this.selectedCourtId = f?.courts?.[0]?._id || '';
    this.loadData();
  }

  onCourtChange() {
    this.loadData();
  }

  prevWeek() {
    this.weekStart = new Date(this.weekStart.getTime() - 7 * 86400000);
    this.loadData();
  }

  nextWeek() {
    this.weekStart = new Date(this.weekStart.getTime() + 7 * 86400000);
    this.loadData();
  }

  today() {
    this.weekStart = this.getMonday(new Date());
    this.loadData();
  }

  loadData() {
    if (!this.selectedFacilityId || !this.selectedCourtId) return;
    this.loading = true;
    const start = this.weekStart.toISOString();
    const end = new Date(this.weekStart.getTime() + 7 * 86400000).toISOString();

    this.api.getCalendar(this.selectedFacilityId, this.selectedCourtId, start, end).subscribe({
      next: (d) => { this.reservations = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.api.getFacilityTrainings(this.selectedFacilityId).subscribe({
      next: (d) => { this.trainings = d; this.cdr.detectChanges(); }
    });
  }

  getWeekDays(): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(this.weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  getEventAt(day: Date, hour: number): any {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(day);
    slotEnd.setHours(hour + 1, 0, 0, 0);
  
    const res = this.reservations.find(r => {
      const s = new Date(r.startTime);
      const e = new Date(r.endTime);
      return s < slotEnd && e > slotStart;
    });
    if (res) return { type: 'reservation', data: res };
  
    const tr = this.trainings.find(t => {
      const facilityId = t.facility?._id?.toString() || t.facility?.toString();
      const courtId = t.court?._id?.toString() || t.court?.toString();
      if (facilityId !== this.selectedFacilityId) return false;
      if (courtId !== this.selectedCourtId) return false;
      const s = new Date(t.startTime);
      const e = new Date(t.endTime);
      return s < slotEnd && e > slotStart;
    });
    if (tr) return { type: 'training', data: tr };
  
    return null;
  }

  isSlotStart(day: Date, hour: number): boolean {
    const event = this.getEventAt(day, hour);
    if (!event) return false;
    const s = new Date(event.data.startTime);
    return s.getHours() === hour && s.toDateString() === day.toDateString();
  }

  isDraggable(): boolean {
    return this.selectedCourt?.type === 'indoor' || this.selectedCourt?.type === 'hall';
  }

  onDragStart(event: DragEvent, item: any, day: Date, hour: number) {
    if (!this.isDraggable()) { event.preventDefault(); return; }
    if (item.type !== 'reservation' && item.type !== 'training') { event.preventDefault(); return; }
    this.draggedItem = item;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, day: Date, hour: number) {
    event.preventDefault();
    if (!this.draggedItem) return;
  
    const data = this.draggedItem.data;
    const duration = new Date(data.endTime).getTime() - new Date(data.startTime).getTime();
    const newStart = new Date(day);
    newStart.setHours(hour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);
  
    if (this.draggedItem.type === 'reservation') {
      this.api.moveReservation(data._id, newStart.toISOString(), newEnd.toISOString()).subscribe({
        next: () => {
          this.message = 'Rezervacija pomerena';
          this.loadData();
          this.cdr.detectChanges();
          setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Greška pri pomeranju';
          this.cdr.detectChanges();
        }
      });
    } else if (this.draggedItem.type === 'training') {
      this.api.moveTraining(data._id, newStart.toISOString(), newEnd.toISOString()).subscribe({
        next: () => {
          this.message = 'Trening pomeren';
          this.loadData();
          this.cdr.detectChanges();
          setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Greška pri pomeranju';
          this.cdr.detectChanges();
        }
      });
    }
  
    this.draggedItem = null;
  }

  eventLabel(event: any): string {
    if (event.type === 'reservation') {
      return `${event.data.user?.firstName || ''} ${event.data.user?.lastName || ''}`.trim() || 'Rezervacija';
    }
    return `Trening: ${event.data.athlete?.firstName || ''} ${event.data.athlete?.lastName || ''}`.trim();
  }

  eventHours(event: any): string {
    const s = new Date(event.data.startTime);
    const e = new Date(event.data.endTime);
    return `${s.getHours()}:00-${e.getHours()}:00`;
  }

  courtTypeLabel(type: string): string {
    const map: any = { outdoor: 'Otvoreni', indoor: 'Zatvoreni', hall: 'Dvorana' };
    return map[type] || type;
  }

  getMonday(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  eventSpanHours(event: any): number {
    const s = new Date(event.data.startTime);
    const e = new Date(event.data.endTime);
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60));
  }
}