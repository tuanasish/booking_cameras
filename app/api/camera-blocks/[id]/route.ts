import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Lấy chi tiết một block
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        const { data, error } = await supabase
            .from('camera_blocks')
            .select(`
        *,
        camera:cameras(id, name, model_line),
        creator:employees(id, name)
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json({ error: 'Table not created yet' }, { status: 404 });
            }
            throw error;
        }

        if (!data) {
            return NextResponse.json({ error: 'Block not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error fetching camera block:', error);
        return NextResponse.json({ error: 'Failed to fetch camera block' }, { status: 500 });
    }
}

// PUT - Cập nhật block
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const { id } = await params;
        const body = await request.json();
        const { quantity, start_time, end_time, reason, note } = body;

        // Check if end_time > start_time when both provided
        if (start_time && end_time && new Date(end_time) <= new Date(start_time)) {
            return NextResponse.json(
                { error: 'Thời gian kết thúc phải sau thời gian bắt đầu' },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = {};
        if (quantity !== undefined) updateData.quantity = quantity;
        if (start_time !== undefined) updateData.start_time = start_time;
        if (end_time !== undefined) updateData.end_time = end_time;
        if (reason !== undefined) updateData.reason = reason;
        if (note !== undefined) updateData.note = note;

        const { data, error } = await supabase
            .from('camera_blocks')
            .update(updateData)
            .eq('id', id)
            .select(`
        *,
        camera:cameras(id, name, model_line),
        creator:employees(id, name)
      `)
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error updating camera block:', error);
        return NextResponse.json({ error: 'Failed to update camera block' }, { status: 500 });
    }
}

// DELETE - Xóa block
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        const { error } = await supabase
            .from('camera_blocks')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting camera block:', error);
        return NextResponse.json({ error: 'Failed to delete camera block' }, { status: 500 });
    }
}
