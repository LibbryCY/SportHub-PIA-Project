import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-facility-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './facility-list.html',
  styleUrl: './facility-list.css'
})
export class FacilityList implements OnInit {
  facilities: any[] = [];
  filteredFacilities: any[] = [];
  cities: string[] = [];

  loading = true;
  error = '';

  searchText = '';
  selectedCity = '';
  sortColumn = 'name';
  sortAsc = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    console.log('FacilityList initialized');
    this.loadFacilities();
  }

  loadFacilities(): void {
    this.loading = true;
    this.error = '';

    this.api.getFacilities().subscribe({
      next: (data) => {
        console.log('Facilities loaded:', data);
        this.facilities = data ?? [];
        this.cities = [...new Set(this.facilities.map(f => f.city).filter(Boolean))].sort();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Greška pri učitavanju objekata.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const text = this.searchText.trim().toLowerCase();

    let result = [...this.facilities].filter((f) => {
      const nameOk =
        !text ||
        (f.name ?? '').toLowerCase().includes(text) ||
        (f.address ?? '').toLowerCase().includes(text);

      const cityOk = !this.selectedCity || f.city === this.selectedCity;

      return nameOk && cityOk;
    });

    result.sort((a, b) => {
      let va = a?.[this.sortColumn];
      let vb = b?.[this.sortColumn];

      if (this.sortColumn === 'pricePerHour') {
        va = Number(va ?? 0);
        vb = Number(vb ?? 0);
        return this.sortAsc ? va - vb : vb - va;
      }

      va = String(va ?? '').toLowerCase();
      vb = String(vb ?? '').toLowerCase();

      return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    this.filteredFacilities = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  sort(col: string): void {
    if (this.sortColumn === col) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = col;
      this.sortAsc = true;
    }
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedCity = '';
    this.sortColumn = 'name';
    this.sortAsc = true;
    this.applyFilters();
  }

  getSportNames(facility: any): string {
    return (facility?.sports ?? [])
      .map((s: any) => s?.name ?? s)
      .filter(Boolean)
      .join(', ');
  }
}