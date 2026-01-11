import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Lấy realtime availability cho tất cả cameras
export async function GET() {
    try {
        const supabase = await createClient();
        const now = new Date().toISOString();

        // Get all active cameras
        const { data: cameras, error: cameraError } = await supabase
            .from('cameras')
            .select('id, name, model_line, quantity')
            .eq('is_active', true)
            .order('model_line')
            .order('name');

        if (cameraError) throw cameraError;

        // For each camera, calculate booked and blocked quantities
        const availabilityData = await Promise.all(
            (cameras || []).map(async (camera) => {
                // Get booked quantity
                const { data: bookingData } = await supabase
                    .from('booking_items')
                    .select(`
            quantity,
            booking:bookings!inner(pickup_time, return_time, payment_status)
          `)
                    .eq('camera_id', camera.id);

                const bookedQty = (bookingData || []).reduce((sum, item) => {
                    const booking = Array.isArray(item.booking) ? item.booking[0] : item.booking;
                    if (
                        booking &&
                        booking.payment_status !== 'cancelled' &&
                        new Date(booking.pickup_time) <= new Date(now) &&
                        new Date(booking.return_time) > new Date(now)
                    ) {
                        return sum + item.quantity;
                    }
                    return sum;
                }, 0);

                // Get blocked quantity (may not exist yet)
                let blockedQty = 0;
                try {
                    const { data: blockData } = await supabase
                        .from('camera_blocks')
                        .select('quantity')
                        .eq('camera_id', camera.id)
                        .lte('start_time', now)
                        .gt('end_time', now);

                    blockedQty = (blockData || []).reduce((sum, item) => sum + item.quantity, 0);
                } catch {
                    // Table may not exist yet
                }

                return {
                    camera_id: camera.id,
                    camera_name: camera.name,
                    model_line: camera.model_line,
                    total_qty: camera.quantity,
                    booked_qty: bookedQty,
                    blocked_qty: blockedQty,
                    available_qty: camera.quantity - bookedQty - blockedQty
                };
            })
        );

        return NextResponse.json({ data: availabilityData });
    } catch (error) {
        console.error('Error fetching camera availability:', error);
        return NextResponse.json(
            { error: 'Failed to fetch camera availability' },
            { status: 500 }
        );
    }
}
