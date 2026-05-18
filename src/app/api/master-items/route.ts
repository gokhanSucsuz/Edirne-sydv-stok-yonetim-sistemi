import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import MasterItem from '@/lib/models/MasterItem';

export async function GET() {
  try {
    await connectToDatabase();
    const items = await MasterItem.find().lean();
    
    const formatted = items.map((item: any) => ({
      ...item,
      id: item._id.toString(),
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
    
    if (Array.isArray(data)) {
      await MasterItem.insertMany(data);
      return NextResponse.json({ success: true }, { status: 201 });
    }
    
    const newItem = await MasterItem.create(data);
    return NextResponse.json({ id: newItem._id.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    await MasterItem.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
