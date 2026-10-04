export interface CreateInvoicePayload {
  customerName: string;
  customerEmail: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  discountPercentage?: number;
  taxRatePercentage?: number;
  currency?: 'USD' | 'EUR' | 'GBP';
  dueDate?: string;
}

export class InvoicePayloadBuilder {
  private payload: CreateInvoicePayload = {
    customerName: 'Default Enterprise Corp',
    customerEmail: 'billing@enterprise.com',
    items: [{ description: 'Core Platform License', quantity: 1, unitPrice: 1000 }],
    discountPercentage: 0,
    taxRatePercentage: 8.25,
    currency: 'USD',
  };

  public withCustomer(name: string, email: string): this {
    this.payload.customerName = name;
    this.payload.customerEmail = email;
    return this;
  }

  public addLineItem(description: string, quantity: number, unitPrice: number): this {
    this.payload.items.push({ description, quantity, unitPrice });
    return this;
  }

  public withLineItems(items: Array<{ description: string; quantity: number; unitPrice: number }>): this {
    this.payload.items = items;
    return this;
  }

  public withDiscount(percentage: number): this {
    this.payload.discountPercentage = percentage;
    return this;
  }

  public withTaxRate(percentage: number): this {
    this.payload.taxRatePercentage = percentage;
    return this;
  }

  public withCurrency(currency: 'USD' | 'EUR' | 'GBP'): this {
    this.payload.currency = currency;
    return this;
  }

  public withDueDate(dueDate: string): this {
    this.payload.dueDate = dueDate;
    return this;
  }

  public build(): CreateInvoicePayload {
    return { ...this.payload, items: [...this.payload.items] };
  }
}
