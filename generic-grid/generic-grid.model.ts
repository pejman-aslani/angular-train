export interface GridResponse<T> {
  data:{
  items: T[];
  _links: {
    self: string;
    first: string;
    last: string;
  };
  _meta: {
    totalCount: number;
    pageCount: number;
    currentPage: number;
    perPage: number;
  };
  }
}