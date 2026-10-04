import { BaseAxiosClient } from '@script-crux/adapter-axios';
import { AsyncJobResponse } from '../billPulseClient.js';

export class DirectReportingServiceClient extends BaseAxiosClient {
  constructor(baseUrl = 'http://localhost:4005') {
    super({
      baseUrl,
      apiTimeout: 4000,
      maxRetries: 1,
    });
  }

  public async triggerExportJob(): Promise<{ jobId: string; status: string; pollUrl: string }> {
    return this.post<{ jobId: string; status: string; pollUrl: string }>('/jobs/export-invoices');
  }

  public async getJobStatus(jobId: string): Promise<AsyncJobResponse> {
    return this.get<AsyncJobResponse>(`/jobs/${jobId}`);
  }

  public async getHealth(): Promise<{ service: string; status: string; totalJobs: number }> {
    return this.get<{ service: string; status: string; totalJobs: number }>('/health');
  }
}
