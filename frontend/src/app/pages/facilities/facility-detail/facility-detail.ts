import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-facility-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './facility-detail.html',
  styleUrl: './facility-detail.css'
})
export class FacilityDetail implements OnInit {
  facility: any = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'Nedostaje ID objekta.';
        return;
      }

      this.loading = true;
      this.error = '';
      this.facility = null;

      this.api.getFacility(id).subscribe({
        next: (data) => {
          this.facility = data;
          this.loading = false;
          this.cdr.detectChanges(); // ovo rešava problem
        },
        error: () => {
          this.error = 'Greška pri učitavanju detalja objekta.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  getSportNames(): string {
    return (this.facility?.sports ?? [])
      .map((s: any) => s?.name ?? s)
      .filter(Boolean)
      .join(', ');
  }

  getCourtSports(court: any): string {
    return (court?.sports ?? [])
      .map((s: any) => s?.name ?? s)
      .filter(Boolean)
      .join(', ');
  }

  courtTypeLabel(type: string): string {
    if (type === 'outdoor') return 'Otvoreni';
    if (type === 'indoor') return 'Zatvoreni';
    if (type === 'hall') return 'Dvorana';
    return type ?? '';
  }
}