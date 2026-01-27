import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('accessories')
            .select('*')
            .in('type', ['tripod', 'reflector']);

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

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json(); // Array of { id, quantity }

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Body must be an array' }, { status: 400 });
        }

        const updates = body.map(item =>
            supabase
                .from('accessories')
                .update({ quantity: item.quantity, price: item.price })
                .eq('id', item.id)
        );

        const results = await Promise.all(updates);
        const errors = results.filter(r => r.error);

        if (errors.length > 0) {
            return NextResponse.json({ error: 'Some updates failed', details: errors }, { status: 400 });
        }

        return NextResponse.json({ message: 'Success' });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
