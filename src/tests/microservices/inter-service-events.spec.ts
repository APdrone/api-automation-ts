import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DirectBillingServiceClient } from '../../clients/microservices/billingServiceClient.js';
import { InvoicePayloadBuilder } from '../../builders/invoice-payload.builder.js';

describe('Microservices: Inter-Service Distributed Event Bus & Async Settlement', () => {
  const billingService = new DirectBillingServiceClient('http://localhost:4002');

  it('should process payment via inter-service event bus (Billing -> Payment Worker -> Billing)', async () => {
    // 1. Create and submit invoice on Billing Service
    const payload = new InvoicePayloadBuilder()
      .withCustomer('Distributed FinTech LLC', 'events@fintech.io')
      .withLineItems([{ description: 'Inter-Service Event Transaction', quantity: 2, unitPrice: 300 }])
      .build();

    const invoice = await billingService.createInvoice(payload);
    await billingService.submitInvoice(invoice.id);

    // 2. Trigger Payment on Billing Service (:4002)
    // Billing Service sets state to PROCESSING and emits 'payment.requested' event
    const payRes = await billingService.payInvoice(invoice.id);
    assert.equal(payRes.invoice.status, 'PROCESSING');

    // 3. Payment Worker (:4003) receives 'payment.requested', processes it in background,
    // and emits 'payment.settled' back to Billing Service (:4002)
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // 4. Verify Billing Service updated state to PAID from the peer microservice event
    const settledInvoice = await billingService.getInvoiceById(invoice.id);
    assert.equal(settledInvoice.status, 'PAID');
    assert.ok(settledInvoice.paidAt);
  });
});
