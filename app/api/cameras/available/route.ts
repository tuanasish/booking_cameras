import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { pickupTime, returnTime } = await request.json();

    if (!pickupTime || !returnTime) {
      return NextResponse.json(
        { error: 'pickupTime and returnTime are required' },
        { status: 400 }
      );
    }

    // Sử dụng function từ database
    const { data, error } = await supabase.rpc('get_available_cameras', {
      p_pickup_time: pickupTime,
      p_return_time: returnTime,
    });

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


