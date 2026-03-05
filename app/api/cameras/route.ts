import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    let query = supabase.from('cameras').select('*').order('sort_order', { ascending: true });

    if (!all) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

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
      model_line: body.model_line,
      price_6h: body.price_6h,
      price_12h: body.price_12h,
      price_24h: body.price_24h,
      price_additional_day: body.price_additional_day !== undefined ? body.price_additional_day : null,
      quantity: body.quantity,
      is_active: body.is_active,
      sort_order: body.sort_order
    };

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if ((allowedFields as any)[key] === undefined) {
        delete (allowedFields as any)[key];
      }
    });

    const payload = {
      ...allowedFields
    };

    const { data, error } = await supabase
      .from('cameras')
      .insert(payload)
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

