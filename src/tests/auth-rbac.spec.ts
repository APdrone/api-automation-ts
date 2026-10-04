import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { FrameworkApiError } from '@script-crux/adapter-axios';
import { BillPulseClient } from '../clients/billPulseClient.js';
import { TestingControlClient } from '../clients/testingClient.js';
import { AuthStrategies } from '../strategies/auth-strategy.js';
import { InvoiceFactory } from '../factories/invoice.factory.js';

describe('API: RBAC & Authentication Security Matrix', () => {
  const testingClient = new TestingControlClient();
  const adminClient = new BillPulseClient({}, AuthStrategies.admin());
  const managerClient = new BillPulseClient({}, AuthStrategies.manager());
  const viewerClient = new BillPulseClient({}, AuthStrategies.viewer());
  const anonClient = new BillPulseClient({}, AuthStrategies.anonymous());

  before(async () => {
    await testingClient.resetDatabase();
  });

  it('should reject unauthenticated requests with 401 Unauthorized', async () => {
    try {
      await anonClient.getInvoices();
      assert.fail('Expected request to fail with 401');
    } catch (err: unknown) {
      assert.ok(err instanceof FrameworkApiError);
      assert.equal(err.status, 401);
    }
  });

  it('should allow VIEWER to read invoices but FORBID invoice creation with 403', async () => {
    // 1. Viewer can read invoices
    const list = await viewerClient.getInvoices();
    assert.ok(Array.isArray(list.data));

    // 2. Viewer cannot create invoice
    const payload = InvoiceFactory.createStandardInvoice();
    try {
      await viewerClient.createInvoice(payload);
      assert.fail('Viewer should not be authorized to create invoices');
    } catch (err: unknown) {
      assert.ok(err instanceof FrameworkApiError);
      assert.equal(err.status, 403);
      assert.match(err.message, /403/);
    }
  });

  it('should allow MANAGER to create and submit invoices, but FORBID voiding with 403', async () => {
    const payload = InvoiceFactory.createStandardInvoice();
    // Manager creates invoice
    const invoice = await managerClient.createInvoice(payload);
    assert.equal(invoice.status, 'DRAFT');

    // Manager submits invoice
    const submitted = await managerClient.submitInvoice(invoice.id);
    assert.equal(submitted.status, 'PENDING');

    // Manager cannot void invoice (Admin only)
    try {
      await managerClient.voidInvoice(invoice.id);
      assert.fail('Manager should not be authorized to void invoices');
    } catch (err: unknown) {
      assert.ok(err instanceof FrameworkApiError);
      assert.equal(err.status, 403);
    }
  });

  it('should allow ADMIN to void invoices', async () => {
    const payload = InvoiceFactory.createStandardInvoice();
    const invoice = await adminClient.createInvoice(payload);
    assert.equal(invoice.status, 'DRAFT');

    const voided = await adminClient.voidInvoice(invoice.id);
    assert.equal(voided.status, 'VOID');
  });
});
