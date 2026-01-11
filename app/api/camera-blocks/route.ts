import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Lấy danh sách blocks
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const cameraId = searchParams.get('camera_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        let query = supabase
            .from('camera_blocks')
            .select(`
        *,
        camera:cameras(id, name, model_line),
        creator:employees(id, name)
      `)
            .order('start_time', { ascending: true });

        // Filter by camera
        if (cameraId) {
            query = query.eq('camera_id', cameraId);
        }

        // Filter by date range
        if (startDate && endDate) {
            query = query
                .lt('start_time', endDate)
                .gt('end_time', startDate);
        }

        const { data, error } = await query;

        if (error) {
            // If table doesn't exist, return empty array
            if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
                console.warn('camera_blocks table does not exist yet. Run the migration first.');
                return NextResponse.json({ data: [], message: 'Table not created yet. Please run migration.' });
            }
            throw error;
        }

        return NextResponse.json({ data: data || [] });
    } catch (error) {
        console.error('Error fetching camera blocks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch camera blocks', data: [] },
            { status: 500 }
        );
    }
}

// POST - Tạo block mới
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { camera_id, quantity, start_time, end_time, reason, note, created_by } = body;

        // Validate required fields
        if (!camera_id || !start_time || !end_time || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields: camera_id, start_time, end_time, reason' },
                { status: 400 }
            );
        }

        // Check if end_time > start_time
        if (new Date(end_time) <= new Date(start_time)) {
            return NextResponse.json(
                { error: 'Thời gian kết thúc phải sau thời gian bắt đầu' },
                { status: 400 }
            );
        }

        // Get camera info to check quantity
        const { data: camera } = await supabase
            .from('cameras')
            .select('quantity')
            .eq('id', camera_id)
            .single();

        if (!camera) {
            return NextResponse.json(
                { error: 'Camera not found' },
                { status: 404 }
            );
        }

        // Check if block quantity is valid
        const blockQty = quantity || 1;

        // Create the block
        const { data, error } = await supabase
            .from('camera_blocks')
            .insert({
                camera_id,
                quantity: blockQty,
                start_time,
                end_time,
                reason,
                note,
                created_by
            } as Record<string, unknown>)
            .select(`
        *,
        camera:cameras(id, name, model_line),
        creator:employees(id, name)
      `)
            .single();

        if (error) {
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                return NextResponse.json(
                    { error: 'Bảng camera_blocks chưa tồn tại. Vui lòng chạy file SQL migration.' },
                    { status: 400 }
                );
            }
            throw error;
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error) {
        console.error('Error creating camera block:', error);
        return NextResponse.json(
            { error: 'Failed to create camera block' },
            { status: 500 }
        );
    }
}
