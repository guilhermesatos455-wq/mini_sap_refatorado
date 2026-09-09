import Dexie, { type Table } from 'dexie';

export interface AuditRecord {
  id?: number;
  datasetName: string;
  material: string;
  centro: string;
  quantidade: number;
  valorTotal: number;
  status?: string;
  dataMovimento: string;
}

class AuditDexieDatabase extends Dexie {
  records!: Table<AuditRecord, number>;

  constructor() {
    super('MiniSapAuditDB');
    this.version(1).stores({
      records: '++id, datasetName, material, centro, status'
    });
  }
}

export const db = new AuditDexieDatabase();
