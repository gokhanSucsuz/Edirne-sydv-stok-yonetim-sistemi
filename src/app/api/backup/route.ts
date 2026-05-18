import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Backup from '@/lib/models/Backup';
import Personnel from '@/lib/models/Personnel';
import Item from '@/lib/models/Item';
import Transaction from '@/lib/models/Transaction';
import MasterItem from '@/lib/models/MasterItem';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'alldata') {
      const personnel = await Personnel.find().lean();
      const inventory = await Item.find().lean(); // Items
      const transactions = await Transaction.find().lean();
      const masterItems = await MasterItem.find().lean();
      const backups = await Backup.find().lean();
      
      return NextResponse.json({
        personnel,
        inventory,
        transactions,
        masterItems,
        backups
      });
    }

    const backups = await Backup.find().sort({ createdAt: -1 }).lean();
    
    const formatted = backups.map((b: any) => ({
      ...b,
      id: b._id.toString(),
      _id: undefined,
    }));
    
    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const data = await request.json();
    
    const newBackup = await Backup.create(data);
    return NextResponse.json({ id: newBackup._id.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
