import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api';

@Component({
  selector: 'app-athlete-shop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class AthleteShop implements OnInit {
  equipment: any[] = [];
  sports: any[] = [];
  orders: any[] = [];
  cart: any[] = [];

  filterSport = '';
  activeTab: 'shop' | 'orders' = 'shop';

  message = '';
  error = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getSports().subscribe(d => { this.sports = d; this.cdr.detectChanges(); });
    this.loadEquipment();
    this.loadOrders();
  }

  loadEquipment() {
    const params: any = {};
    if (this.filterSport) params.sportId = this.filterSport;
    this.api.getEquipment(params).subscribe({
      next: (d) => { this.equipment = d; this.cdr.detectChanges(); }
    });
  }

  loadOrders() {
    this.api.getMyOrders().subscribe({
      next: (d) => { this.orders = d; this.cdr.detectChanges(); }
    });
  }

  addToCart(item: any) {
    const existing = this.cart.find(c => c.equipment === item._id);
    if (existing) {
      if (existing.quantity < item.stock) existing.quantity++;
    } else {
      this.cart.push({ equipment: item._id, name: item.name, price: item.price, quantity: 1, maxStock: item.stock });
    }
    this.cdr.detectChanges();
  }

  removeFromCart(idx: number) {
    this.cart.splice(idx, 1);
    this.cdr.detectChanges();
  }

  get cartTotal(): number {
    return this.cart.reduce((s, c) => s + c.price * c.quantity, 0);
  }

  placeOrder() {
    if (!this.cart.length) { this.error = 'Korpa je prazna'; return; }
    const items = this.cart.map(c => ({ equipment: c.equipment, quantity: c.quantity }));
    this.api.createOrder({ items }).subscribe({
      next: () => {
        this.message = 'Porudžbina uspešno poslata!';
        this.cart = [];
        this.activeTab = 'orders';
        this.loadOrders();
        this.cdr.detectChanges();
        setTimeout(() => { this.message = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Greška pri naručivanju';
        this.cdr.detectChanges();
      }
    });
  }

  cancelOrder(id: string) {
    if (!confirm('Otkazati porudžbinu?')) return;
    this.api.cancelOrder(id).subscribe({
      next: () => {
        this.message = 'Porudžbina otkazana';
        this.loadOrders();
        this.cdr.detectChanges();
      },
      error: () => { this.error = 'Greška'; this.cdr.detectChanges(); }
    });
  }

  quantityDec(item: any) {
    if (item.quantity > 1) item.quantity--;
    this.cdr.detectChanges();
  }
  
  quantityInc(item: any) {
    if (item.quantity < item.maxStock) item.quantity++;
    this.cdr.detectChanges();
  } 

  orderStatusLabel(s: string): string {
    const map: any = { ordered: 'Naručeno', accepted: 'Prihvaćeno', picked_up: 'Preuzeto', cancelled: 'Otkazano' };
    return map[s] || s;
  }

  getImageUrl(img: string): string {
    if (!img) return '';
    return `http://localhost:3000/uploads/${img}`;
  }
}