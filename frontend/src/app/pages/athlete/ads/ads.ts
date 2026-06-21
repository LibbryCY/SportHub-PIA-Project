import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-athlete-ads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ads.html',
  styleUrl: './ads.css'
})
export class AthleteAds implements OnInit {
  ads: any[] = [];
  sports: any[] = [];
  cities: string[] = [];

  showForm = false;
  newAd = {
    sport: '',
    city: '',
    date: '',
    timeSlot: '',
    playersNeeded: 1
  };

  message = '';
  error = '';
  loading = false;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAds();
    this.api.getSports().subscribe(d => { this.sports = d; this.cdr.detectChanges(); });
    this.api.getCities().subscribe(d => { this.cities = d; this.cdr.detectChanges(); });
  }

  loadAds() {
    this.loading = true;
    this.api.getAds().subscribe({
      next: (data) => {
        this.ads = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  get myUserId(): string {
    return this.auth.currentUser?._id;
  }

  isMyAd(ad: any): boolean {
    return ad.author?._id === this.myUserId || ad.author === this.myUserId;
  }

  hasJoined(ad: any): boolean {
    return ad.requests?.some((r: any) =>
      (r.user?._id || r.user) === this.myUserId
    );
  }

  myRequestStatus(ad: any): string {
    const req = ad.requests?.find((r: any) =>
      (r.user?._id || r.user) === this.myUserId
    );
    return req?.status || '';
  }

  createAd() {
    if (!this.newAd.sport || !this.newAd.city || !this.newAd.date || !this.newAd.timeSlot) {
      this.error = 'Popunite sva obavezna polja';
      return;
    }
    this.api.createAd(this.newAd).subscribe({
      next: () => {
        this.message = 'Oglas objavljen!';
        this.showForm = false;
        this.newAd = { sport: '', city: '', date: '', timeSlot: '', playersNeeded: 1 };
        this.loadAds();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri kreiranju oglasa';
        this.cdr.detectChanges();
      }
    });
  }

  joinAd(id: string) {
    this.api.joinAd(id).subscribe({
      next: () => {
        this.message = 'Zahtev poslat!';
        this.loadAds();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška';
        this.cdr.detectChanges();
      }
    });
  }

  closeAd(id: string) {
    if (!confirm('Zatvoriti oglas?')) return;
    this.api.closeAd(id).subscribe({
      next: () => {
        this.message = 'Oglas zatvoren';
        this.loadAds();
        this.cdr.detectChanges();
      },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }

  approveRequest(adId: string, userId: string) {
    this.api.approveAdRequest(adId, userId, 'approved').subscribe({
      next: () => { this.message = 'Zahtev odobren'; this.loadAds(); this.cdr.detectChanges(); },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }

  rejectRequest(adId: string, userId: string) {
    this.api.approveAdRequest(adId, userId, 'rejected').subscribe({
      next: () => { this.message = 'Zahtev odbijen'; this.loadAds(); this.cdr.detectChanges(); },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }

  approvedCount(ad: any): number {
    return ad.requests?.filter((r: any) => r.status === 'approved').length || 0;
  }

  clearMessages() {
    setTimeout(() => { this.message = ''; this.error = ''; this.cdr.detectChanges(); }, 3000);
  }
}