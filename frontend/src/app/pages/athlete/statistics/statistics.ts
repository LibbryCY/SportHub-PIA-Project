import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-athlete-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css'
})
export class AthleteStatistics implements OnInit, AfterViewInit {
  @ViewChild('sportChart') sportChartRef!: ElementRef;
  @ViewChild('monthChart') monthChartRef!: ElementRef;
  @ViewChild('spendChart') spendChartRef!: ElementRef;

  reservations: any[] = [];
  orders: any[] = [];
  loading = true;

  sportChart: any;
  monthChart: any;
  spendChart: any;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    Promise.all([
      new Promise<void>(resolve => {
        this.api.getMyReservations().subscribe(d => { this.reservations = d; resolve(); });
      }),
      new Promise<void>(resolve => {
        this.api.getMyOrders().subscribe(d => { this.orders = d; resolve(); });
      })
    ]).then(() => {
      this.loading = false;
      this.cdr.detectChanges();
      setTimeout(() => this.buildCharts(), 100);
    });
  }

  ngAfterViewInit() {}

  buildCharts() {
    this.buildSportChart();
    this.buildMonthChart();
    this.buildSpendChart();
  }

  buildSportChart() {
    const sportMap: any = {};
    this.reservations.forEach(r => {
      const name = r.sport?.name || 'Nepoznat';
      sportMap[name] = (sportMap[name] || 0) + 1;
    });

    if (this.sportChartRef) {
      this.sportChart = new Chart(this.sportChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: Object.keys(sportMap),
          datasets: [{
            label: 'Broj rezervacija',
            data: Object.values(sportMap),
            backgroundColor: '#1a73e8',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }
  }

  buildMonthChart() {
    const monthMap: any = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
    months.forEach(m => monthMap[m] = 0);

    this.reservations.forEach(r => {
      const m = months[new Date(r.startTime).getMonth()];
      monthMap[m] = (monthMap[m] || 0) + 1;
    });

    if (this.monthChartRef) {
      this.monthChart = new Chart(this.monthChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Aktivnosti po mesecu',
            data: Object.values(monthMap),
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26,115,232,0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }
  }

  buildSpendChart() {
    const monthMap: any = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
    months.forEach(m => monthMap[m] = 0);

    this.orders
      .filter(o => o.status !== 'cancelled')
      .forEach(o => {
        const m = months[new Date(o.createdAt).getMonth()];
        monthMap[m] = (monthMap[m] || 0) + (o.totalPrice || 0);
      });

    if (this.spendChartRef) {
      this.spendChart = new Chart(this.spendChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'Potrošnja (RSD)',
            data: Object.values(monthMap),
            backgroundColor: '#34a853',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }

  get totalReservations(): number { return this.reservations.length; }
  get confirmedReservations(): number { return this.reservations.filter(r => r.status === 'confirmed').length; }
  get totalSpend(): number {
    return this.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.totalPrice || 0), 0);
  }
}