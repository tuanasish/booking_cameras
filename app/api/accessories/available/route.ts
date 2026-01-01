import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { pickupTime, returnTime, accessoryType } = await request.json();

    if (!pickupTime || !returnTime || !accessoryType) {
      return NextResponse.json(
        { error: 'pickupTime, returnTime và accessoryType là bắt buộc' },
        { status: 400 }
      );
    }

    // Tổng số lượng phụ kiện loại này
    const { data: accessory, error: accessoryError } = await supabase
      .from('accessories')
      .select('quantity')
      .eq('type', accessoryType)
      .eq('is_active', true)
      .single();

    if (accessoryError || !accessory) {
      return NextResponse.json(
        { error: `Không tìm thấy phụ kiện loại ${accessoryType}` },
        { status: 400 }
      );
    }

    // Đếm số lượng đang được thuê trong khoảng thời gian
    const { data: bookingAccessories, error: bookedError } = await supabase
      .from('booking_accessories')
      .select(
        `
        quantity,
        booking:bookings!inner (
          pickup_time,
          return_time,
          payment_status
        )
      `
      )
      .eq('accessory_type', accessoryType);

    if (bookedError) {
      return NextResponse.json(
        { error: bookedError.message },
        { status: 500 }
      );
    }

    const requestedStart = new Date(pickupTime);
    const requestedEnd = new Date(returnTime);

    const bookedQty =
      bookingAccessories?.reduce((sum, item: any) => {
        const booking = item.booking;
        if (!booking || booking.payment_status === 'cancelled') return sum;

        const pickup = new Date(booking.pickup_time);
        const ret = new Date(booking.return_time);

        const overlaps =
          pickup < requestedEnd && ret > requestedStart;

        if (!overlaps) return sum;
        return sum + (item.quantity || 0);
      }, 0) ?? 0;

    const available_quantity = Math.max(0, accessory.quantity - bookedQty);

    return NextResponse.json({
      data: {
        accessory_type: accessoryType,
        total_quantity: accessory.quantity,
        available_quantity,
      },
    });
  } catch (error) {
    console.error('Error in /api/accessories/available:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



