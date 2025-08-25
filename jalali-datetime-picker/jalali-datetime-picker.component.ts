import {Component, Input, Output, EventEmitter, OnInit, ElementRef, HostListener, ViewChild, Renderer2} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import moment from 'jalali-moment';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-jalali-datetime-picker',
  standalone: true,
  imports: [ReactiveFormsModule, NgForOf, NgIf, DecimalPipe],
  templateUrl: './jalali-datetime-picker.component.html',
  styleUrls: ['./jalali-datetime-picker.component.css'],
})
export class JalaliDatetimePickerComponent implements OnInit {
  @ViewChild('pickerContainer') pickerContainer!: ElementRef;

  @Input() control!: FormControl;
  @Input() placeholder: string = 'انتخاب تاریخ و ساعت';
  @Input() calendarType: 'jalali' | 'gregorian' = 'jalali';
  @Input() format: string = 'YYYY/MM/DD';
  @Input() showWeekDays: boolean = false;
  @Input() isLocked: boolean = false;
  @Input() dateOnly: boolean = false;
  @Output() dateTimeSelected = new EventEmitter<string>();

  currentDate = this.calendarType === 'jalali' ? moment().locale('fa') : moment();
  selectedDate = this.currentDate.clone();
  days: number[] = [];
  months = this.calendarType === 'jalali' ?
    ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'] :
    ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  years: number[] = [];

  // Time properties
  selectedHour: number = this.currentDate.hour();
  selectedMinute: number = this.currentDate.minute();
  selectedSecond: number = this.currentDate.second();

  // Picker visibility states
  showPicker: boolean = false;
  showYearDropdown: boolean = false;
  showMonthDropdown: boolean = false;
  showHourPanel: boolean = false;
  showMinutePanel: boolean = false;
  showSecondPanel: boolean = false;

  // Data for time panels
  hours: number[] = [];
  minutesAndSeconds: number[] = [];

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.generateDays();
    this.generateYears();
    this.generateHours();
    this.generateMinutesAndSeconds();
    if (!this.dateOnly) {
      this.format = 'YYYY/MM/DD HH:mm:ss';
    }
  }

  // --- Positioning and Document Click Listeners ---
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showPicker && !this.elementRef.nativeElement.contains(event.target)) {
      this.showPicker = false;
    }
  }

  @HostListener('window:scroll', ['$event'])
  @HostListener('window:resize', ['$event'])
  onWindowChange(): void {
    if (this.showPicker) {
      this.setPosition();
    }
  }

  // --- Methods for Date Logic ---
  generateYears(): void {
    const currentYear = this.calendarType === 'jalali' ? this.currentDate.jYear() : this.currentDate.year();
    this.years = Array.from({length: 51}, (_, i) => currentYear - i);
  }

  generateDays(): void {
    const daysInMonth = this.calendarType === 'jalali' ? this.selectedDate.jDaysInMonth() : this.selectedDate.daysInMonth();
    this.days = Array.from({length: daysInMonth}, (_, i) => i + 1);
  }

  changeMonth(offset: number): void {
    this.selectedDate = this.calendarType === 'jalali' ? this.selectedDate.clone().add(offset, 'jMonth') : this.selectedDate.clone().add(offset, 'month');
    this.generateDays();
  }

  selectMonth(monthIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedDate = this.calendarType === 'jalali' ? this.selectedDate.clone().jMonth(monthIndex) : this.selectedDate.clone().month(monthIndex);
    this.generateDays();
    this.showMonthDropdown = false;
  }

  changeYear(offset: number): void {
    this.selectedDate = this.selectedDate.clone().add(offset, 'jYear');
    this.generateDays();
  }

  selectYear(year: number, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedDate = this.calendarType === 'jalali' ? this.selectedDate.clone().jYear(year) : this.selectedDate.clone().year(year);
    this.generateDays();
    this.showYearDropdown = false;
  }

  selectDay(day: number): void {
    this.selectedDate = this.calendarType === 'jalali' ? this.selectedDate.clone().jDate(day) : this.selectedDate.clone().date(day);
    if (this.dateOnly) {
      this.confirmAndClose();
    }
  }

  // --- Methods for NEW Time Logic ---
  private generateHours(): void {
    this.hours = Array.from({ length: 24 }, (_, i) => i);
  }

  private generateMinutesAndSeconds(): void {
    this.minutesAndSeconds = Array.from({ length: 60 }, (_, i) => i);
  }

  toggleTimePanel(type: 'hour' | 'minute' | 'second', event: MouseEvent): void {
    event.stopPropagation();
    this.showHourPanel = (type === 'hour') ? !this.showHourPanel : false;
    this.showMinutePanel = (type === 'minute') ? !this.showMinutePanel : false;
    this.showSecondPanel = (type === 'second') ? !this.showSecondPanel : false;
    this.showYearDropdown = false;
    this.showMonthDropdown = false;
  }

  selectTimeValue(type: 'hour' | 'minute' | 'second', value: number, event: MouseEvent): void {
    event.stopPropagation();
    if (type === 'hour') {
      this.selectedHour = value;
      this.showHourPanel = false;
    } else if (type === 'minute') {
      this.selectedMinute = value;
      this.showMinutePanel = false;
    } else {
      this.selectedSecond = value;
      this.showSecondPanel = false;
    }
  }

  // --- Main Actions ---
  private setPosition(): void {
    if (!this.pickerContainer) return;
    const inputRect = this.elementRef.nativeElement.querySelector('.form-control').getBoundingClientRect();
    const pickerEl = this.pickerContainer.nativeElement;
    const pickerRect = pickerEl.getBoundingClientRect();
    let top = inputRect.bottom + 5;
    let right = window.innerWidth - inputRect.right;
    if (top + pickerRect.height > window.innerHeight && inputRect.top > pickerRect.height) {
      top = inputRect.top - pickerRect.height - 5;
    }
    if (right < 5) right = 5;
    if (right + pickerRect.width > window.innerWidth) right = window.innerWidth - pickerRect.width - 5;
    this.renderer.setStyle(pickerEl, 'top', `${top}px`);
    this.renderer.setStyle(pickerEl, 'right', `${right}px`);
  }

  togglePicker(event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.isLocked) return;
    this.showPicker = !this.showPicker;
    this.showYearDropdown = false;
    this.showMonthDropdown = false;
    this.showHourPanel = this.showMinutePanel = this.showSecondPanel = false;
    if (this.showPicker) {
      setTimeout(() => this.setPosition(), 0);
    }
  }

  toggleYearDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showYearDropdown = !this.showYearDropdown;
    this.showMonthDropdown = this.showHourPanel = this.showMinutePanel = this.showSecondPanel = false;
  }

  toggleMonthDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showMonthDropdown = !this.showMonthDropdown;
    this.showYearDropdown = this.showHourPanel = this.showMinutePanel = this.showSecondPanel = false;
  }

  updateControl(): void {
    const finalDate = this.selectedDate.clone()
      .hour(this.dateOnly ? 0 : this.selectedHour)
      .minute(this.dateOnly ? 0 : this.selectedMinute)
      .second(this.dateOnly ? 0 : this.selectedSecond);
    this.control.setValue(finalDate.format(this.format));
    this.dateTimeSelected.emit(finalDate.format('YYYY-MM-DD HH:mm:ss'));
  }

  confirmAndClose(): void {
    this.updateControl();
    this.showPicker = false;
  }

  clearValue(): void {
    this.control.setValue(null);
    this.dateTimeSelected.emit('');
    this.showPicker = false;
  }
}
