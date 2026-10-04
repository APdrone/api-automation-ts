import { BaseAxiosClient } from '@script-crux/adapter-axios';
import { CreateInvoicePayload } from '../../builders/invoice-payload.builder.js';
import { InvoiceResponse, InvoicesListResponse } from '../billPulseClient.js';

export class DirectBillingServiceClient extends BaseAxiosClient {
  constructor(baseUrl = 'http://localhost:4002') {
    super({
      baseUrl,
      apiTimeout: 4000,
      maxRetries: 1,
    });
  }

  public async getInvoices(params?: { status?: string; search?: string }): Promise<InvoicesListResponse> {
    return this.get<InvoicesListResponse>('/invoices', { params });
  }

  public async getInvoiceById(id: string): Promise<InvoiceResponse> {
    return this.get<InvoiceResponse>(`/invoices/${id}`);
  }

  public async createInvoice(payload: CreateInvoicePayload): Promise<InvoiceResponse> {
    return this.post<InvoiceResponse>('/invoices', payload);
  }

  public async submitInvoice(id: string): Promise<InvoiceResponse> {
    return this.post<InvoiceResponse>(`/invoices/${id}/submit`);
  }

  public async payInvoice(id: string): Promise<{ message: string; invoice: InvoiceResponse }> {
    return this.post<{ message: string; invoice: InvoiceResponse }>(`/invoices/${id}/pay`);
  }

  public async voidInvoice(id: string): Promise<InvoiceResponse> {
    return this.post<InvoiceResponse>(`/invoices/${id}/void`);
  }

  public async resetData(): Promise<{ service: string; status: string }> {
    return this.post<{ service: string; status: string }>('/testing/reset');
  }

  public async getHealth(): Promise<{ service: string; status: string; count: number }> {
    return this.get<{ service: string; status: string; count: number }>('/health');
  }
}
