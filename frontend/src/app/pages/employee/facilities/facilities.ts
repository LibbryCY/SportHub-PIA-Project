import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-employee-facilities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facilities.html',
  styleUrl: './facilities.css'
})
export class EmployeeFacilities implements OnInit {
  facilities: any[] = [];
  sports: any[] = [];

  mode: 'list' | 'form' | 'json' = 'list';
  editingId: string | null = null;

  form: any = this.emptyForm();
  imageFiles: File[] = [];
  imagePreviews: string[] = [];

  jsonFile: File | null = null;

  message = '';
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
    this.api.getSports().subscribe(d => { this.sports = d; this.cdr.detectChanges(); });
  }

  emptyForm() {
    return {
      name: '', city: '', address: '', pricePerHour: 0,
      workingHours: { open: '08:00', close: '22:00' },
      maxNoShows: 3,
      description: '',
      sports: [] as string[],
      courts: [] as any[]
    };
  }

  load() {
    this.api.getMyFacilities().subscribe({
      next: (d) => { this.facilities = d; this.cdr.detectChanges(); }
    });
  }

  startNew() {
    this.form = this.emptyForm();
    this.editingId = null;
    this.imageFiles = [];
    this.imagePreviews = [];
    this.mode = 'form';
  }

  startEdit(f: any) {
    this.form = {
      name: f.name, city: f.city, address: f.address, pricePerHour: f.pricePerHour,
      workingHours: { ...f.workingHours },
      maxNoShows: f.maxNoShows,
      description: f.description || '',
      sports: f.sports.map((s: any) => s._id || s),
      courts: f.courts.map((c: any) => ({ ...c }))
    };
    this.editingId = f._id;
    this.imageFiles = [];
    this.imagePreviews = [];
    this.mode = 'form';
  }

  toggleSport(id: string) {
    const idx = this.form.sports.indexOf(id);
    if (idx === -1) this.form.sports.push(id);
    else this.form.sports.splice(idx, 1);
  }

  isSportSelected(id: string): boolean {
    return this.form.sports.includes(id);
  }

  addCourt() {
    this.form.courts.push({ name: '', type: 'outdoor', capacity: 4, sports: [], equipment: '' });
  }

  removeCourt(idx: number) {
    this.form.courts.splice(idx, 1);
  }

  toggleCourtSport(court: any, id: string) {
    if (!court.sports) court.sports = [];
    const idx = court.sports.indexOf(id);
    if (idx === -1) court.sports.push(id);
    else court.sports.splice(idx, 1);
  }

  isCourtSportSelected(court: any, id: string): boolean {
    return court.sports?.includes(id);
  }

  onImagesSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.imageFiles = files;
    this.imagePreviews = [];
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.imagePreviews.push(e.target.result); this.cdr.detectChanges(); };
      reader.readAsDataURL(f);
    });
  }

  validate(): boolean {
    this.error = '';
    if (!this.form.name || !this.form.city || !this.form.address) {
      this.error = 'Popunite osnovne podatke o objektu';
      return false;
    }
    if (!this.form.pricePerHour || this.form.pricePerHour <= 0) {
      this.error = 'Unesite ispravnu cenu po satu';
      return false;
    }
    const hasOutdoor4 = this.form.courts.some((c: any) => c.type === 'outdoor' && c.capacity >= 4);
    if (!hasOutdoor4) {
      this.error = 'Objekat mora imati bar jedan otvoreni teren sa kapacitetom od najmanje 4 mesta';
      return false;
    }
    const names = this.form.courts.map((c: any) => c.name?.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      this.error = 'Nazivi terena/hala moraju biti jedinstveni';
      return false;
    }
    for (const c of this.form.courts) {
      if (!c.name || !c.capacity) {
        this.error = 'Svi tereni moraju imati naziv i kapacitet';
        return false;
      }
      if (c.equipment && c.equipment.length > 300) {
        this.error = 'Opis opreme može imati najviše 300 karaktera';
        return false;
      }
    }
    return true;
  }

  save() {
    if (!this.validate()) return;

    const formData = new FormData();
    formData.append('facilityData', JSON.stringify(this.form));
    this.imageFiles.forEach(f => formData.append('images', f));

    const request$ = this.editingId
      ? this.api.updateFacility(this.editingId, formData)
      : this.api.createFacility(formData);

    request$.subscribe({
      next: () => {
        this.message = this.editingId ? 'Objekat ažuriran' : 'Objekat kreiran, čeka odobrenje administratora';
        this.mode = 'list';
        this.load();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 4000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri čuvanju objekta';
        this.cdr.detectChanges();
      }
    });
  }

  onJsonSelected(event: any) {
    this.jsonFile = event.target.files[0] || null;
  }

  importJson() {
    if (!this.jsonFile) { this.error = 'Odaberite JSON fajl'; return; }
    const formData = new FormData();
    formData.append('jsonFile', this.jsonFile);
    console.log('Importing JSON file', this.jsonFile);
    this.api.importFacilityJson(formData).subscribe({
      next: () => {
        console.log('JSON import successful');
        this.message = 'Objekat uvezen iz JSON fajla, čeka odobrenje administratora';
        this.mode = 'list';
        this.jsonFile = null;
        this.load();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 4000);
      },
      error: (err) => {
        console.error('JSON import error', err);
        this.error = err.error?.message || 'Greška pri uvozu JSON fajla';
        this.cdr.detectChanges();
      }
    });
  }

  statusLabel(s: string): string {
    const map: any = { pending: 'Na čekanju', active: 'Aktivan', inactive: 'Neaktivan' };
    return map[s] || s;
  }

  courtTypeLabel(t: string): string {
    const map: any = { outdoor: 'Otvoreni', indoor: 'Zatvoreni', hall: 'Dvorana' };
    return map[t] || t;
  }
}