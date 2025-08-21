import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform<T extends Record<string, any>>(items: T[], filter: { [key: string]: any }): T[] {
    if (!items || !filter || !Object.keys(filter).length) {
      return items;
    }
    return items.filter(item =>
      Object.entries(filter).every(([key, value]) =>
        String(item[key]).toLowerCase().includes(String(value).toLowerCase())
      )
    );
  }
}
