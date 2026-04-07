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
  tenderName?: string;
  tenderEndDate?: number;
  tenderLimit?: number;
  tenderType?: 'İhale' | 'Bağış';
  tenderHistory?: TenderHistory[];
  previousTenderStock?: number;
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
  if (needsTender && (!item.tenderName || !item.tenderLimit)) {
    throw new Error('İhale bilgisi girilmeden stok işlemi yapılamaz.');
  }

  if (tx.type === 'GİRİŞ') {
    if (needsTender && item.tenderLimit) {
      const currentTenderStock = item.currentStock - (item.previousTenderStock || 0);
      if (currentTenderStock + tx.quantity > item.tenderLimit) {
        throw new Error(`İhale limitini aşamazsınız! Maksimum eklenebilecek miktar: ${item.tenderLimit - currentTenderStock}. Yeni ihale yapılması gerekmektedir.`);
      }
    }
    item.currentStock += tx.quantity;
  } else if (tx.type === 'ÇIKIŞ') {
    if (item.currentStock === 0) {
      throw new Error('Stok bitti! İşlem yapılamaz.');
    }
    if (item.currentStock < tx.quantity) {
      throw new Error('Yetersiz stok!');
    }
    
    if (item.previousTenderStock && item.previousTenderStock > 0) {
      if (tx.quantity <= item.previousTenderStock) {
        item.previousTenderStock -= tx.quantity;
      } else {
        item.previousTenderStock = 0;
      }
    }

    item.currentStock -= tx.quantity;
  }

  await itemStore.put(item);
  const txId = await txStore.add({ ...tx, remainingStock: item.currentStock });
  await txDb.done;
  return txId;
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
