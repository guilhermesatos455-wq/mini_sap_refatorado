/**
 * Utilitário de Backup com File System Access API e Web Crypto API (AES-256)
 */

// Função auxiliar para derivar chave AES-GCM a partir de uma senha de texto
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

/**
 * Criptografa dados usando AES-GCM com uma senha mestre.
 */
export async function encryptData(data: string, password: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(data)
  );

  // Combina salt (16 bytes) + iv (12 bytes) + dados criptografados
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

  return combined.buffer;
}

/**
 * Salva um arquivo de backup (JSON ou CSV) localmente usando a File System Access API.
 * Se a senha for fornecida, o arquivo é criptografado com AES-256 antes da gravação.
 */
export async function saveBackupLocally(
  data: object | string,
  fileName: string = 'sap_audit_backup.json',
  encryptionPassword?: string
): Promise<boolean> {
  try {
    const rawString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    let fileContent: ArrayBuffer | string = rawString;
    let finalFileName = fileName;

    if (encryptionPassword && encryptionPassword.trim().length > 0) {
      fileContent = await encryptData(rawString, encryptionPassword);
      if (!finalFileName.endsWith('.enc')) {
        finalFileName = `${finalFileName}.enc`;
      }
    }

    // Verifica suporte à File System Access API
    if ('showSaveFilePicker' in window) {
      const options = {
        suggestedName: finalFileName,
        types: [
          {
            description: encryptionPassword ? 'Arquivo Criptografado SAP (.enc)' : 'Arquivo de Dados SAP',
            accept: {
              'application/octet-stream': encryptionPassword ? ['.enc'] : ['.json', '.csv']
            }
          }
        ]
      };

      const handle = await (window as any).showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(fileContent);
      await writable.close();
      return true;
    } else {
      // Fallback para navegadores sem suporte à File System Access API
      const blob = new Blob([fileContent], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Erro ao salvar backup local:', error);
      throw error;
    }
    return false; // Usuário cancelou o seletor de arquivo
  }
}
