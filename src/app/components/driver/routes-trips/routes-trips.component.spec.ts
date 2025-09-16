import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutesTripsComponent } from './routes-trips.component';

describe('RoutesTripsComponent', () => {
  let component: RoutesTripsComponent;
  let fixture: ComponentFixture<RoutesTripsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutesTripsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RoutesTripsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
