import { BaseAxiosClient } from '@script-crux/adapter-axios';

export class TestingControlClient extends BaseAxiosClient {
  constructor(baseUrl = 'http://localhost:4000') {
    super({
      baseUrl,
      apiTimeout: 5000,
      maxRetries: 1,
    });
  }

  public async resetDatabase(): Promise<{ status: string; message: string }> {
    return this.post<{ status: string; message: string }>('/api/testing/reset');
  }

  public async getHealth(): Promise<{ status: string; uptime: number; activeClients: number }> {
    return this.get<{ status: string; uptime: number; activeClients: number }>('/api/testing/health');
  }
}
