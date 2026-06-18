import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Promotions } from './promotions';

describe('Promotions', () => {
  let component: Promotions;
  let fixture: ComponentFixture<Promotions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Promotions],
    }).compileComponents();

    fixture = TestBed.createComponent(Promotions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
