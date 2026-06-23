import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-facility-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './facility-detail.html',
  styleUrl: './facility-detail.css'
})
export class FacilityDetail implements OnInit {
  facility: any = null;
  loading = false;
  error = '';

  newComment = '';
  newReaction: 'like' | 'dislike' | '' = '';
  reactionMessage = '';
  reactionError = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) { this.error = 'Nedostaje ID objekta.'; return; }
      this.loading = true;
      this.error = '';
      this.facility = null;
      this.api.getFacility(id).subscribe({
        next: (data) => { this.facility = data; this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.error = 'Greška pri učitavanju.'; this.loading = false; this.cdr.detectChanges(); }
      });
    });
  }

  get isAthlete(): boolean { return this.auth.hasRole('athlete'); }
  get myUserId(): string { return this.auth.currentUser?._id; }

  isMyComment(comment: any): boolean {
    return (comment.user?._id || comment.user) === this.myUserId;
  }

  react(reaction: 'like' | 'dislike') {
    this.reactionError = '';
    this.reactionMessage = '';
    this.api.reactToFacility(this.facility._id, reaction).subscribe({
      next: (res) => {
        this.facility.likes = new Array(res.likes);
        this.facility.dislikes = new Array(res.dislikes);
        this.reactionMessage = 'Reakcija sačuvana';
        this.cdr.detectChanges();
        setTimeout(() => { this.reactionMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { this.reactionError = err.error?.message || 'Greška'; this.cdr.detectChanges(); }
    });
  }

  submitComment() {
    if (!this.newComment.trim()) { this.reactionError = 'Unesite komentar'; return; }
    this.reactionError = '';
    this.api.addComment(this.facility._id, this.newComment, this.newReaction || undefined as any).subscribe({
      next: (comment) => {
        if (!this.facility.comments) this.facility.comments = [];
        this.facility.comments = [comment, ...this.facility.comments].slice(0, 5);
        this.newComment = '';
        this.newReaction = '';
        this.reactionMessage = 'Komentar dodat';
        this.cdr.detectChanges();
        setTimeout(() => { this.reactionMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { this.reactionError = err.error?.message || 'Greška'; this.cdr.detectChanges(); }
    });
  }

  getSportNames(): string {
    return (this.facility?.sports ?? []).map((s: any) => s?.name ?? s).filter(Boolean).join(', ');
  }

  getCourtSports(court: any): string {
    return (court?.sports ?? []).map((s: any) => s?.name ?? s).filter(Boolean).join(', ');
  }

  courtTypeLabel(type: string): string {
    if (type === 'outdoor') return 'Otvoreni';
    if (type === 'indoor') return 'Zatvoreni';
    if (type === 'hall') return 'Dvorana';
    return type ?? '';
  }
}