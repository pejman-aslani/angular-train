import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericGridComponent } from './generic-grid.component';

describe('GenericGridComponent', () => {
  let component: GenericGridComponent<any>;
  let fixture: ComponentFixture<GenericGridComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});