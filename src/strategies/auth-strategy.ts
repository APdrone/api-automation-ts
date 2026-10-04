import { BaseAxiosClient } from '@script-crux/adapter-axios';
import { TestLogger } from '@script-crux/core-shared';

export interface IAuthStrategy {
  getAuthHeader(baseUrl: string): Promise<string>;
  getRoleName(): string;
}

class InternalAuthClient extends BaseAxiosClient {
  constructor(baseUrl: string) {
    super({
      baseUrl,
      apiTimeout: 5000,
      maxRetries: 2,
    });
  }

  public async requestToken(email: string, pass: string): Promise<string> {
    const res = await this.post<{ token: string }>('/api/auth/login', {
      email,
      password: pass,
    });
    return res.token;
  }
}

export class BearerTokenAuthStrategy implements IAuthStrategy {
  private cachedToken: string | null = null;

  constructor(
    private readonly email: string,
    private readonly password: string = 'Password123!',
    private readonly roleName: string = 'USER'
  ) {}

  public async getAuthHeader(baseUrl: string): Promise<string> {
    if (!this.cachedToken) {
      TestLogger.info(`[AuthStrategy] Minting token via BaseAxiosClient for persona [${this.roleName}]`);
      const client = new InternalAuthClient(baseUrl);
      this.cachedToken = await client.requestToken(this.email, this.password);
    }
    return `Bearer ${this.cachedToken}`;
  }

  public getRoleName(): string {
    return this.roleName;
  }
}

export class AuthStrategies {
  public static admin(): IAuthStrategy {
    return new BearerTokenAuthStrategy('admin@billpulse.io', 'Password123!', 'ADMIN');
  }

  public static manager(): IAuthStrategy {
    return new BearerTokenAuthStrategy('manager@billpulse.io', 'Password123!', 'MANAGER');
  }

  public static viewer(): IAuthStrategy {
    return new BearerTokenAuthStrategy('viewer@billpulse.io', 'Password123!', 'VIEWER');
  }

  public static anonymous(): IAuthStrategy {
    return {
      async getAuthHeader() {
        return '';
      },
      getRoleName() {
        return 'ANONYMOUS';
      },
    };
  }
}
