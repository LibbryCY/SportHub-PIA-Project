import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-employee-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promotions.html',
  styleUrl: './promotions.css'
})
export class EmployeePromotions implements OnInit {
  facilities: any[] = [];
  sports: any[] = [];
  selectedFacilityId = '';

  activeTab: 'promotions' | 'equipment' | 'orders' = 'promotions';

  promotions: any[] = [];
  equipment: any[] = [];
  orders: any[] = [];

  showPromoForm = false;
  promoForm: any = this.emptyPromo();
  editingPromoId: string | null = null;

  showEqForm = false;
  eqForm: any = this.emptyEq();
  editingEqId: string | null = null;

  message = '';
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getSports().subscribe(d => { this.sports = d; this.cdr.detectChanges(); });
    this.api.getMyFacilities().subscribe({
      next: (d) => {
        this.facilities = d;
        if (d.length > 0) { this.selectedFacilityId = d[0]._id; this.loadAll(); }
        this.cdr.detectChanges();
      }
    });
  }

  emptyPromo() {
    return { name: '', sport: '', discountType: 'percent', discountValue: 0, startDate: '', endDate: '' };
  }
  emptyEq() {
    return { name: '', sport: '', price: 0, stock: 0 };
  }

  onFacilityChange() { this.loadAll(); }

  loadAll() {
    this.loadPromotions();
    this.loadEquipment();
    this.loadOrders();
  }

  loadPromotions() {
    this.api.getFacilityPromotions(this.selectedFacilityId).subscribe({
      next: (d) => { this.promotions = d; this.cdr.detectChanges(); }
    });
  }

  loadEquipment() {
    this.api.getEquipment({ facilityId: this.selectedFacilityId }).subscribe({
      next: (d) => { this.equipment = d; this.cdr.detectChanges(); }
    });
  }

  loadOrders() {
    this.api.getFacilityOrders().subscribe({
      next: (d) => { this.orders = d; this.cdr.detectChanges(); }
    });
  }

  // PROMOCIJE
  startNewPromo() {
    this.promoForm = this.emptyPromo();
    this.editingPromoId = null;
    this.showPromoForm = true;
  }

  editPromo(p: any) {
    this.promoForm = {
      name: p.name, sport: p.sport?._id || p.sport, discountType: p.discountType,
      discountValue: p.discountValue,
      startDate: p.startDate?.substring(0, 10), endDate: p.endDate?.substring(0, 10)
    };
    this.editingPromoId = p._id;
    this.showPromoForm = true;
  }

  savePromo() {
    if (!this.promoForm.name || !this.promoForm.startDate || !this.promoForm.endDate) {
      this.error = 'Popunite sva obavezna polja'; return;
    }
    const data = { ...this.promoForm, facility: this.selectedFacilityId };
    const req$ = this.editingPromoId
      ? this.api.updatePromotion(this.editingPromoId, data)
      : this.api.createPromotion(data);

    req$.subscribe({
      next: () => {
        this.message = 'Promocija sačuvana';
        this.showPromoForm = false;
        this.loadPromotions();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { this.error = err.error?.message || 'Greška'; this.cdr.detectChanges(); }
    });
  }

  // OPREMA
  startNewEq() {
    this.eqForm = this.emptyEq();
    this.editingEqId = null;
    this.showEqForm = true;
  }

  editEq(e: any) {
    this.eqForm = { name: e.name, sport: e.sport?._id || e.sport, price: e.price, stock: e.stock };
    this.editingEqId = e._id;
    this.showEqForm = true;
  }

  saveEq() {
    if (!this.eqForm.name || this.eqForm.price <= 0) {
      this.error = 'Unesite naziv i ispravnu cenu'; return;
    }
    const data = { ...this.eqForm, facility: this.selectedFacilityId };
    const req$ = this.editingEqId
      ? this.api.updateEquipment(this.editingEqId, data)
      : this.api.createEquipment(data);

    req$.subscribe({
      next: () => {
        this.message = 'Oprema sačuvana';
        this.showEqForm = false;
        this.loadEquipment();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => { this.error = err.error?.message || 'Greška'; this.cdr.detectChanges(); }
    });
  }

  // PORUDŽBINE
  updateOrderStatus(id: string, status: string) {
    this.api.updateOrderStatus(id, status).subscribe({
      next: () => { this.message = 'Status ažuriran'; this.loadOrders(); this.cdr.detectChanges(); },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }

  orderStatusLabel(s: string): string {
    const map: any = { ordered: 'Naručeno', accepted: 'Prihvaćeno', picked_up: 'Preuzeto', cancelled: 'Otkazano' };
    return map[s] || s;
  }

  discountLabel(p: any): string {
    return p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue} RSD`;
  }
}