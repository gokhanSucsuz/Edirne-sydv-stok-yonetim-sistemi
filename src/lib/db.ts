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

export interface Item {
  id?: number;
  unit: UnitType;
  name: string;
  measurementUnit: string;
  currentStock: number;
  createdAt: number;
}

export interface Transaction {
  id?: number;
  itemId: number;
  unit: UnitType;
  type: TransactionType;
  quantity: number;
  date: number;
  personnelId: number;
  description: string;
  documentNo: string;
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
}

const DB_NAME = 'edirne-sydv-stok-db';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<SydvDB>> {
  return openDB<SydvDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('personnel')) {
        const personnelStore = db.createObjectStore('personnel', { keyPath: 'id', autoIncrement: true });
        personnelStore.createIndex('by-name', 'name');
      }
      if (!db.objectStoreNames.contains('items')) {
        const itemStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
        itemStore.createIndex('by-unit', 'unit');
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        txStore.createIndex('by-item', 'itemId');
        txStore.createIndex('by-unit', 'unit');
        txStore.createIndex('by-date', 'date');
        txStore.createIndex('by-personnel', 'personnelId');
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

export async function addTransaction(tx: Omit<Transaction, 'id'>) {
  const db = await initDB();
  
  // Start a transaction to update both item stock and add transaction record
  const txDb = db.transaction(['items', 'transactions'], 'readwrite');
  const itemStore = txDb.objectStore('items');
  const txStore = txDb.objectStore('transactions');

  const item = await itemStore.get(tx.itemId);
  if (!item) throw new Error('Item not found');

  if (tx.type === 'GİRİŞ') {
    item.currentStock += tx.quantity;
  } else if (tx.type === 'ÇIKIŞ') {
    if (item.currentStock < tx.quantity) {
      throw new Error('Yetersiz stok!');
    }
    item.currentStock -= tx.quantity;
  }

  await itemStore.put(item);
  await txStore.add(tx);
  await txDb.done;
}
