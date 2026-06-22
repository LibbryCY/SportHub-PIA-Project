import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-employee-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class EmployeeReports implements OnInit {
  facilities: any[] = [];
  selectedFacilityId = '';
  selectedMonth = '';

  loadingOccupancy = false;
  loadingEquipment = false;
  error = '';
  message = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    this.api.getMyFacilities().subscribe({
      next: (d) => {
        this.facilities = d;
        if (d.length > 0) this.selectedFacilityId = d[0]._id;
        this.cdr.detectChanges();
      }
    });
  }

  async downloadOccupancy() {
    if (!this.selectedFacilityId || !this.selectedMonth) {
      this.error = 'Odaberite objekat i mesec';
      return;
    }
    this.error = '';
    this.loadingOccupancy = true;
    try {
      const res = await this.api.downloadOccupancyReport(this.selectedFacilityId, this.selectedMonth);
      if (!res.ok) throw new Error('Greška pri generisanju izveštaja');
      const blob = await res.blob();
      this.triggerDownload(blob, `popunjenost-${this.selectedMonth}.pdf`);
      this.message = 'Izveštaj preuzet';
      this.cdr.detectChanges();
      setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
    } catch (err) {
      this.error = 'Greška pri preuzimanju izveštaja';
      this.cdr.detectChanges();
    } finally {
      this.loadingOccupancy = false;
      this.cdr.detectChanges();
    }
  }

  async downloadEquipment() {
    if (!this.selectedMonth) {
      this.error = 'Odaberite mesec';
      return;
    }
    this.error = '';
    this.loadingEquipment = true;
    try {
      const res = await this.api.downloadEquipmentReport(this.selectedFacilityId, this.selectedMonth);
      if (!res.ok) throw new Error('Greška pri generisanju izveštaja');
      const blob = await res.blob();
      this.triggerDownload(blob, `promet-opreme-${this.selectedMonth}.pdf`);
      this.message = 'Izveštaj preuzet';
      this.cdr.detectChanges();
      setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
    } catch (err) {
      this.error = 'Greška pri preuzimanju izveštaja';
      this.cdr.detectChanges();
    } finally {
      this.loadingEquipment = false;
      this.cdr.detectChanges();
    }
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}