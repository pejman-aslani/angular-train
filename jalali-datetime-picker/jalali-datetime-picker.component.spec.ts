import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JalaliDatetimePickerComponent } from './jalali-datetime-picker.component';

describe('JalaliDatetimePickerComponent', () => {
  let component: JalaliDatetimePickerComponent;
  let fixture: ComponentFixture<JalaliDatetimePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JalaliDatetimePickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JalaliDatetimePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
