import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { BillPulseClient } from '../clients/billPulseClient.js';
import { TestingControlClient } from '../clients/testingClient.js';
import { AuthStrategies } from '../strategies/auth-strategy.js';

describe('API: Asynchronous Background Job Processing & Polling Strategy', () => {
  const testingClient = new TestingControlClient();
  const client = new BillPulseClient({}, AuthStrategies.admin());

  before(async () => {
    await testingClient.resetDatabase();
  });

  it('should accept async export job with 202 status and return valid pollUrl', async () => {
    const res = await client.triggerExportCsvJob();
    assert.ok(res.jobId);
    assert.equal(res.status, 'QUEUED');
    assert.equal(res.pollUrl, `/api/jobs/${res.jobId}`);
  });

  it('should poll job until COMPLETED and download valid generated CSV payload', async () => {
    // 1. Trigger export job
    const triggerRes = await client.triggerExportCsvJob();
    const jobId = triggerRes.jobId;

    // 2. Poll using helper with retry strategy
    const completedJob = await client.pollJobUntilComplete(jobId);
    assert.equal(completedJob.status, 'COMPLETED');
    assert.equal(completedJob.progress, 100);
    assert.ok(completedJob.completedAt);

    // 3. Download and verify CSV content stream
    const csvContent = await client.downloadJobFile(jobId);
    assert.ok(csvContent.includes('InvoiceNumber,CustomerName,CustomerEmail,Status,Currency,TotalAmount,CreatedAt'));
    assert.ok(csvContent.includes('Acme Global Corp'));
  });
});
