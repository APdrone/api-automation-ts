import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BillPulseClient } from '../clients/billPulseClient.js';
import { InvoiceFactory } from '../factories/invoice.factory.js';
import { FrameworkApiError } from '@script-crux/adapter-axios';

describe('API: Security, Token Tampering & Idempotent State Transitions', () => {
  const client = new BillPulseClient({ baseUrl: 'http://localhost:4000' });

  describe('Security & Token Tampering Assertions', () => {
    it('should reject requests with tampered JWT signatures with 401 Unauthorized', async () => {
      // Craft a tampered JWT (modified payload/signature)
      const fakeTamperedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzcl85OTkiLCJlbWFpbCI6ImhhY2tlckBleHBsb2l0LmlvIiwicm9sZSI6IkFETUlOIn0.INVALID_SIGNATURE_TAMPERED';

      const tamperedClient = new BillPulseClient(
        { baseUrl: 'http://localhost:4000' },
        {
          getAuthHeader: async () => `Bearer ${fakeTamperedToken}`,
          getRoleName: () => 'TAMPERED_ADMIN'
        }
      );

      await assert.rejects(
        async () => {
          await tamperedClient.getInvoices();
        },
        (err: Error) => {
          assert.ok(err instanceof FrameworkApiError);
          assert.strictEqual((err as FrameworkApiError).status, 401);
          return true;
        }
      );
    });

    it('should reject requests with missing token prefix or garbage auth headers', async () => {
      const badHeaderClient = new BillPulseClient(
        { baseUrl: 'http://localhost:4000' },
        {
          getAuthHeader: async () => 'GarbageTokenWithoutBearer',
          getRoleName: () => 'BAD_HEADER'
        }
      );

      await assert.rejects(
        async () => {
          await badHeaderClient.getInvoices();
        },
        (err: Error) => {
          assert.ok(err instanceof FrameworkApiError);
          assert.strictEqual((err as FrameworkApiError).status, 401);
          return true;
        }
      );
    });
  });

  describe('Concurrent Payment Dispatch & Idempotency Protection', () => {
    it('should handle concurrent settlement requests safely without data corruption', async () => {
      // 1. Create and submit an invoice to PENDING
      const payload = InvoiceFactory.createStandardInvoice();
      const invoice = await client.createInvoice(payload);
      await client.submitInvoice(invoice.id);

      // 2. Dispatch two simultaneous payment requests to the same invoice
      const [firstResult, secondResult] = await Promise.allSettled([
        client.payInvoice(invoice.id),
        client.payInvoice(invoice.id)
      ]);

      // At least one must succeed (202 Accepted)
      const successes = [firstResult, secondResult].filter((r) => r.status === 'fulfilled');
      assert.ok(successes.length >= 1, 'At least one payment request should succeed');

      // 3. Verify that the final invoice state advances to PROCESSING or PAID
      await new Promise((resolve) => setTimeout(resolve, 1100)); // wait for worker settlement
      const finalInvoice = await client.getInvoiceById(invoice.id);
      assert.ok(
        ['PROCESSING', 'PAID'].includes(finalInvoice.status),
        `Invoice should be PROCESSING or PAID, but was ${finalInvoice.status}`
      );
    });
  });
});
