import { BaseAxiosClient, HttpClientEnvConfig } from '@script-crux/adapter-axios';

export interface Post {
  id?: number;
  title: string;
  body: string;
  userId: number;
}

export class JsonPlaceholderClient extends BaseAxiosClient {
  constructor(config?: Partial<HttpClientEnvConfig>) {
    super({
      baseUrl: config?.baseUrl || 'https://jsonplaceholder.typicode.com',
      apiTimeout: config?.apiTimeout || 8000,
      maxRetries: config?.maxRetries ?? 2,
      retryDelayMs: config?.retryDelayMs ?? 1000,
    });
  }

  async getPosts(params?: { postId?: number }): Promise<Post[]> {
    return this.get<Post[]>('/posts', { params });
  }

  async getPostById(id: number): Promise<Post> {
    return this.get<Post>(`/posts/${id}`);
  }

  async createPost(post: Omit<Post, 'id'>): Promise<Post> {
    return this.post<Post>('/posts', post);
  }
}
