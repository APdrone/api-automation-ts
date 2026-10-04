import { test, describe } from 'node:test';
import assert from 'node:assert';
import { JsonPlaceholderClient } from '../clients/jsonPlaceholderClient.js';
import { DataGenerator } from '@script-crux/core-shared';

describe('POST Posts API Tests', () => {
  const client = new JsonPlaceholderClient();

  test('should create a new post with generated user context', async () => {
    const fakeUser = DataGenerator.generateUser();

    const createdPost = await client.createPost({
      title: `Automated Test Post by ${fakeUser.userName}`,
      body: `Testing core framework data flow for ${fakeUser.email}`,
      userId: 1,
    });

    assert.ok(createdPost.id, 'Created post should have an ID assigned');
    assert.strictEqual(createdPost.userId, 1);
    assert.ok(createdPost.title.includes(fakeUser.userName));
  });
});
