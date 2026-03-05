import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = supabase
      .from('tasks')
      .select(
        `
        *,
        booking:bookings(
          id,
          customer:customers(*),
          booking_items(*, camera:cameras(*)),
          booking_accessories(*),
          payment_status,
          deposit_type,
          deposit_amount,
          cccd_name,
          pickup_time,
          return_time,
          final_fee,
          late_fee,
          total_delivery_fee,
          has_vneid
        )
      `
      )
      .order('due_at', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    if (startDate && endDate) {
      query = query.gte('due_at', startDate).lte('due_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out tasks whose booking has been cancelled
    const filteredData = (data || []).filter(
      (task: any) => task.booking?.payment_status !== 'cancelled'
    );

    return NextResponse.json({ data: filteredData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





