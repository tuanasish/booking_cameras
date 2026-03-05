import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const allowedFields = {
      booking_id: body.booking_id,
      memory_card_code: body.memory_card_code,
      need_recovery: body.need_recovery,
      need_upload: body.need_upload,
      is_recovered: body.is_recovered,
      is_uploaded: body.is_uploaded,
      is_link_sent: body.is_link_sent,
      no_error_24h: body.no_error_24h,
      completed_at: body.completed_at
    };

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if ((allowedFields as any)[key] === undefined) {
        delete (allowedFields as any)[key];
      }
    });

    const { data, error } = await supabase
      .from('recovery_tasks')
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    let query = supabase
      .from('recovery_tasks')
      .select(
        `
        *,
        booking:bookings(
          id,
          customer:customers(*)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
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





