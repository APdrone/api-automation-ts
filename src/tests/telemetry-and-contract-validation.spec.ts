import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BillPulseClient } from '../clients/billPulseClient.js';
import { ContractValidationError } from '@script-crux/adapter-axios';
import { InvoiceFactory } from '../factories/invoice.factory.js';

describe('Core-Lib: Distributed Tracing, Telemetry SLA & Contract Validation', () => {
  const client = new BillPulseClient({ baseUrl: 'http://localhost:4000', defaultSlaThresholdMs: 3000 });

  it('should capture telemetry metadata with correlation ID, request ID, and SLA duration', async () => {
    const list = await client.getInvoices({ limit: 5 });
    assert.ok(Array.isArray(list.data));

    const telemetry = client.getLastTelemetry();
    assert.ok(telemetry, 'Telemetry metadata should be populated');
    assert.ok(telemetry.correlationId, 'Correlation ID should be auto-generated and injected');
    assert.ok(telemetry.requestId, 'Request ID should be present');
    assert.ok(typeof telemetry.durationMs === 'number', 'Duration in ms should be measured');
    assert.ok(telemetry.durationMs >= 0, 'Duration should be non-negative');
  });

  it('should validate response payload with schema validation validator', async () => {
    const payload = InvoiceFactory.createStandardInvoice();
    const created = await client.createInvoice(payload);


    // Call raw get with custom schema validation
    const invoice = await (client as any).getAndValidate(
      `/api/invoices/${created.id}`,
      (data: any) => {
        if (!data.id || !data.invoiceNumber || typeof data.totalAmount !== 'number') {
          throw new Error('Invalid Invoice Schema');
        }
        return data;
      },
      { headers: await (client as any).getHeaders() }
    );

    assert.strictEqual(invoice.id, created.id);
    assert.strictEqual(invoice.customerName, 'Nexus FinTech Ltd');

  });

  it('should throw ContractValidationError when response payload fails validation schema', async () => {
    await assert.rejects(
      async () => {
        await (client as any).getAndValidate(
          '/api/invoices',
          (data: any) => {
            if (data.invalidFieldRequired) {
              return data;
            }
            throw new Error('Missing mandatory field "invalidFieldRequired"');
          },
          { headers: await (client as any).getHeaders() }
        );
      },
      (err: Error) => {
        assert.ok(err instanceof ContractValidationError);
        assert.match(err.message, /Contract validation failed/);
        return true;
      }
    );
  });
});
