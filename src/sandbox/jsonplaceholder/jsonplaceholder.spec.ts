import { test, describe } from 'node:test';
import assert from 'node:assert';
import { JsonPlaceholderClient } from './jsonPlaceholderClient.js';
import { DataGenerator } from '@script-crux/core-shared';

describe('Sandbox: JSONPlaceholder REST Verification', () => {
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
