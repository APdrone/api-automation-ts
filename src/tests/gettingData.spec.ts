import { test, describe } from 'node:test';
import assert from 'node:assert';
import { JsonPlaceholderClient } from '../clients/jsonPlaceholderClient.js';

describe('GET Posts API Tests', () => {
  const client = new JsonPlaceholderClient();

  test('should fetch a single post by ID', async () => {
    const post = await client.getPostById(1);
    assert.strictEqual(post.id, 1);
    assert.ok(post.title, 'Post title should exist');
    assert.ok(post.body, 'Post body should exist');
  });

  test('should fetch posts list', async () => {
    const posts = await client.getPosts();
    assert.ok(Array.isArray(posts), 'Expected array of posts');
    assert.ok(posts.length > 0, 'Posts should not be empty');
  });
});
