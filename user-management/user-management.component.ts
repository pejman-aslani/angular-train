import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFormComponent } from '../user-form/user-form.component';
import {NgbModal, NgbModalOptions} from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import {HttpService} from '../../../service/http-request/http.service';
import {
  FilterValue,
  GenericGridComponent,
  GridColumn
} from '../../../widgets/data-grid/generic-grid/generic-grid.component';
import {ConfirmationModalComponent} from '../../../widgets/modals/confirmation-modal/confirmation-modal.component';

interface User {
  id: number;
  username: string;
  f_name: string | null;
  l_name: string | null;
  internal_number: string | null;
  email: string | null;
  enable: boolean;
  phone_number: string | null;
  managed_sip_users:string
}

@Component({
  selector: 'app-users',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  standalone: true,
  imports: [CommonModule, GenericGridComponent, UserFormComponent, ConfirmationModalComponent]
})
export class UserManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('genderTemplate') genderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('userModal') userModal!: TemplateRef<any>;
  @ViewChild('permissionModal') permissionModal!: TemplateRef<any>;
  users: User[] = [];
  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  search = '';
  filters: FilterValue = {};
  columns: GridColumn<User>[] = [];
  loading: boolean = true;
  selectedUser: any = null;
  isEditMode = false;
  showModalDelete = false;
  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.initializeColumns();
  }
  ngAfterViewInit(): void {
    this.columns = this.columns.map(col => {
      if (col.columnDef === 'gender') {
        return { ...col, template: this.genderTemplate };
      }
      if (col.columnDef === 'actions') {
        return { ...col, template: this.actionsTemplate };
      }
      return col;
    });
    this.loadUsers();
    this.cdr.markForCheck();
  }
  initializeColumns(): void {
    this.columns = [
      {
        columnDef: 'f_name',
        header: 'نام',
        cell: (user) => user.f_name || '',
        filterable: true,
        dataType: 'string'
      },
      {
        columnDef: 'l_name',
        header: 'نام خانوادگی',
        cell: (user) => user.l_name || '',
        filterable: true,
        dataType: 'string'
      },
      {
        columnDef: 'username',
        header: 'نام کاربری',
        cell: (user) => user.username,
        filterable: true,
        dataType: 'string'
      },
      {
        columnDef: 'phone_number',
        header: 'شماره تلفن',
        cell: (user) => user.phone_number || '',
        filterable: true,
        dataType: 'string'
      },
      {
        columnDef: 'internal_number',
        header: 'شماره داخلی',
        cell: (user) => user.internal_number || '',
        filterable: true,
        dataType: 'string'
      },
      {
        columnDef: 'enable',
        header: 'وضعیت',
        cell: (user) => user.enable ? 'فعال' : 'غیرفعال',
        filterable: true,
        width:"220px",
        dataType: 'boolean'
      },
      {
        columnDef: 'actions',
        header: 'عملیات',
        cell: () => '',
        sortable: false,
        filterable: false,
        template: this.actionsTemplate
      }
    ];
  }

  loadUsers(): void {
    this.loading = true;
    let url = `users?page=${this.pageIndex + 1}&per-page=${this.pageSize}`;
    if (this.sortColumn && this.sortDirection) {
      url += `&sort=${this.sortDirection === 'asc' ? '' : '-'}${this.sortColumn}`;
    }
    if (this.search) {
      url += `&search=${encodeURIComponent(this.search)}`;
    }
    if (Object.keys(this.filters).length) {
      Object.entries(this.filters).forEach(([key, value]) => {
        url += `&${key}=${encodeURIComponent(value)}`;
      });
    }
    this.httpService.get<any>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {

          this.users = Array.isArray(response.result.data.items) ? [...response.result.data.items] : [];
          this.totalCount = response.result.data._meta?.totalCount || 0;
          this.pageSize = response.result.data._meta?.perPage || this.pageSize;
          this.pageIndex = (response.result.data._meta?.currentPage || 1) - 1;
          this.loading = false;
        },
        error: (error) => {
          console.error('API Error:', error);
          this.users = [];
          this.totalCount = 0;
          this.loading = false;
          this.toaster.error('خطا در بارگذاری کاربران');
        }
      });
  }
  
  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }
  onSortChange(event: { column: string; direction: 'asc' | 'desc' | '' }): void {
    this.sortColumn = event.direction ? event.column : '';
    this.sortDirection = event.direction;
    this.pageIndex = 0;
    this.loadUsers();
  }
  onSearchChange(search: string): void {
    this.search = search;
    this.pageIndex = 0;
    this.loadUsers();
  }
  onFilterChange(filters: FilterValue): void {
    this.filters = filters;
    this.pageIndex = 0;
    this.loadUsers();
  }
  openAddUserDialog(): void {
    this.selectedUser = null;
    this.isEditMode = false;
    const modalOptions: NgbModalOptions = {
      fullscreen: false,
      size: 'xl',
      scrollable: true,
      animation: true,
      backdrop: 'static',
      keyboard: false
    };
    this.modalService.open(this.userModal, modalOptions);
  }
  editUser(user: any): void {
    this.selectedUser = { ...user };
    this.isEditMode = true;

    const modalOptions: NgbModalOptions = {
      size: 'xl',
      scrollable: true,
      animation: true,
      backdrop: 'static',
      keyboard: false
    };
    this.modalService.open(this.userModal, modalOptions);
  }
  onUserSaved(): void {
    this.modalService.dismissAll();
    this.loadUsers();
  }

  closeModal(): void {
    this.modalService.dismissAll();
  }

  openDeleteModal(user: any) {
    this.selectedUser = user;
    this.showModalDelete = true;
  }

  handleConfirm() {
    this.deleteUser(this.selectedUser);
    this.showModalDelete = false;
    this.selectedUser = null;
  }

  handleCancel() {
    this.showModalDelete = false;
    this.selectedUser = null;
  }

  deleteUser(user: User): void {
    this.loading = true;
    this.httpService.delete(`users/delete-user/${user.id}`).subscribe({
      next: () => {
        this.toaster.success('کاربر با موفقیت حذف شد');
        this.loading = false;
        this.loadUsers();
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.toaster.error('خطا در حذف کاربر');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
