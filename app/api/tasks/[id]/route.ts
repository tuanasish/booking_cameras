import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Whitelist allowed fields to prevent accidental overwrites
    const allowedFields = ['completed_at', 'staff_id', 'location', 'delivery_fee', 'due_at'];
    const sanitizedBody: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) {
        sanitizedBody[key] = body[key];
      }
    }

    if (Object.keys(sanitizedBody).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(sanitizedBody)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





