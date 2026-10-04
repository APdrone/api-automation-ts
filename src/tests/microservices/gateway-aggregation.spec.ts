import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TestingControlClient } from '../../clients/testingClient.js';

describe('Microservices: API Gateway Aggregation & Cluster Topology', () => {
  const gatewayClient = new TestingControlClient('http://localhost:4000');

  it('should return aggregated healthy status for all 5 underlying microservices', async () => {
    const health = await gatewayClient.getHealth();

    assert.equal(health.status, undefined); // gateway uses 'gateway: healthy'
    const fullResp = health as unknown as {
      gateway: string;
      services: Record<string, string>;
    };

    assert.equal(fullResp.gateway, 'healthy');
    assert.equal(fullResp.services.auth, 'healthy');
    assert.equal(fullResp.services.billing, 'healthy');
    assert.equal(fullResp.services.payment, 'healthy');
    assert.equal(fullResp.services.notification, 'healthy');
    assert.equal(fullResp.services.reporting, 'healthy');
  });
});
