import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { FrameworkApiError } from '@script-crux/adapter-axios';
import { BillPulseClient } from '../clients/billPulseClient.js';
import { TestingControlClient } from '../clients/testingClient.js';
import { AuthStrategies } from '../strategies/auth-strategy.js';
import { InvoicePayloadBuilder } from '../builders/invoice-payload.builder.js';

describe('API: Invoice Lifecycle State Machine & Pricing Calculations', () => {
  const testingClient = new TestingControlClient();
  const client = new BillPulseClient({}, AuthStrategies.admin());

  before(async () => {
    await testingClient.resetDatabase();
  });

  it('should create an invoice with accurate mathematical tax and discount calculations using Builder pattern', async () => {
    // Subtotal: 10 * 150 = 1500, Discount 10% = 150, Tax 8.25% on 1350 = 111.38, Total = 1461.38
    const payload = new InvoicePayloadBuilder()
      .withCustomer('SaaS Velocity Inc', 'finance@saasvelocity.io')
      .withLineItems([{ description: 'Custom Feature Flag Engine', quantity: 10, unitPrice: 150 }])
      .withDiscount(10)
      .withTaxRate(8.25)
      .build();

    const invoice = await client.createInvoice(payload);

    assert.ok(invoice.id);
    assert.match(invoice.invoiceNumber, /^INV-2026-\d{4}$/);
    assert.equal(invoice.status, 'DRAFT');
    assert.equal(invoice.subtotal, 1500);
    assert.equal(invoice.discountAmount, 150);
    assert.equal(invoice.taxAmount, 111.38);
    assert.equal(invoice.totalAmount, 1461.38);
  });

  it('should execute full state machine flow: DRAFT -> PENDING -> PROCESSING -> PAID', async () => {
    // 1. Create DRAFT
    const payload = new InvoicePayloadBuilder()
      .withCustomer('Quantum Labs', 'billing@quantumlabs.ai')
      .withLineItems([{ description: 'GPU Compute Cluster Hours', quantity: 100, unitPrice: 4.5 }])
      .build();

    const invoice = await client.createInvoice(payload);
    assert.equal(invoice.status, 'DRAFT');

    // 2. Transition DRAFT -> PENDING
    const submitted = await client.submitInvoice(invoice.id);
    assert.equal(submitted.status, 'PENDING');

    // 3. Initiate Payment PENDING -> PROCESSING (Returns 202 Accepted)
    const payResponse = await client.payInvoice(invoice.id);
    assert.equal(payResponse.invoice.status, 'PROCESSING');

    // 4. Wait for background payment worker to settle state to PAID
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const settled = await client.getInvoiceById(invoice.id);
    assert.equal(settled.status, 'PAID');
    assert.ok(settled.paidAt);
  });

  it('should reject invalid state transitions with 400 Bad Request', async () => {
    // Create DRAFT invoice
    const payload = new InvoicePayloadBuilder().build();
    const invoice = await client.createInvoice(payload);

    // Illegal: Cannot directly trigger payment on DRAFT without submitting first
    try {
      await client.payInvoice(invoice.id);
      assert.fail('Should not allow paying a DRAFT invoice');
    } catch (err: unknown) {
      assert.ok(err instanceof FrameworkApiError);
      assert.equal(err.status, 400);
    }
  });
});
