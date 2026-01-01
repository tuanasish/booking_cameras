import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        customer:customers(*),
        booking_items(*, camera:cameras(*)),
        booking_accessories(*),
        tasks(*),
        created_by_employee:employees!bookings_created_by_fkey(*)
      `
      )
      .eq('id', params.id)
      .single();

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const bookingId = params.id;

    // If updating times or items, check availability
    if (body.pickup_time || body.return_time || body.booking_items) {
      // Fetch current booking data to handle partial updates
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('pickup_time, return_time, booking_items(camera_id, quantity)')
        .eq('id', bookingId)
        .single();

      if (currentBooking) {
        const checkPickup = body.pickup_time || currentBooking.pickup_time;
        const checkReturn = body.return_time || currentBooking.return_time;
        const checkItems = body.booking_items || currentBooking.booking_items;

        for (const item of checkItems) {
          const { data: availability } = await supabase.rpc(
            'check_camera_availability',
            {
              p_camera_id: item.camera_id,
              p_pickup_time: checkPickup,
              p_return_time: checkReturn,
            }
          );

          const { data: camera } = await supabase
            .from('cameras')
            .select('quantity, name')
            .eq('id', item.camera_id)
            .single();

          if (camera) {
            // Calculate how many of THIS camera this booking ALREADY uses
            const currentItem = currentBooking.booking_items?.find(
              (i: any) => i.camera_id === item.camera_id
            );
            const currentQtyInThisBooking = currentItem?.quantity || 0;

            // Effective availability for THIS booking = what's free + what it already holds
            const effectiveAvailable = (availability ?? camera.quantity) + currentQtyInThisBooking;

            if (effectiveAvailable < item.quantity) {
              return NextResponse.json(
                {
                  error: `Máy ${camera.name} không đủ số lượng. Khả dụng: ${effectiveAvailable}, Yêu cầu: ${item.quantity}.`,
                },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(body)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


