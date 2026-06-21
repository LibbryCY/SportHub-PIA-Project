import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  top3: any[] = [];
  promotions: any[] = [];
  sports: any[] = [];
  cities: string[] = [];
  totalFacilities = 0;

  searchForm = { name: '', city: '', sport: '', courtType: '' };
  searchResults: any[] = [];
  searched = false;
  sortColumn = '';
  sortAsc = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getTop3().subscribe(data => this.top3 = data);
    this.api.getPromotions(3).subscribe(data => this.promotions = data);
    this.api.getSports().subscribe(data => this.sports = data);
    this.api.getCities().subscribe(data => this.cities = data);
    this.api.getFacilities().subscribe(data => this.totalFacilities = data.length);
  }

  search() {
    this.api.getFacilities(this.searchForm).subscribe(data => {
      this.searchResults = data;
      this.searched = true;
    });
  }

  // x`

  resetSearch() {
    this.searchForm = { name: '', city: '', sport: '', courtType: '' };
    this.searchResults = [];
    this.searched = false;
  }

  sort(col: string) {
    if (this.sortColumn === col) this.sortAsc = !this.sortAsc;
    else { this.sortColumn = col; this.sortAsc = true; }
    this.searchResults.sort((a, b) => {
      const va = a[col] ?? '';
      const vb = b[col] ?? '';
      return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  discountLabel(p: any): string {
    return p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue} RSD`;
  }
}