import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DockerDetector,
  PostgresContainerManager,
  RedisContainerManager
} from '@script-crux/core-api';

describe('Core-Lib: Testcontainers & Ephemeral Infrastructure Lifecycle', () => {
  it('should detect Docker daemon status via DockerDetector probe', async () => {
    const isAvailable = await DockerDetector.isDockerAvailable();
    assert.strictEqual(typeof isAvailable, 'boolean');
  });

  it('should spin up and tear down an ephemeral PostgreSQL container instance', async () => {
    const pgContainer = await PostgresContainerManager.start({
      database: 'billpulse_test_db',
      username: 'pulse_admin',
      password: 'SecurePassword123!'
    });

    assert.ok(pgContainer.getHost(), 'Host should be accessible');
    assert.ok(typeof pgContainer.getPort() === 'number', 'Port should be allocated');
    assert.ok(pgContainer.getConnectionUri().includes('postgres://'), 'URI should match postgres protocol');
    assert.ok(pgContainer.getConnectionUri().includes('billpulse_test_db'), 'Database name should be in URI');

    // Clean teardown
    await pgContainer.stop();
  });

  it('should spin up and tear down an ephemeral Redis container instance', async () => {
    const redisContainer = await RedisContainerManager.start({
      port: 6379
    });

    assert.ok(redisContainer.getHost(), 'Redis host should be accessible');
    assert.ok(typeof redisContainer.getPort() === 'number', 'Redis port should be allocated');
    assert.ok(redisContainer.getConnectionUri().includes('redis://'), 'URI should match redis protocol');

    // Clean teardown
    await redisContainer.stop();
  });
});
