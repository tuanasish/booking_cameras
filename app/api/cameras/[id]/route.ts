import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const payload = {
      ...body,
      price_additional_day:
        body.price_additional_day !== undefined ? body.price_additional_day : null,
    };

    const { data, error } = await supabase
      .from('cameras')
      .update(payload)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Kiểm tra xem máy ảnh có trong booking nào không
    const { data: bookingItems } = await supabase
      .from('booking_items')
      .select('id')
      .eq('camera_id', params.id)
      .limit(1);

    if (bookingItems && bookingItems.length > 0) {
      // Nếu có booking, soft delete (đánh dấu is_active = false)
      const { error } = await supabase
        .from('cameras')
        .update({ is_active: false })
        .eq('id', params.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, soft_deleted: true });
    }

    // Nếu không có booking, xóa hẳn
    const { error } = await supabase.from('cameras').delete().eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

