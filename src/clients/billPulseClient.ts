import { BaseAxiosClient, HttpClientEnvConfig } from '@script-crux/adapter-axios';
import { IAuthStrategy, AuthStrategies } from '../strategies/auth-strategy.js';
import { CreateInvoicePayload } from '../builders/invoice-payload.builder.js';

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ id: string; description: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  taxRatePercentage: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'DRAFT' | 'PENDING' | 'PROCESSING' | 'PAID' | 'VOID';
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface InvoicesListResponse {
  data: InvoiceResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AsyncJobResponse {
  id: string;
  type: string;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  resultUrl?: string;
  completedAt?: string;
}

export class BillPulseClient extends BaseAxiosClient {
  private baseUrl: string;
  private authStrategy: IAuthStrategy;

  constructor(
    config?: Partial<HttpClientEnvConfig>,
    authStrategy: IAuthStrategy = AuthStrategies.admin()
  ) {
    const baseUrl = config?.baseUrl || 'http://localhost:4000';
    super({
      baseUrl,
      apiTimeout: config?.apiTimeout || 8000,
      maxRetries: config?.maxRetries ?? 2,
      retryDelayMs: config?.retryDelayMs ?? 500,
    });
    this.baseUrl = baseUrl;
    this.authStrategy = authStrategy;
  }

  public setAuthStrategy(strategy: IAuthStrategy): void {
    this.authStrategy = strategy;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const authHeader = await this.authStrategy.getAuthHeader(this.baseUrl);
    return authHeader ? { Authorization: authHeader } : {};
  }

  // Invoice APIs
  public async getInvoices(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<InvoicesListResponse> {
    const headers = await this.getHeaders();
    return this.get<InvoicesListResponse>('/api/invoices', { headers, params });
  }

  public async getInvoiceById(id: string): Promise<InvoiceResponse> {
    const headers = await this.getHeaders();
    return this.get<InvoiceResponse>(`/api/invoices/${id}`, { headers });
  }

  public async createInvoice(payload: CreateInvoicePayload): Promise<InvoiceResponse> {
    const headers = await this.getHeaders();
    return this.post<InvoiceResponse>('/api/invoices', payload, { headers });
  }

  public async submitInvoice(id: string): Promise<InvoiceResponse> {
    const headers = await this.getHeaders();
    return this.post<InvoiceResponse>(`/api/invoices/${id}/submit`, {}, { headers });
  }

  public async payInvoice(id: string): Promise<{ message: string; invoice: InvoiceResponse }> {
    const headers = await this.getHeaders();
    return this.post<{ message: string; invoice: InvoiceResponse }>(`/api/invoices/${id}/pay`, {}, { headers });
  }

  public async voidInvoice(id: string): Promise<InvoiceResponse> {
    const headers = await this.getHeaders();
    return this.post<InvoiceResponse>(`/api/invoices/${id}/void`, {}, { headers });
  }

  // Async Jobs & Polling APIs
  public async triggerExportCsvJob(): Promise<{ jobId: string; status: string; pollUrl: string }> {
    const headers = await this.getHeaders();
    return this.post<{ jobId: string; status: string; pollUrl: string }>('/api/jobs/export-invoices', {}, { headers });
  }

  public async getJobStatus(jobId: string): Promise<AsyncJobResponse> {
    const headers = await this.getHeaders();
    return this.get<AsyncJobResponse>(`/api/jobs/${jobId}`, { headers });
  }

  public async downloadJobFile(jobId: string): Promise<string> {
    const headers = await this.getHeaders();
    return this.get<string>(`/api/jobs/${jobId}/download`, {
      headers,
      responseType: 'text' as unknown as undefined,
    });
  }

  /**
   * Helper Polling method demonstrating async polling validation pattern
   */
  public async pollJobUntilComplete(jobId: string, maxAttempts = 15, delayMs = 300): Promise<AsyncJobResponse> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const job = await this.getJobStatus(jobId);
      if (job.status === 'COMPLETED') {
        return job;
      }
      if (job.status === 'FAILED') {
        throw new Error(`Job ${jobId} failed during execution`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error(`Job ${jobId} did not complete within timeout`);
  }
}
