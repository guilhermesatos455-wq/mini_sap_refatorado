import axios from 'axios';

export interface AuditEventRecord {
  timestamp: string;
  tenantId: string;
  userEmail: string;
  action: string;
  status: string;
  metadata: string;
}

/**
 * Appends a new audit event to a dedicated Google Sheet tab using GOOGLE_SHEETS_API_KEY
 * and GOOGLE_SHEETS_SPREADSHEET_ID from environment variables.
 */
export async function appendAuditEventToGoogleSheet(event: AuditEventRecord, tabName = 'AuditoriaLogs'): Promise<boolean> {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY || process.env.VITE_GOOGLE_SHEETS_API_KEY || '';
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID || '';

  if (!spreadsheetId) {
    console.warn('[GoogleSheets] GOOGLE_SHEETS_SPREADSHEET_ID not defined in environment.');
    return false;
  }

  if (!apiKey) {
    console.warn('[GoogleSheets] GOOGLE_SHEETS_API_KEY not defined in environment.');
    return false;
  }

  const range = `${tabName}!A:F`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${apiKey}`;

  const body = {
    values: [
      [
        event.timestamp || new Date().toISOString(),
        event.tenantId || 'DEFAULT_TENANT',
        event.userEmail || 'system@minisap.local',
        event.action || 'AUDIT_EVENT',
        event.status || 'SUCCESS',
        event.metadata || '{}'
      ]
    ]
  };

  try {
    const response = await axios.post(url, body);
    console.log('[GoogleSheets] Audit event successfully appended to Google Sheet:', response.data);
    return true;
  } catch (error: any) {
    console.error('[GoogleSheets] Failed to append audit event:', error.response?.data || error.message);
    throw new Error(`Google Sheets API Error: ${error.response?.data?.error?.message || error.message}`);
  }
}
