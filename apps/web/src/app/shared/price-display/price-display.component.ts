import { Component, input } from '@angular/core';

@Component({
  selector: 'app-price-display',
  standalone: true,
  template: `
    <span class="tabular-nums font-semibold">
      {{ currencySymbol() }}{{ formattedPrice() }}
    </span>
  `,
})
export class PriceDisplayComponent {
  readonly price = input.required<number>();
  readonly currency = input('USD');

  protected currencySymbol() {
    switch (this.currency()) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'BRL': return 'R$';
      default: return '$';
    }
  }

  protected formattedPrice() {
    return this.price().toFixed(2);
  }
}
