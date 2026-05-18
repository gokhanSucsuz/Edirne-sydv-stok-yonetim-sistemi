import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Personnel from '@/lib/models/Personnel';
import { encryptData, decryptData } from '@/lib/encryption';

export async function GET() {
  try {
    await connectToDatabase();
    const personnel = await Personnel.find().lean();
    
    const formatted = personnel.map((p: any) => ({
      ...p,
      id: p._id.toString(),
      _id: undefined,
      tcNo: p.tcNo ? decryptData(p.tcNo) : undefined,
      password: p.password ? decryptData(p.password) : undefined,
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
    
    if (data.tcNo) data.tcNo = encryptData(data.tcNo);
    if (data.password) data.password = encryptData(data.password);
    
    const newPersonnel = await Personnel.create(data);
    return NextResponse.json({ id: newPersonnel._id.toString() }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    
    const data = await request.json();
    if (data.tcNo) data.tcNo = encryptData(data.tcNo);
    if (data.password) data.password = encryptData(data.password);
    
    await Personnel.findByIdAndUpdate(id, data);
    return NextResponse.json({ success: true });
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
    
    await Personnel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
