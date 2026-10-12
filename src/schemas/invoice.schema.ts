/**
 * Response schema validation functions and interfaces for BillPulse API contracts.
 */

export interface ValidatedInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalAmount: number;
}

export function validateInvoiceResponse(data: any): ValidatedInvoice {
  if (!data || typeof data !== 'object') {
    throw new Error('Payload must be a non-null object');
  }

  if (typeof data.id !== 'string' || !data.id.trim()) {
    throw new Error('Field "id" is mandatory and must be a non-empty string');
  }

  if (typeof data.invoiceNumber !== 'string' || !data.invoiceNumber.trim()) {
    throw new Error('Field "invoiceNumber" is mandatory and must be a non-empty string');
  }

  if (typeof data.customerName !== 'string') {
    throw new Error('Field "customerName" is mandatory and must be a string');
  }

  if (typeof data.totalAmount !== 'number' || isNaN(data.totalAmount)) {
    throw new Error('Field "totalAmount" is mandatory and must be a valid number');
  }

  return data as ValidatedInvoice;
}

export function validateInvoiceListResponse(data: any): { data: ValidatedInvoice[]; total?: number } {
  if (!data || !Array.isArray(data.data)) {
    throw new Error('Invoice list payload must contain a "data" array');
  }
  return data;
}
