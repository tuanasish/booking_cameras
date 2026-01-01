import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'all'; // 'all', 'camera', 'model_line'

    let query = supabase
      .from('bookings')
      .select(
        `
        id,
        final_fee,
        late_fee,
        total_delivery_fee,
        payment_status,
        created_at,
        booking_items(
          quantity,
          subtotal,
          camera:cameras(
            id,
            name,
            model_line,
            price_6h
          )
        )
      `
      )
      .eq('payment_status', 'paid');

    if (startDate && endDate) {
      query = query
        .gte('created_at', startDate)
        .lte('created_at', endDate);
    }

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate totals
    const totalRevenue = bookings?.reduce((sum, b) => {
      return sum + (b.final_fee || 0) + (b.late_fee || 0) + (b.total_delivery_fee || 0);
    }, 0) || 0;

    const totalBookings = bookings?.length || 0;
    const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Group by camera
    const revenueByCamera: Record<string, any> = {};
    const revenueByModelLine: Record<string, any> = {};

    bookings?.forEach((booking) => {
      const bookingTotal =
        (booking.final_fee || 0) + (booking.late_fee || 0) + (booking.total_delivery_fee || 0);

      booking.booking_items?.forEach((item: any) => {
        const camera = item.camera;
        if (camera) {
          // By camera
          if (!revenueByCamera[camera.id]) {
            revenueByCamera[camera.id] = {
              camera_id: camera.id,
              camera_name: camera.name,
              model_line: camera.model_line,
              revenue: 0,
              bookings: 0,
              quantity: 0,
            };
          }
          revenueByCamera[camera.id].revenue += bookingTotal;
          revenueByCamera[camera.id].bookings += 1;
          revenueByCamera[camera.id].quantity += item.quantity || 0;

          // By model line
          if (camera.model_line) {
            if (!revenueByModelLine[camera.model_line]) {
              revenueByModelLine[camera.model_line] = {
                model_line: camera.model_line,
                revenue: 0,
                bookings: 0,
                quantity: 0,
              };
            }
            revenueByModelLine[camera.model_line].revenue += bookingTotal;
            revenueByModelLine[camera.model_line].bookings += 1;
            revenueByModelLine[camera.model_line].quantity += item.quantity || 0;
          }
        }
      });
    });

    const result: any = {
      summary: {
        total_revenue: totalRevenue,
        total_bookings: totalBookings,
        avg_revenue_per_booking: avgRevenuePerBooking,
      },
    };

    if (groupBy === 'camera' || groupBy === 'all') {
      result.by_camera = Object.values(revenueByCamera).sort(
        (a: any, b: any) => b.revenue - a.revenue
      );
    }

    if (groupBy === 'model_line' || groupBy === 'all') {
      result.by_model_line = Object.values(revenueByModelLine).sort(
        (a: any, b: any) => b.revenue - a.revenue
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


