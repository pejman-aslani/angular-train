import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';


export interface GridColumn<T> {
  columnDef: string;
  header: string;
  cell: (element: T) => string | number;
  sortable?: boolean;
  filterable?: boolean;
  dataType?: 'string' | 'number' | 'date' | 'enum' | 'boolean';
  filterOptions?: { value: string; label: string }[];
  template?: TemplateRef<any>;
  expandable?: boolean;
  width?: string;
  filterTemplate?: TemplateRef<any>;
}

export interface FilterValue {
  [key: string]: string;
}

@Component({
  selector: 'app-generic-grid',
  templateUrl: './generic-grid.component.html',
  styleUrls: ['./generic-grid.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class GenericGridComponent<T extends { id?: number }> implements OnInit, OnChanges {
  @Input() data: T[] = [];
  @Input() columns: GridColumn<T>[] = [];
  @Input() totalCount: number = 0;
  @Input() perPage: number = 0;
  @Input() pageSize: number = 10;
  @Input() pageCount: number = 0;
  @Input() pageIndex: number = 0;
  @Input() currentPage: number = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() showSearch: boolean = true;
  @Input() sortColumn: string = '';
  @Input() sortDirection: 'asc' | 'desc' | '' = '';
  @Input() fullHeight: boolean = false;
  @Input() loading: boolean = false;
  @Input() detailTemplate: TemplateRef<any> | null = null;
  @Output() pageChange = new EventEmitter<{ pageIndex: number; pageSize: number }>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' | '' }>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<FilterValue>();
  @Output() rowExpanded = new EventEmitter<T | undefined>();

  searchControl = new FormControl('');
  filterForm = new FormGroup({});
  filters: FilterValue = {};
  hasFilterableColumns: boolean = false;
  displayedColumns: string[] = [];
  errorMessage: string | null = null;
  expandedRows: Set<number> = new Set();

  constructor(private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.initializeGrid();
    this.setupSearch();
    this.setupFilters();
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      const newData = changes['data'].currentValue;
      const previousData = changes['data'].previousValue;
      this.data = Array.isArray(newData) ? newData : [];
      if (previousData && this.expandedRows.size > 0) {
        const expandedIndices = new Set<number>();
        this.data.forEach((item, index) => {
          const prevItem = previousData[index] as T | undefined;
          if (this.expandedRows.has(index) && item.id && prevItem?.id && item.id === prevItem.id) {
            expandedIndices.add(index);
          }
        });
        this.expandedRows = expandedIndices;
      }
      this.cdr.detectChanges();
    }
    if (changes['pageIndex'] || changes['pageSize'] || changes['totalCount'] || changes['loading']) {
      this.cdr.detectChanges();
    }
  }

  getRowNumber(index: number): number {
    return this.pageIndex * this.pageSize + index + 1;
  }

  private initializeGrid(): void {
    if (!this.columns) {
      console.warn('Columns is undefined or null, initializing as empty array');
      this.columns = [];
    }
    this.displayedColumns = this.columns.map(col => col.columnDef);
    this.hasFilterableColumns = this.columns.some(col => col.filterable);
    this.columns.forEach(col => {
      if (col.filterable) {
        this.filterForm.addControl(col.columnDef, new FormControl(''));
      }
    });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(searchTerm => {
        if (!this.loading) {
          this.searchChange.emit(searchTerm || '');
          this.pageIndex = 0;
          this.expandedRows.clear();
          this.rowExpanded.emit(undefined);
          this.pageChange.emit({pageIndex: 0, pageSize: this.pageSize});
          this.cdr.detectChanges();
        }
      });
  }

  private setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(values => {
        if (!this.loading) {
          const activeFilters: FilterValue = {};
          Object.entries(values).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
              activeFilters[key] = value;
            }
          });
          this.filters = activeFilters;
          this.filterChange.emit(activeFilters);
          this.pageIndex = 0;
          this.expandedRows.clear();
          this.rowExpanded.emit(undefined);
          this.pageChange.emit({pageIndex: 0, pageSize: this.pageSize});
          this.cdr.detectChanges();
        }
      });
  }
  toggleRow(item: T, index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.clear();
      this.rowExpanded.emit(undefined);
    } else {
      this.expandedRows.clear();
      this.expandedRows.add(index);
      this.rowExpanded.emit(item);
    }
    this.cdr.detectChanges();
  }
  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }
  clearFilter(column: string): void {
    this.filterForm.get(column)?.setValue('');
    this.cdr.detectChanges();
  }
  clearAllFilters(): void {
    this.filterForm.reset();
    this.filters = {};
    this.filterChange.emit({});
    this.pageIndex = 0;
    this.expandedRows.clear();
    this.rowExpanded.emit(undefined);
    this.pageChange.emit({pageIndex: 0, pageSize: this.pageSize});
    this.cdr.detectChanges();
  }
  onPageChange(pageIndex: number, pageSize: number): void {
    if (this.loading || pageIndex < 0 || pageIndex >= this.getPageCount()) {
      return;
    }
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.pageChange.emit({pageIndex, pageSize});
    this.cdr.detectChanges();
  }
  onSortChange(column: string): void {
    if (this.loading) return;
    let direction: 'asc' | 'desc' | '' = '';
    if (this.sortColumn === column) {
      direction = this.sortDirection === 'asc' ? 'desc' : this.sortDirection === 'desc' ? '' : 'asc';
    } else {
      direction = 'asc';
    }
    this.sortColumn = column;
    this.sortDirection = direction;
    this.pageIndex = 0;
    this.sortChange.emit({column, direction});
    this.pageChange.emit({pageIndex: 0, pageSize: this.pageSize});
    this.cdr.detectChanges();
  }

  getPageRange(): number[] {
    const pageCount = this.getPageCount();
    const maxPages = 5;
    const half = Math.floor(maxPages / 2);
    let start = Math.max(0, this.pageIndex - half);
    let end = Math.min(pageCount, start + maxPages);
    if (end - start < maxPages && start > 0) {
      start = Math.max(0, end - maxPages);
    }
    return Array.from({length: end - start}, (_, i) => start + i);
  }

  getPageCount(): number {
    return this.totalCount > 0 ? Math.ceil(this.totalCount / this.pageSize) : 1;
  }

  getFilterInputType(column: GridColumn<T>): string {
    switch (column.dataType) {
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      case 'string':
      case 'enum':
      case 'boolean':
      default:
        return 'text';
    }
  }

  getColumnHeader(columnDef: string): string {
    return this.columns.find(col => col.columnDef === columnDef)?.header || columnDef;
  }

  objectKeys(obj: FilterValue): string[] {
    return Object.keys(obj);
  }

  retry(): void {
    this.errorMessage = null;
    this.pageChange.emit({pageIndex: this.pageIndex, pageSize: this.pageSize});
    this.cdr.detectChanges();
  }
}
