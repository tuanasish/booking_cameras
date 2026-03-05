import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();
        const body = await request.json();

        const {
            completed_at,
            staff_id,
            location,
            delivery_fee,
            booking_id,
            payment_status,
            late_fee,
            total_delivery_fee,
            need_recovery,
            need_upload,
            memory_card_code,
        } = body;

        // We can't use true transactions in Supabase JS client without an RPC, but we can do them sequentially
        // Or we can use the `rpc` if one existed. We'll do sequential updates here as a unified API.
        // 1. Update task
        const { error: taskError } = await supabase
            .from('tasks')
            .update({
                completed_at,
                staff_id,
                location,
                delivery_fee,
            })
            .eq('id', params.id);

        if (taskError) throw taskError;

        // 2. Update booking
        const { error: bookingError } = await supabase
            .from('bookings')
            .update({
                payment_status,
                late_fee,
                total_delivery_fee,
            })
            .eq('id', booking_id);

        if (bookingError) throw bookingError;

        // 3. Create recovery task if needed
        if (need_recovery || need_upload) {
            const { error: recoveryError } = await supabase
                .from('recovery_tasks')
                .insert({
                    booking_id,
                    memory_card_code: memory_card_code || null,
                    need_recovery: !!need_recovery,
                    need_upload: !!need_upload,
                    status: 'pending',
                    priority: need_recovery ? 'high' : 'normal',
                });

            if (recoveryError) throw recoveryError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error completing task:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
