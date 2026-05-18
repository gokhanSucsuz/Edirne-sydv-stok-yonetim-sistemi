import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/lib/models/Transaction';
import Item from '@/lib/models/Item';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const unit = searchParams.get('unit');
    const documentNo = searchParams.get('documentNo');
    
    if (documentNo) {
      const exists = await Transaction.findOne({ documentNo }).lean();
      return NextResponse.json({ exists: !!exists });
    }
    
    let query = {};
    if (unit) {
      query = { unit };
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1 }).lean();
    const formatted = transactions.map((tx: any) => ({
      ...tx,
      id: tx._id.toString(),
      _id: undefined,
    }));
    
    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await connectToDatabase();
    const txData = await request.json();
    
    const item = await Item.findById(txData.itemId).session(session);
    if (!item) throw new Error('Item not found');
    
    const needsTender = ['Vefa Temizlik', 'Aşevi', 'Dergah'].includes(item.unit);
    
    if (txData.type === 'GİRİŞ') {
      if (needsTender && item.tenderLimit) {
        const totalReceived = item.totalReceived || 0;
        if (totalReceived + txData.quantity > item.tenderLimit) {
          throw new Error(`İhale limitini aşamazsınız! Bu ihale kapsamında toplam ${totalReceived} birim alındı. Kalan limit: ${item.tenderLimit - totalReceived}.`);
        }
      }
      
      const newStock = item.currentStock + txData.quantity;
      const newTotalReceived = (item.totalReceived || 0) + txData.quantity;
      
      item.currentStock = newStock;
      item.totalReceived = newTotalReceived;
      await item.save({ session });
      
      const newTx = await Transaction.create([{ ...txData, remainingStock: newStock }], { session });
      
      await session.commitTransaction();
      session.endSession();
      
      return NextResponse.json({ id: newTx[0]._id.toString() }, { status: 201 });
      
    } else {
      // FIFO logic
      const sameNameItems = await Item.find({ 
        unit: item.unit, 
        name: item.name,
        currentStock: { $gt: 0 } 
      }).sort({ createdAt: 1 }).session(session);
      
      if (sameNameItems.length === 0) throw new Error('Stok bitti! İşlem yapılamaz.');
      
      const totalAvailable = sameNameItems.reduce((acc, i) => acc + i.currentStock, 0);
      if (totalAvailable < txData.quantity) throw new Error('Yetersiz toplam stok!');
      
      const oldestItem = sameNameItems[0];
      if (item._id.toString() !== oldestItem._id.toString()) {
        throw new Error(`FIFO Kuralı: En eski tarihli ihaledeki (${oldestItem.tenderName}) stok bitmeden bu ihaleden çıkış yapılamaz.`);
      }
      
      const newStock = item.currentStock - txData.quantity;
      item.currentStock = newStock;
      await item.save({ session });
      
      const newTx = await Transaction.create([{ ...txData, remainingStock: newStock }], { session });
      
      await session.commitTransaction();
      session.endSession();
      
      return NextResponse.json({ id: newTx[0]._id.toString() }, { status: 201 });
    }
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
