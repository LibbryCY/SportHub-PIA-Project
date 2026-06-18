import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ads } from './ads';

describe('Ads', () => {
  let component: Ads;
  let fixture: ComponentFixture<Ads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ads],
    }).compileComponents();

    fixture = TestBed.createComponent(Ads);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
