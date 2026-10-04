import { InvoicePayloadBuilder, CreateInvoicePayload } from '../builders/invoice-payload.builder.js';

export class InvoiceFactory {
  public static createStandardInvoice(): CreateInvoicePayload {
    return new InvoicePayloadBuilder()
      .withCustomer('Nexus FinTech Ltd', 'accounts@nexusft.io')
      .withLineItems([
        { description: 'API Gateway Processing Tier 1', quantity: 50, unitPrice: 20 },
        { description: 'Dedicated Security Audit Log', quantity: 1, unitPrice: 250 },
      ])
      .withDiscount(5)
      .withTaxRate(10)
      .build();
  }

  public static createHighValueEnterpriseInvoice(): CreateInvoicePayload {
    return new InvoicePayloadBuilder()
      .withCustomer('Global Logistics Inc', 'procurement@globallogistics.com')
      .withLineItems([
        { description: 'Enterprise Annual Cluster', quantity: 1, unitPrice: 25000 },
        { description: '24/7 Dedicated TAM Support', quantity: 12, unitPrice: 1500 },
      ])
      .withDiscount(12.5)
      .withTaxRate(8.875)
      .build();
  }

  public static createZeroDiscountInvoice(): CreateInvoicePayload {
    return new InvoicePayloadBuilder()
      .withCustomer('Small Business Hub', 'owner@sbhub.org')
      .withLineItems([{ description: 'Starter Monthly Tier', quantity: 1, unitPrice: 99 }])
      .withDiscount(0)
      .withTaxRate(0)
      .build();
  }
}
