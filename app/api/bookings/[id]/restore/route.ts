import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const { id } = params;

        // 1. Fetch booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*, booking_items(*, camera:cameras(*)), booking_accessories(*)')
            .eq('id', id)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Không tìm thấy booking' }, { status: 404 });
        }

        if (booking.payment_status !== 'cancelled') {
            return NextResponse.json({ error: 'Chỉ có thể khôi phục đơn đã bị hủy' }, { status: 400 });
        }

        // 2. Check camera conflicts
        for (const item of booking.booking_items) {
            const { data: availability, error: availError } = await supabase.rpc(
                'check_camera_availability',
                {
                    p_camera_id: item.camera_id,
                    p_pickup_time: booking.pickup_time,
                    p_return_time: booking.return_time,
                }
            );

            if (availError) throw availError;

            const availableQty = availability ?? item.camera.quantity;
            if (availableQty < item.quantity) {
                return NextResponse.json(
                    {
                        error: `Máy ${item.camera.name} đã bị đơn khác chiếm lịch (chỉ còn ${availableQty} máy trống). Không thể khôi phục.`
                    },
                    { status: 400 }
                );
            }
        }

        // 3. Check accessory conflicts
        for (const acc of booking.booking_accessories) {
            if (acc.accessory_type === 'tripod' || acc.accessory_type === 'reflector') {
                const { data: accessory } = await supabase
                    .from('accessories')
                    .select('quantity, name')
                    .eq('type', acc.accessory_type)
                    .single();

                if (!accessory) continue;

                // Count overlapping active bookings
                const { data: overlappingBookings } = await supabase
                    .from('bookings')
                    .select('id')
                    .neq('payment_status', 'cancelled')
                    .neq('id', id) // Exclude current booking
                    .lt('pickup_time', booking.return_time)
                    .gt('return_time', booking.pickup_time);

                const ids = overlappingBookings?.map(b => b.id) || [];
                let bookedQty = 0;
                if (ids.length > 0) {
                    const { data: bookedAccs } = await supabase
                        .from('booking_accessories')
                        .select('quantity')
                        .eq('accessory_type', acc.accessory_type)
                        .in('booking_id', ids);
                    bookedQty = bookedAccs?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
                }

                const availableQty = accessory.quantity - bookedQty;
                if (availableQty < (acc.quantity || 1)) {
                    return NextResponse.json(
                        {
                            error: `Phụ kiện ${accessory.name} đã bị đơn khác chiếm lịch. Không thể khôi phục.`
                        },
                        { status: 400 }
                    );
                }
            }
        }

        // 4. Restore booking
        // Determine target status: if has deposit -> 'deposited', else 'pending'
        const targetStatus = (booking.deposit_type !== 'none' || booking.deposit_amount > 0) ? 'deposited' : 'pending';

        const { error: updateError } = await supabase
            .from('bookings')
            .update({ payment_status: targetStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (updateError) throw updateError;

        return NextResponse.json({ message: 'Khôi phục đơn thành công', status: targetStatus });
    } catch (error: any) {
        console.error('Restore booking error:', error);
        return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
    }
}
