import Dexie, { Table } from 'dexie';

export interface Ckm3CacheItem {
  id?: string;
  material: string;
  plant: string;
  period: string;
  standardPrice: number;
  actualPrice: number;
  variance: number;
  updatedAt: string;
}

export interface NfCacheItem {
  id?: string;
  nfNumber: string;
  supplier: string;
  value: number;
  date: string;
  status: string;
  updatedAt: string;
}

export class SapDexieCacheDatabase extends Dexie {
  ckm3!: Table<Ckm3CacheItem, string>;
  nfs!: Table<NfCacheItem, string>;

  constructor() {
    super('SapEnterpriseCacheDB');
    this.version(1).stores({
      ckm3: '++id, material, plant, period',
      nfs: '++id, nfNumber, supplier, date'
    });
  }
}

export const dbCache = new SapDexieCacheDatabase();

export async function cacheCkm3Data(items: Ckm3CacheItem[]): Promise<void> {
  try {
    await dbCache.transaction('rw', dbCache.ckm3, async () => {
      await dbCache.ckm3.clear();
      await dbCache.ckm3.bulkPut(items);
    });
  } catch (err) {
    console.error('[Dexie Cache] Error caching CKM3 data:', err);
  }
}

export async function getCachedCkm3Data(): Promise<Ckm3CacheItem[]> {
  try {
    return await dbCache.ckm3.toArray();
  } catch (err) {
    console.error('[Dexie Cache] Error reading CKM3 cache:', err);
    return [];
  }
}

export async function cacheNfData(items: NfCacheItem[]): Promise<void> {
  try {
    await dbCache.transaction('rw', dbCache.nfs, async () => {
      await dbCache.nfs.clear();
      await dbCache.nfs.bulkPut(items);
    });
  } catch (err) {
    console.error('[Dexie Cache] Error caching NF data:', err);
  }
}

export async function getCachedNfData(): Promise<NfCacheItem[]> {
  try {
    return await dbCache.nfs.toArray();
  } catch (err) {
    console.error('[Dexie Cache] Error reading NF cache:', err);
    return [];
  }
}
