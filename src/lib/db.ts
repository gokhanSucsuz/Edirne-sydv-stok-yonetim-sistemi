import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { encryptData, decryptData } from './encryption';

export type UnitType = 'Vefa Temizlik' | 'Aşevi' | 'Dergah' | 'Bağış' | 'Vakıf';
export type TransactionType = 'GİRİŞ' | 'ÇIKIŞ';

export interface Personnel {
  id?: string;
  name: string;
  title: string;
  tcNo?: string; // Encrypted
  password?: string; // Encrypted
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

// Personnel API
export async function getPersonnel() {
  const querySnapshot = await getDocs(collection(db, 'personnel'));
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as Personnel;
    return {
      ...data,
      id: doc.id,
      tcNo: data.tcNo ? decryptData(data.tcNo) : undefined,
      password: data.password ? decryptData(data.password) : undefined
    };
  });
}

export async function addPersonnel(personnel: Omit<Personnel, 'id' | 'createdAt'>) {
  const data = {
    ...personnel,
    tcNo: personnel.tcNo ? encryptData(personnel.tcNo) : undefined,
    password: personnel.password ? encryptData(personnel.password) : undefined,
    createdAt: Date.now()
  };
  const docRef = await addDoc(collection(db, 'personnel'), data);
  return docRef.id;
}

export async function updatePersonnel(personnel: Personnel) {
  if (!personnel.id) return;
  const personnelRef = doc(db, 'personnel', personnel.id);
  const data = { ...personnel };
  delete data.id;
  if (data.tcNo) data.tcNo = encryptData(data.tcNo);
  return updateDoc(personnelRef, data as any);
}

export async function deletePersonnel(id: string) {
  return deleteDoc(doc(db, 'personnel', id));
}

// Items API
export async function getItemsByUnit(unit: UnitType) {
  const q = query(collection(db, 'items'), where('unit', '==', unit));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Item));
}

export async function getAllItems() {
  const querySnapshot = await getDocs(collection(db, 'items'));
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Item));
}

export async function addItem(item: Omit<Item, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'items'), { ...item, createdAt: Date.now() });
  return docRef.id;
}

export async function updateItem(item: Item) {
  if (!item.id) return;
  const itemRef = doc(db, 'items', item.id);
  const data = { ...item };
  delete data.id;
  return updateDoc(itemRef, data as any);
}

export async function deleteItem(id: string) {
  return deleteDoc(doc(db, 'items', id));
}

// Transactions API
export async function getTransactionsByUnit(unit: UnitType) {
  const q = query(collection(db, 'transactions'), where('unit', '==', unit), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
}

export async function getAllTransactions() {
  const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
}

export async function addTransaction(tx: Omit<Transaction, 'id' | 'remainingStock'>) {
  return runTransaction(db, async (transaction) => {
    const itemRef = doc(db, 'items', tx.itemId);
    const itemDoc = await transaction.get(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error("Item not found");
    }

    const item = itemDoc.data() as Item;
    const needsTender = ['Vefa Temizlik', 'Aşevi', 'Dergah'].includes(item.unit);

    if (tx.type === 'GİRİŞ') {
      if (needsTender && item.tenderLimit) {
        const totalReceived = item.totalReceived || 0;
        if (totalReceived + tx.quantity > item.tenderLimit) {
          throw new Error(`İhale limitini aşamazsınız! Bu ihale kapsamında toplam ${totalReceived} birim alındı. Kalan limit: ${item.tenderLimit - totalReceived}.`);
        }
      }
      const newStock = item.currentStock + tx.quantity;
      const newTotalReceived = (item.totalReceived || 0) + tx.quantity;
      
      transaction.update(itemRef, { 
        currentStock: newStock,
        totalReceived: newTotalReceived
      });

      const txRef = doc(collection(db, 'transactions'));
      transaction.set(txRef, { ...tx, remainingStock: newStock });
      return txRef.id;
    } else {
      // FIFO Logic
      const q = query(
        collection(db, 'items'), 
        where('unit', '==', item.unit), 
        where('name', '==', item.name),
        orderBy('createdAt', 'asc')
      );
      const sameNameSnapshot = await getDocs(q);
      const sameNameItems = sameNameSnapshot.docs
        .map(d => ({ ...d.data(), id: d.id } as Item))
        .filter(i => i.currentStock > 0);

      if (sameNameItems.length === 0) {
        throw new Error('Stok bitti! İşlem yapılamaz.');
      }

      const totalAvailable = sameNameItems.reduce((acc, i) => acc + i.currentStock, 0);
      if (totalAvailable < tx.quantity) {
        throw new Error('Yetersiz toplam stok!');
      }

      const oldestItem = sameNameItems[0];
      if (itemDoc.id !== oldestItem.id) {
        throw new Error(`FIFO Kuralı: En eski tarihli ihaledeki (${oldestItem.tenderName}) stok bitmeden bu ihaleden çıkış yapılamaz.`);
      }

      const newStock = item.currentStock - tx.quantity;
      transaction.update(itemRef, { currentStock: newStock });

      const txRef = doc(collection(db, 'transactions'));
      transaction.set(txRef, { ...tx, remainingStock: newStock });
      return txRef.id;
    }
  });
}

// Master Items API
export async function getMasterItems() {
  const querySnapshot = await getDocs(collection(db, 'masterItems'));
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MasterItem));
}

export async function addMasterItem(item: Omit<MasterItem, 'id' | 'createdAt'>) {
  return addDoc(collection(db, 'masterItems'), { ...item, createdAt: Date.now() });
}

export async function bulkAddMasterItems(items: Omit<MasterItem, 'id' | 'createdAt'>[]) {
  const batch = [];
  for (const item of items) {
    batch.push(addDoc(collection(db, 'masterItems'), { ...item, createdAt: Date.now() }));
  }
  return Promise.all(batch);
}

export async function deleteMasterItem(id: string) {
  return deleteDoc(doc(db, 'masterItems', id));
}

export async function checkDocumentNoExists(documentNo: string) {
  const q = query(collection(db, 'transactions'), where('documentNo', '==', documentNo), limit(1));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

export function generateUniqueDocNo(prefix: string = 'EVR') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Backup API
export async function getBackups() {
  const q = query(collection(db, 'backups'), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }));
}

export async function addBackupRecord(backup: any) {
  return await addDoc(collection(db, 'backups'), {
    ...backup,
    createdAt: serverTimestamp()
  });
}

export async function getAllDataForBackup() {
  const collections = ['personnel', 'inventory', 'stockHistory', 'backups', 'transactions', 'masterItems'];
  const allData: any = {};
  
  for (const coll of collections) {
    const snap = await getDocs(collection(db, coll));
    allData[coll] = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  }
  
  return allData;
}
