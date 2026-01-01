import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customerId = searchParams.get('customerId');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        booking_items(*, camera_id, camera:cameras(*)),
        booking_accessories(*),
        tasks(*)
      `)
      .order('pickup_time', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (startDate && endDate) {
      query = query
        .gte('pickup_time', startDate)
        .lte('return_time', endDate);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
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

    // Validate required fields
    if (!body.customer_id || !body.pickup_time || !body.return_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check conflicts for each camera
    if (body.booking_items && body.booking_items.length > 0) {
      for (const item of body.booking_items) {
        const { data: availability, error: availError } = await supabase.rpc(
          'check_camera_availability',
          {
            p_camera_id: item.camera_id,
            p_pickup_time: body.pickup_time,
            p_return_time: body.return_time,
          }
        );

        if (availError) {
          return NextResponse.json(
            { error: `Error checking availability: ${availError.message}` },
            { status: 500 }
          );
        }

        // Get camera quantity
        const { data: camera } = await supabase
          .from('cameras')
          .select('quantity, name')
          .eq('id', item.camera_id)
          .single();

        if (!camera) {
          return NextResponse.json(
            { error: `Camera not found: ${item.camera_id}` },
            { status: 400 }
          );
        }

        const availableQty = availability ?? camera.quantity;
        if (availableQty < item.quantity) {
          return NextResponse.json(
            {
              error: `Máy ${camera.name} chỉ còn ${availableQty} máy trong khoảng thời gian này. Bạn yêu cầu ${item.quantity} máy.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Check conflicts for accessories (tripod, reflector)
    if (body.booking_accessories && body.booking_accessories.length > 0) {
      for (const acc of body.booking_accessories) {
        if (acc.accessory_type === 'tripod' || acc.accessory_type === 'reflector') {
          // Get accessory quantity from database
          const { data: accessory } = await supabase
            .from('accessories')
            .select('quantity, name')
            .eq('type', acc.accessory_type)
            .eq('is_active', true)
            .single();

          if (!accessory) {
            return NextResponse.json(
              { error: `Phụ kiện ${acc.accessory_type} không tồn tại hoặc đã bị vô hiệu hóa` },
              { status: 400 }
            );
          }

          // Get conflicting bookings in the time range
          const { data: conflictingBookings } = await supabase
            .from('bookings')
            .select('id')
            .neq('payment_status', 'cancelled')
            .lt('pickup_time', body.return_time)
            .gt('return_time', body.pickup_time);

          const conflictingBookingIds = conflictingBookings?.map((b) => b.id) || [];

          // Count booked accessories in conflicting bookings
          let bookedQty = 0;
          if (conflictingBookingIds.length > 0) {
            const { data: bookedAccessories } = await supabase
              .from('booking_accessories')
              .select('quantity')
              .eq('accessory_type', acc.accessory_type)
              .in('booking_id', conflictingBookingIds);

            bookedQty = bookedAccessories?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
          }

          const availableQty = accessory.quantity - bookedQty;

          if (availableQty < (acc.quantity || 1)) {
            return NextResponse.json(
              {
                error: `${accessory.name || acc.accessory_type} chỉ còn ${availableQty} cái trong khoảng thời gian này. Bạn yêu cầu ${acc.quantity || 1} cái.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: body.customer_id,
        created_by: body.created_by,
        pickup_time: body.pickup_time,
        return_time: body.return_time,
        payment_status: body.payment_status || 'pending',
        deposit_type: body.deposit_type || 'none',
        deposit_amount: body.deposit_amount || 0,
        cccd_name: body.has_vneid ? null : body.cccd_name || null,
        total_rental_fee: body.total_rental_fee || 0,
        discount_percent: body.discount_percent || 0,
        discount_reason: body.discount_reason || null,
        final_fee: body.final_fee || body.total_rental_fee || 0,
        late_fee: body.late_fee || 0,
        total_delivery_fee: body.total_delivery_fee || (body.tasks?.reduce((sum: number, task: any) => sum + (task.delivery_fee || 0), 0) || 0),
        has_vneid: body.has_vneid || false,
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 400 }
      );
    }

    // Create booking items
    if (body.booking_items && body.booking_items.length > 0) {
      const items = body.booking_items.map((item: any) => ({
        booking_id: booking.id,
        camera_id: item.camera_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('booking_items')
        .insert(items);

      if (itemsError) {
        // Rollback booking
        await supabase.from('bookings').delete().eq('id', booking.id);
        return NextResponse.json(
          { error: `Error creating booking items: ${itemsError.message}` },
          { status: 500 }
        );
      }
    }

    // Create booking accessories
    if (body.booking_accessories && body.booking_accessories.length > 0) {
      const accessories = body.booking_accessories.map((acc: any) => ({
        booking_id: booking.id,
        accessory_type: acc.accessory_type,
        name: acc.name || null,
        quantity: acc.quantity || 1,
        note: acc.note || null,
      }));

      const { error: accError } = await supabase
        .from('booking_accessories')
        .insert(accessories);

      if (accError) {
        // Rollback booking
        await supabase.from('bookings').delete().eq('id', booking.id);
        return NextResponse.json(
          { error: `Error creating accessories: ${accError.message}` },
          { status: 500 }
        );
      }
    }

    // Create tasks (pickup and return)
    if (body.tasks && body.tasks.length > 0) {
      const tasks = body.tasks.map((task: any) => ({
        booking_id: booking.id,
        type: task.type,
        due_at: task.due_at,
        location: task.location || null,
        delivery_fee: task.delivery_fee || 0,
      }));

      const { error: tasksError } = await supabase.from('tasks').insert(tasks);

      if (tasksError) {
        // Rollback booking
        await supabase.from('bookings').delete().eq('id', booking.id);
        return NextResponse.json(
          { error: `Error creating tasks: ${tasksError.message}` },
          { status: 500 }
        );
      }
    }

    // Fetch complete booking with relations
    const { data: completeBooking, error: fetchError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        customer:customers(*),
        booking_items(*, camera:cameras(*)),
        booking_accessories(*),
        tasks(*)
      `
      )
      .eq('id', booking.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: `Error fetching booking: ${fetchError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: completeBooking }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

