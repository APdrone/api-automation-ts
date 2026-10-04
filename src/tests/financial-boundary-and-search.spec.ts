import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BillPulseClient } from '../clients/billPulseClient.js';
import { InvoicePayloadBuilder } from '../builders/invoice-payload.builder.js';
import { FrameworkApiError } from '@script-crux/adapter-axios';

describe('API: Financial Boundaries, Search & Pagination Filters', () => {
  const client = new BillPulseClient({ baseUrl: 'http://localhost:4000' });

  describe('Financial Calculations & Edge Cases', () => {
    it('should correctly calculate total when 100% full discount is applied ($0 total)', async () => {
      const payload = new InvoicePayloadBuilder()
        .withCustomer('Free Tier Promo Ltd', 'promo@freetier.io')
        .withLineItems([
          { description: 'Community Support Tier', quantity: 1, unitPrice: 500 }
        ])
        .withDiscount(100) // 100% discount
        .withTaxRate(10)   // Tax on $0 = $0
        .build();

      const invoice = await client.createInvoice(payload);

      assert.strictEqual(invoice.subtotal, 500);
      assert.strictEqual(invoice.discountAmount, 500);
      assert.strictEqual(invoice.taxAmount, 0);
      assert.strictEqual(invoice.totalAmount, 0);
    });

    it('should accurately calculate fractional currency rounding across multi-line items', async () => {
      // Subtotal = 3 * 33.33 = 99.99
      // Discount 7.5% = 7.49925 -> 7.50
      // Taxable = 92.49
      // Tax 8.875% = 8.2084875 -> 8.21
      // Total = 92.49 + 8.21 = 100.70
      const payload = new InvoicePayloadBuilder()
        .withCustomer('Fractional Dynamics Inc', 'billing@fractional.io')
        .withLineItems([
          { description: 'Micro-instance CPU hour', quantity: 3, unitPrice: 33.33 }
        ])
        .withDiscount(7.5)
        .withTaxRate(8.875)
        .build();

      const invoice = await client.createInvoice(payload);

      assert.strictEqual(invoice.subtotal, 99.99);
      assert.strictEqual(invoice.discountAmount, 7.5);
      assert.strictEqual(invoice.taxAmount, 8.21);
      assert.strictEqual(invoice.totalAmount, 100.7);
    });

    it('should reject invoice creation when line item unit price is negative', async () => {
      const payload = new InvoicePayloadBuilder()
        .withCustomer('Malicious Negative Corp', 'bad@negative.com')
        .withLineItems([
          { description: 'Exploit Item', quantity: 1, unitPrice: -50 }
        ])
        .build();

      await assert.rejects(
        async () => {
          await client.createInvoice(payload);
        },
        (err: Error) => {
          assert.ok(err instanceof FrameworkApiError);
          assert.strictEqual((err as FrameworkApiError).status, 400);
          return true;
        }
      );
    });
  });

  describe('Search Queries & Status Filter Param Combinations', () => {
    it('should filter invoices by matching search term in customer name', async () => {
      const uniqueCustomer = `SearchTarget_${Date.now()}`;
      const payload = new InvoicePayloadBuilder()
        .withCustomer(uniqueCustomer, 'target@search.io')
        .build();

      await client.createInvoice(payload);

      const result = await client.getInvoices({ search: uniqueCustomer });

      assert.ok(result.data.length >= 1);
      assert.ok(result.data.some((inv) => inv.customerName === uniqueCustomer));
    });

    it('should filter invoices by status and respect pagination limit', async () => {
      const result = await client.getInvoices({ status: 'DRAFT', limit: 2, page: 1 });

      assert.ok(result.data.length <= 2);
      assert.ok(result.data.every((inv) => inv.status === 'DRAFT'));
      assert.strictEqual(result.pagination.limit, 2);
      assert.strictEqual(result.pagination.page, 1);
    });
  });
});
