import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ConfigManager,
  EnvValidator,
  EnvValidationError,
  DisposableEntityManager
} from '@script-crux/core-shared';
import { BillPulseClient } from '../clients/billPulseClient.js';
import { InvoiceFactory } from '../factories/invoice.factory.js';

describe('Core-Lib: Environment Config Validation & Disposable Entity Manager', () => {
  describe('Schema-Driven Environment Validation', () => {
    it('should successfully parse valid environment configurations with type coercion', () => {
      const mockEnv = {
        APP_URL: 'http://localhost:4000',
        MAX_RETRIES: '3',
        ENABLE_TRACING: 'true'
      };

      const config = ConfigManager.getValidatedConfig(
        {
          APP_URL: { required: true, type: 'string' },
          MAX_RETRIES: { required: false, default: 2, type: 'number' },
          ENABLE_TRACING: { required: false, default: true, type: 'boolean' },
          OPTIONAL_TIMEOUT: { required: false, default: 5000, type: 'number' }
        },
        mockEnv
      );

      assert.strictEqual(config.APP_URL, 'http://localhost:4000');
      assert.strictEqual(config.MAX_RETRIES, 3);
      assert.strictEqual(config.ENABLE_TRACING, true);
      assert.strictEqual(config.OPTIONAL_TIMEOUT, 5000);
    });

    it('should throw EnvValidationError when mandatory variables are missing', () => {
      assert.throws(
        () => {
          EnvValidator.validateAndParse(
            {
              MANDATORY_SECRET_KEY: { required: true, type: 'string' }
            },
            {}
          );
        },
        (err: Error) => {
          assert.ok(err instanceof EnvValidationError);
          assert.ok((err as EnvValidationError).missingVars.includes('MANDATORY_SECRET_KEY'));
          return true;
        }
      );
    });
  });

  describe('Disposable Entity Manager Lifecycle Teardown', () => {
    const client = new BillPulseClient({ baseUrl: 'http://localhost:4000' });

    it('should register and execute LIFO cleanup teardown handlers for created entities', async () => {
      const manager = new DisposableEntityManager();
      const cleanupLogs: string[] = [];

      // 1. Create Invoice and register for cleanup
      const payload = InvoiceFactory.createStandardInvoice();
      const created = await client.createInvoice(payload);

      manager.register('InvoiceEntity', created.id, async (id) => {
        cleanupLogs.push(`Cleaned up invoice ${id}`);
      });

      manager.registerCallback('TemporarySession', () => {
        cleanupLogs.push('Cleaned up session');
      });

      assert.strictEqual(manager.getPendingCount(), 2);

      // Execute LIFO Cleanup
      await manager.cleanupAll();

      assert.strictEqual(manager.getPendingCount(), 0);
      assert.deepStrictEqual(cleanupLogs, [
        'Cleaned up session',
        `Cleaned up invoice ${created.id}`
      ]);
    });
  });
});
