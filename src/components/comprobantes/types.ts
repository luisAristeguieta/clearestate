export interface InvoiceDraft {
  purchaseOrderId: string;
  issuerName: string;
  issuerTaxId: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  pdfFileName: string;
  authorizationCode: string;
  issueDate: string;
}
