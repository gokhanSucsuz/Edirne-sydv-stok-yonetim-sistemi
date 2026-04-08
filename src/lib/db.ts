import { openDB, DBSchema, IDBPDatabase } from 'idb';

export type UnitType = 'Vefa Temizlik' | 'Aşevi' | 'Dergah' | 'Bağış' | 'Vakıf';
export type TransactionType = 'GİRİŞ' | 'ÇIKIŞ';

export interface Personnel {
  id?: number;
  name: string;
  title: string;
  tcNo?: string;
  createdAt: number;
}

export interface TenderHistory {
  date: number;
  personnelId: number;
  personnelName: string;
  changes: string;
}

export interface Item {
  id?: number;
  unit: UnitType;
  name: string;
  measurementUnit: string;
  currentStock: number;
  createdAt: number;
  tenderId?: string; // Unique ID for the tender
  tenderName?: string;
  tenderEndDate?: number;
  tenderLimit?: number;
  tenderType?: 'İhale' | 'Bağış';
  tenderHistory?: TenderHistory[];
  previousTenderStock?: number;
  totalReceived?: number;
}

export interface Transaction {
  id?: number;
  itemId: number;
  unit: UnitType;
  type: TransactionType;
  quantity: number;
  remainingStock: number;
  date: number;
  personnelId: number;
  description: string;
  documentNo: string;
}

export interface MasterItem {
  id?: number;
  name: string;
  measurementUnit: string;
  createdAt: number;
}

interface SydvDB extends DBSchema {
  personnel: {
    key: number;
    value: Personnel;
    indexes: { 'by-name': string };
  };
  items: {
    key: number;
    value: Item;
    indexes: { 'by-unit': string };
  };
  transactions: {
    key: number;
    value: Transaction;
    indexes: { 
      'by-item': number;
      'by-unit': string;
      'by-date': number;
      'by-personnel': number;
    };
  };
  masterItems: {
    key: number;
    value: MasterItem;
    indexes: { 'by-name': string };
  };
}

const DB_NAME = 'edirne-sydv-stok-db';
const DB_VERSION = 2;

export async function initDB(): Promise<IDBPDatabase<SydvDB>> {
  return openDB<SydvDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const personnelStore = db.createObjectStore('personnel', { keyPath: 'id', autoIncrement: true });
        personnelStore.createIndex('by-name', 'name');

        const itemStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
        itemStore.createIndex('by-unit', 'unit');

        const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        txStore.createIndex('by-item', 'itemId');
        txStore.createIndex('by-unit', 'unit');
        txStore.createIndex('by-date', 'date');
        txStore.createIndex('by-personnel', 'personnelId');
      }
      
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('masterItems')) {
          const masterItemStore = db.createObjectStore('masterItems', { keyPath: 'id', autoIncrement: true });
          masterItemStore.createIndex('by-name', 'name');
        }
      }
    },
  });
}

// Personnel API
export async function getPersonnel() {
  const db = await initDB();
  return db.getAll('personnel');
}

export async function addPersonnel(personnel: Omit<Personnel, 'id' | 'createdAt'>) {
  const db = await initDB();
  return db.add('personnel', { ...personnel, createdAt: Date.now() });
}

export async function updatePersonnel(personnel: Personnel) {
  const db = await initDB();
  return db.put('personnel', personnel);
}

export async function deletePersonnel(id: number) {
  const db = await initDB();
  return db.delete('personnel', id);
}

// Items API
export async function getItemsByUnit(unit: UnitType) {
  const db = await initDB();
  return db.getAllFromIndex('items', 'by-unit', unit);
}

export async function getAllItems() {
  const db = await initDB();
  return db.getAll('items');
}

export async function addItem(item: Omit<Item, 'id' | 'createdAt'>) {
  const db = await initDB();
  return db.add('items', { ...item, createdAt: Date.now() });
}

export async function updateItem(item: Item) {
  const db = await initDB();
  return db.put('items', item);
}

export async function deleteItem(id: number) {
  const db = await initDB();
  return db.delete('items', id);
}

// Transactions API
export async function getTransactionsByUnit(unit: UnitType) {
  const db = await initDB();
  return db.getAllFromIndex('transactions', 'by-unit', unit);
}

export async function getAllTransactions() {
  const db = await initDB();
  return db.getAll('transactions');
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'remainingStock'>) {
  const db = await initDB();
  
  // Start a transaction to update both item stock and add transaction record
  const txDb = db.transaction(['items', 'transactions'], 'readwrite');
  const itemStore = txDb.objectStore('items');
  const txStore = txDb.objectStore('transactions');

  const item = await itemStore.get(tx.itemId);
  if (!item) throw new Error('Item not found');

  const needsTender = ['Vefa Temizlik', 'Aşevi', 'Dergah'].includes(item.unit);
  
  if (tx.type === 'GİRİŞ') {
    if (needsTender && item.tenderLimit) {
      const totalReceived = item.totalReceived || 0;
      if (totalReceived + tx.quantity > item.tenderLimit) {
        throw new Error(`İhale limitini aşamazsınız! Bu ihale kapsamında toplam ${totalReceived} birim alındı. Kalan limit: ${item.tenderLimit - totalReceived}.`);
      }
    }
    item.currentStock += tx.quantity;
    item.totalReceived = (item.totalReceived || 0) + tx.quantity;
    await itemStore.put(item);
    const txId = await txStore.add({ ...tx, remainingStock: item.currentStock });
    await txDb.done;
    return txId;
  } else if (tx.type === 'ÇIKIŞ') {
    // FIFO Logic: Find all items with the same name in the same unit, sort by createdAt
    const allItems = await itemStore.index('by-unit').getAll(item.unit);
    const sameNameItems = allItems
      .filter(i => i.name === item.name && i.currentStock > 0)
      .sort((a, b) => a.createdAt - b.createdAt);

    if (sameNameItems.length === 0) {
      throw new Error('Stok bitti! İşlem yapılamaz.');
    }

    const totalAvailable = sameNameItems.reduce((acc, i) => acc + i.currentStock, 0);
    if (totalAvailable < tx.quantity) {
      throw new Error('Yetersiz toplam stok!');
    }

    // Check if the requested item is the oldest one
    const oldestItem = sameNameItems[0];
    if (item.id !== oldestItem.id) {
      throw new Error(`FIFO Kuralı: En eski tarihli ihaledeki (${oldestItem.tenderName}) stok bitmeden bu ihaleden çıkış yapılamaz.`);
    }

    item.currentStock -= tx.quantity;
    await itemStore.put(item);
    const txId = await txStore.add({ ...tx, remainingStock: item.currentStock });
    await txDb.done;
    return txId;
  }
  
  await txDb.done;
  return 0;
}

// Master Items API
export async function getMasterItems() {
  const db = await initDB();
  return db.getAll('masterItems');
}

export async function addMasterItem(item: Omit<MasterItem, 'id' | 'createdAt'>) {
  const db = await initDB();
  return db.add('masterItems', { ...item, createdAt: Date.now() });
}

export async function bulkAddMasterItems(items: Omit<MasterItem, 'id' | 'createdAt'>[]) {
  const db = await initDB();
  const tx = db.transaction('masterItems', 'readwrite');
  for (const item of items) {
    tx.store.add({ ...item, createdAt: Date.now() });
  }
  await tx.done;
}

export async function deleteMasterItem(id: number) {
  const db = await initDB();
  return db.delete('masterItems', id);
}

export async function checkDocumentNoExists(documentNo: string) {
  const db = await initDB();
  const txs = await db.getAll('transactions');
  return txs.some(tx => tx.documentNo === documentNo);
}

export function generateUniqueDocNo(prefix: string = 'EVR') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
