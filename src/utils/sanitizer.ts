// Utility for Data Sanitization and XSS Prevention

/**
 * Sanitizes input string to prevent XSS attacks by removing HTML tags and dangerous characters.
 */
export function sanitizeInput(input: any): any {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags, script tags, event handlers, etc.
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, ''); // Strip all HTML tags

  // Encode dangerous characters if needed
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized.trim();
}

/**
 * Validates and sanitizes cell values based on column field type in the SAP Audit grid.
 */
export function validateAndSanitizeCell(field: string, value: any): { isValid: boolean; sanitizedValue: any; error?: string } {
  if (value === null || value === undefined) {
    return { isValid: true, sanitizedValue: '' };
  }

  if (typeof value === 'string') {
    // Check for XSS attempt signatures before sanitizing
    if (/<script|javascript:|onerror=|onload=/i.test(value)) {
      return {
        isValid: false,
        sanitizedValue: '',
        error: 'Tentativa de Injeção XSS detectada e bloqueada.'
      };
    }
  }

  switch (field) {
    case 'quantidade':
    case 'precoUnitario': {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          isValid: false,
          sanitizedValue: 0,
          error: `O campo ${field} deve ser um número válido.`
        };
      }
      if (num < 0) {
        return {
          isValid: false,
          sanitizedValue: 0,
          error: `O campo ${field} não pode ser negativo.`
        };
      }
      return { isValid: true, sanitizedValue: num };
    }

    case 'material':
    case 'centro':
    case 'descricao':
    default: {
      const sanitized = sanitizeInput(String(value));
      return { isValid: true, sanitizedValue: sanitized };
    }
  }
}
