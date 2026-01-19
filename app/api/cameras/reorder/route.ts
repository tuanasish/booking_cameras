import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// API to reorder cameras
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { orders } = body as { orders: { id: string; sort_order: number }[] };

        if (!orders || !Array.isArray(orders)) {
            return NextResponse.json(
                { error: 'Invalid request body. Expected { orders: [{ id, sort_order }] }' },
                { status: 400 }
            );
        }

        // Update each camera's sort_order
        const updates = orders.map(({ id, sort_order }) =>
            supabase
                .from('cameras')
                .update({ sort_order })
                .eq('id', id)
        );

        const results = await Promise.all(updates);

        // Check for any errors
        const error = results.find(r => r.error);
        if (error?.error) {
            return NextResponse.json({ error: error.error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, updated: orders.length });
    } catch (error) {
        console.error('Error reordering cameras:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
