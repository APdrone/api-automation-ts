import axios from 'axios';

export interface IAuthStrategy {
  getAuthHeader(baseUrl: string): Promise<string>;
  getRoleName(): string;
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
      const res = await axios.post(`${baseUrl}/api/auth/login`, {
        email: this.email,
        password: this.password,
      });
      this.cachedToken = res.data.token;
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
