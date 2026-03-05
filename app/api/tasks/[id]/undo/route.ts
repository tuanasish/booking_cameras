import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient();

        // 1. Get the task to find the booking_id
        const { data: task, error: fetchError } = await supabase
            .from('tasks')
            .select('booking_id, delivery_fee')
            .eq('id', params.id)
            .single();

        if (fetchError || !task) {
            throw fetchError || new Error('Task not found');
        }

        // 2. Update task back to pending
        const { error: taskError } = await supabase
            .from('tasks')
            .update({
                completed_at: null,
                staff_id: null,
            })
            .eq('id', params.id);

        if (taskError) throw taskError;

        // 3. Revert booking payment status (best effort)
        // We assume it goes back to 'deposited' and we subtract the task's delivery fee from total
        // We also reset late_fee to 0 as it will be recalculated on next return
        const { data: booking } = await supabase
            .from('bookings')
            .select('total_delivery_fee')
            .eq('id', task.booking_id)
            .single();

        let newDeliveryFee = 0;
        if (booking) {
            newDeliveryFee = Math.max(0, booking.total_delivery_fee - (task.delivery_fee || 0));
        }

        const { error: bookingError } = await supabase
            .from('bookings')
            .update({
                payment_status: 'deposited',
                late_fee: 0,
                total_delivery_fee: newDeliveryFee,
            })
            .eq('id', task.booking_id);

        if (bookingError) throw bookingError;

        // 4. Delete associated recovery tasks if they are still pending
        await supabase
            .from('recovery_tasks')
            .delete()
            .eq('booking_id', task.booking_id)
            .eq('status', 'pending');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error undoing task:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
