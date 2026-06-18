import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilityDetail } from './facility-detail';

describe('FacilityDetail', () => {
  let component: FacilityDetail;
  let fixture: ComponentFixture<FacilityDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FacilityDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(FacilityDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
