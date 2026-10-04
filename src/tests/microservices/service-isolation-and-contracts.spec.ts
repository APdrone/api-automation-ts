import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DirectAuthServiceClient } from '../../clients/microservices/authServiceClient.js';
import { DirectBillingServiceClient } from '../../clients/microservices/billingServiceClient.js';
import { DirectReportingServiceClient } from '../../clients/microservices/reportingServiceClient.js';
import { InvoicePayloadBuilder } from '../../builders/invoice-payload.builder.js';

describe('Microservices: Service-Level Isolation & Contract Schema Validation', () => {
  const authService = new DirectAuthServiceClient('http://localhost:4001');
  const billingService = new DirectBillingServiceClient('http://localhost:4002');
  const reportingService = new DirectReportingServiceClient('http://localhost:4005');

  it('Contract: Auth Service (:4001) should authenticate and satisfy UserDTO contract', async () => {
    // 1. Direct Health Check
    const health = await authService.getHealth();
    assert.equal(health.service, 'auth-service');
    assert.equal(health.status, 'healthy');

    // 2. Direct Login
    const loginRes = await authService.login('admin@billpulse.io', 'Password123!');
    assert.ok(loginRes.token, 'Token must be present in response');
    assert.equal(loginRes.user.role, 'ADMIN');
    assert.equal(loginRes.user.email, 'admin@billpulse.io');
    assert.ok(loginRes.user.id);
    assert.ok(loginRes.user.organizationId);

    // 3. Direct RPC Token Verification
    const verifyRes = await authService.verifyToken(loginRes.token);
    assert.equal(verifyRes.valid, true);
    assert.equal(verifyRes.user.id, loginRes.user.id);
  });

  it('Contract: Billing Service (:4002) should operate in isolation and satisfy InvoiceDTO contract', async () => {
    // 1. Direct Health Check
    const health = await billingService.getHealth();
    assert.equal(health.service, 'billing-service');
    assert.equal(health.status, 'healthy');

    // 2. Direct Invoice Creation on Billing Service
    const payload = new InvoicePayloadBuilder()
      .withCustomer('Microservice Direct Corp', 'direct@microcorp.io')
      .withLineItems([{ description: 'Isolated Service Contract Test', quantity: 1, unitPrice: 750 }])
      .withDiscount(0)
      .withTaxRate(10)
      .build();

    const invoice = await billingService.createInvoice(payload);

    // Contract Schema Assertions
    assert.ok(invoice.id);
    assert.match(invoice.invoiceNumber, /^INV-2026-\d{4}$/);
    assert.equal(invoice.status, 'DRAFT');
    assert.equal(invoice.subtotal, 750);
    assert.equal(invoice.taxAmount, 75);
    assert.equal(invoice.totalAmount, 825);
    assert.equal(invoice.currency, 'USD');
    assert.ok(Array.isArray(invoice.items));
    assert.equal(invoice.items.length, 1);
  });

  it('Contract: Reporting Service (:4005) should queue and poll jobs adhering to AsyncJobDTO contract', async () => {
    // 1. Direct Health Check
    const health = await reportingService.getHealth();
    assert.equal(health.service, 'reporting-service');
    assert.equal(health.status, 'healthy');

    // 2. Direct Export Trigger
    const triggerRes = await reportingService.triggerExportJob();
    assert.ok(triggerRes.jobId);
    assert.equal(triggerRes.status, 'QUEUED');
    assert.ok(triggerRes.pollUrl);

    // 3. Direct Job Status Query
    const job = await reportingService.getJobStatus(triggerRes.jobId);
    assert.equal(job.id, triggerRes.jobId);
    assert.ok(['QUEUED', 'IN_PROGRESS', 'COMPLETED'].includes(job.status));
    assert.equal(typeof job.progress, 'number');
  });
});
