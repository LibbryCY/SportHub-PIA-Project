import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-facility-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div style="padding:40px;text-align:center"><h2>Lista objekata - u izradi</h2></div>`
})
export class FacilityListComponent {} 