import { BaseAxiosClient } from '@script-crux/adapter-axios';

export interface AuthLoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
  };
}

export interface AuthVerifyResponse {
  valid: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
  };
}

export class DirectAuthServiceClient extends BaseAxiosClient {
  constructor(baseUrl = 'http://localhost:4001') {
    super({
      baseUrl,
      apiTimeout: 4000,
      maxRetries: 1,
    });
  }

  public async login(email: string, password: string): Promise<AuthLoginResponse> {
    return this.post<AuthLoginResponse>('/auth/login', { email, password });
  }

  public async verifyToken(token: string): Promise<AuthVerifyResponse> {
    return this.post<AuthVerifyResponse>('/auth/verify', { token });
  }

  public async getHealth(): Promise<{ service: string; status: string; port: number | string }> {
    return this.get<{ service: string; status: string; port: number | string }>('/health');
  }
}
