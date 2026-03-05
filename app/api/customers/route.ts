import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    let query = supabase.from('customers').select('*');

    if (phone) {
      query = query.eq('phone', phone);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const allowedFields = {
      name: body.name,
      phone: body.phone,
      phone_2: body.phone_2,
      email: body.email,
      cccd_number: body.cccd_number,
      address: body.address,
      platforms: body.platforms
    };

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if ((allowedFields as any)[key] === undefined) {
        delete (allowedFields as any)[key];
      }
    });

    const { data, error } = await supabase
      .from('customers')
      .insert(allowedFields)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();
    const allowedUpdateFields = {
      name: body.name,
      phone: body.phone,
      phone_2: body.phone_2,
      email: body.email,
      cccd_number: body.cccd_number,
      address: body.address,
      platforms: body.platforms
    };

    const updatedData: any = {};
    Object.keys(allowedUpdateFields).forEach(key => {
      if ((allowedUpdateFields as any)[key] !== undefined) {
        updatedData[key] = (allowedUpdateFields as any)[key];
      }
    });

    const { data, error } = await supabase
      .from('customers')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

