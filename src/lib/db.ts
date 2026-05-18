export type UnitType = 'Vefa Temizlik' | 'Aşevi' | 'Dergah' | 'Bağış' | 'Vakıf';
export type TransactionType = 'GİRİŞ' | 'ÇIKIŞ';

export interface Personnel {
  id?: string;
  name: string;
  title: string;
  tcNo?: string;
  password?: string;
  email: string;
  createdAt: number;
}

export interface TenderHistory {
  date: number;
  personnelId: string;
  personnelName: string;
  changes: string;
}

export interface Item {
  id?: string;
  unit: UnitType;
  name: string;
  measurementUnit: string;
  currentStock: number;
  createdAt: number;
  tenderId?: string;
  tenderName?: string;
  tenderEndDate?: number;
  tenderLimit?: number;
  tenderType?: 'İhale' | 'Bağış';
  tenderHistory?: TenderHistory[];
  previousTenderStock?: number;
  totalReceived?: number;
}

export interface Transaction {
  id?: string;
  itemId: string;
  unit: UnitType;
  type: TransactionType;
  quantity: number;
  remainingStock: number;
  date: number;
  personnelId: string;
  description: string;
  documentNo: string;
}

export interface MasterItem {
  id?: string;
  name: string;
  measurementUnit: string;
  createdAt: number;
}

export async function getPersonnel(): Promise<Personnel[]> {
  const res = await fetch('/api/personnel');
  if (!res.ok) throw new Error('Personel listesi alınamadı');
  return res.json();
}

export async function addPersonnel(personnel: Omit<Personnel, 'id' | 'createdAt'>): Promise<string> {
  const res = await fetch('/api/personnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(personnel)
  });
  if (!res.ok) throw new Error('Personel eklenemedi');
  const data = await res.json();
  return data.id;
}

export async function updatePersonnel(personnel: Personnel): Promise<void> {
  const res = await fetch(`/api/personnel?id=${personnel.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(personnel)
  });
  if (!res.ok) throw new Error('Personel güncellenemedi');
}

export async function deletePersonnel(id: string): Promise<void> {
  const res = await fetch(`/api/personnel?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Personel silinemedi');
}

export async function getItemsByUnit(unit: UnitType): Promise<Item[]> {
  const res = await fetch(`/api/items?unit=${encodeURIComponent(unit)}`);
  if (!res.ok) throw new Error('Ürünler alınamadı');
  return res.json();
}

export async function getAllItems(): Promise<Item[]> {
  const res = await fetch('/api/items');
  if (!res.ok) throw new Error('Ürünler alınamadı');
  return res.json();
}

export async function addItem(item: Omit<Item, 'id' | 'createdAt'>): Promise<string> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Ürün eklenemedi');
  const data = await res.json();
  return data.id;
}

export async function updateItem(item: Item): Promise<void> {
  const res = await fetch(`/api/items?id=${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Ürün güncellenemedi');
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`/api/items?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Ürün silinemedi');
}

export async function getTransactionsByUnit(unit: UnitType): Promise<Transaction[]> {
  const res = await fetch(`/api/transactions?unit=${encodeURIComponent(unit)}`);
  if (!res.ok) throw new Error('İşlemler alınamadı');
  return res.json();
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const res = await fetch('/api/transactions');
  if (!res.ok) throw new Error('İşlemler alınamadı');
  return res.json();
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'remainingStock'>): Promise<string> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'İşlem başarısız');
  }
  const data = await res.json();
  return data.id;
}

export async function getMasterItems(): Promise<MasterItem[]> {
  const res = await fetch('/api/master-items');
  if (!res.ok) throw new Error('Malzemeler alınamadı');
  return res.json();
}

export async function addMasterItem(item: Omit<MasterItem, 'id' | 'createdAt'>): Promise<string> {
  const res = await fetch('/api/master-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Malzeme eklenemedi');
  const data = await res.json();
  return data.id;
}

export async function bulkAddMasterItems(items: Omit<MasterItem, 'id' | 'createdAt'>[]): Promise<void> {
  const res = await fetch('/api/master-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items)
  });
  if (!res.ok) throw new Error('Malzemeler eklenemedi');
}

export async function deleteMasterItem(id: string): Promise<void> {
  const res = await fetch(`/api/master-items?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Malzeme silinemedi');
}

export async function checkDocumentNoExists(documentNo: string): Promise<boolean> {
  const res = await fetch(`/api/transactions?documentNo=${encodeURIComponent(documentNo)}`);
  if (!res.ok) return false;
  const data = await res.json();
  return data.exists;
}

export function generateUniqueDocNo(prefix: string = 'EVR'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function getBackups(): Promise<any[]> {
  const res = await fetch('/api/backup');
  if (!res.ok) throw new Error('Yedekler alınamadı');
  return res.json();
}

export async function addBackupRecord(backup: any): Promise<string> {
  const res = await fetch('/api/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backup)
  });
  if (!res.ok) throw new Error('Yedek eklenemedi');
  const data = await res.json();
  return data.id;
}

export async function getAllDataForBackup(): Promise<any> {
  const res = await fetch('/api/backup?type=alldata');
  if (!res.ok) throw new Error('Tüm veriler alınamadı');
  return res.json();
}
