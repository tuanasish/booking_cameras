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

    // If updating times, items, or accessories, check availability
    if (body.pickup_time || body.return_time || body.booking_items || body.booking_accessories) {
      // Fetch current booking data to handle partial updates
      const { data: currentBooking } = await supabase
        .from('bookings')
        .select('pickup_time, return_time, booking_items(camera_id, quantity), booking_accessories(accessory_type, quantity)')
        .eq('id', bookingId)
        .single();

      if (currentBooking) {
        const checkPickup = body.pickup_time || currentBooking.pickup_time;
        const checkReturn = body.return_time || currentBooking.return_time;
        const checkItems = body.booking_items || currentBooking.booking_items;
        const checkAccessories = body.booking_accessories || currentBooking.booking_accessories;

        // 1. Check Camera Items
        if (checkItems) {
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
              const currentItem = currentBooking.booking_items?.find(
                (i: any) => i.camera_id === item.camera_id
              );
              const currentQtyInThisBooking = currentItem?.quantity || 0;
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

        // 2. Check Accessories
        if (checkAccessories && checkAccessories.length > 0) {
          for (const acc of checkAccessories) {
            if (acc.accessory_type !== 'other') {
              const { data: accessory } = await supabase
                .from('accessories')
                .select('quantity, name')
                .eq('type', acc.accessory_type)
                .eq('is_active', true)
                .single();

              if (!accessory) {
                return NextResponse.json(
                  { error: `Phụ kiện ${acc.accessory_type} không tồn tại hoặc bị vô hiệu hóa` },
                  { status: 400 }
                );
              }

              const { data: conflictingBookings } = await supabase
                .from('bookings')
                .select('id')
                .neq('payment_status', 'cancelled')
                .neq('id', bookingId) // Exclude current booking
                .lt('pickup_time', checkReturn)
                .gt('return_time', checkPickup);

              const conflictingBookingIds = conflictingBookings?.map((b) => b.id) || [];

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
                    error: `${accessory.name || acc.accessory_type} chỉ còn ${availableQty} cái trong khoảng thời gian này. Yêu cầu: ${acc.quantity || 1}.`,
                  },
                  { status: 400 }
                );
              }
            }
          }
        }
      }
    }

    // Separate customer fields and relation fields from booking fields
    const {
      customer_name,
      customer_phone,
      customer_phone_2,
      platforms,
      booking_items,
      booking_accessories,
      tasks: taskUpdates,
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
          if (customerError.message.includes('phone_2')) {
            console.error('Database is missing phone_2 column in customers table.');
            return NextResponse.json({ error: `Hệ thống thiếu cột phone_2 trong bảng customers. Vui lòng liên hệ kỹ thuật hoặc chạy SQL migration.` }, { status: 400 });
          }
          return NextResponse.json({ error: `Lỗi cập nhật khách hàng: ${customerError.message}` }, { status: 400 });
        }
      }
    }

    // Update booking core fields
    const { data, error } = await supabase
      .from('bookings')
      .update(bookingUpdates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sync tasks due_at, location, delivery_fee from taskUpdates
    if (taskUpdates && Array.isArray(taskUpdates)) {
      for (const task of taskUpdates) {
        await supabase
          .from('tasks')
          .update({
            location: task.location || null,
            delivery_fee: task.delivery_fee || 0,
            due_at: task.due_at,
          })
          .eq('booking_id', bookingId)
          .eq('type', task.type);
      }
    } else {
      // Fallback: Sync tasks due_at when booking times change
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
    }

    // Bug #5: Clean up incomplete tasks when booking is cancelled
    if (bookingUpdates.payment_status === 'cancelled') {
      await supabase
        .from('tasks')
        .delete()
        .eq('booking_id', bookingId)
        .is('completed_at', null);
    }

    // Update booking items if provided (delete old + insert new)
    if (booking_items && Array.isArray(booking_items)) {
      await supabase.from('booking_items').delete().eq('booking_id', bookingId);

      if (booking_items.length > 0) {
        const items = booking_items.map((item: any) => ({
          booking_id: bookingId,
          camera_id: item.camera_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        }));

        const { error: itemsError } = await supabase
          .from('booking_items')
          .insert(items);

        if (itemsError) {
          return NextResponse.json({ error: `Lỗi cập nhật thiết bị: ${itemsError.message}` }, { status: 400 });
        }
      }
    }

    // Update booking accessories if provided (delete old + insert new)
    if (booking_accessories && Array.isArray(booking_accessories)) {
      await supabase.from('booking_accessories').delete().eq('booking_id', bookingId);

      if (booking_accessories.length > 0) {
        const accessories = booking_accessories.map((acc: any) => ({
          booking_id: bookingId,
          accessory_type: acc.accessory_type,
          name: acc.name || null,
          quantity: acc.quantity || 1,
          note: acc.note || null,
        }));

        const { error: accError } = await supabase
          .from('booking_accessories')
          .insert(accessories);

        if (accError) {
          return NextResponse.json({ error: `Lỗi cập nhật phụ kiện: ${accError.message}` }, { status: 400 });
        }
      }
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}





