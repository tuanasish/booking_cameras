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

    // Separate customer fields from booking fields
    const {
      customer_name,
      customer_phone,
      customer_phone_2,
      platforms,
      ...bookingUpdates
    } = body;

    // Handle customer updates if provided
    if (customer_name || customer_phone || customer_phone_2 !== undefined || platforms) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('customer_id')
        .eq('id', bookingId)
        .single();

      if (booking?.customer_id) {
        const customerUpdates: any = {};
        if (customer_name) customerUpdates.name = customer_name;
        if (customer_phone) customerUpdates.phone = customer_phone;
        if (customer_phone_2 !== undefined) customerUpdates.phone_2 = customer_phone_2;
        if (platforms) customerUpdates.platforms = platforms;

        const { error: customerError } = await supabase
          .from('customers')
          .update(customerUpdates)
          .eq('id', booking.customer_id);

        if (customerError) {
          // If phone_2 is missing from DB, we log it and continue with other updates if possible
          // or return a helpful error message.
          if (customerError.message.includes('phone_2')) {
            console.error('Database is missing phone_2 column in customers table.');
            // Optionally proceed without phone_2 or tell the user.
            // For now, we return the specific error to the user so they know they need to run SQL.
            return NextResponse.json({ error: `Hệ thống thiếu cột phone_2 trong bảng customers. Vui lòng liên hệ kỹ thuật hoặc chạy SQL migration.` }, { status: 400 });
          }
          return NextResponse.json({ error: `Lỗi cập nhật khách hàng: ${customerError.message}` }, { status: 400 });
        }
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(bookingUpdates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sync tasks due_at when booking times change
    if (bookingUpdates.pickup_time) {
      await supabase
        .from('tasks')
        .update({ due_at: bookingUpdates.pickup_time })
        .eq('booking_id', bookingId)
        .eq('type', 'pickup');
    }
    if (bookingUpdates.return_time) {
      await supabase
        .from('tasks')
        .update({ due_at: bookingUpdates.return_time })
        .eq('booking_id', bookingId)
        .eq('type', 'return');
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}





