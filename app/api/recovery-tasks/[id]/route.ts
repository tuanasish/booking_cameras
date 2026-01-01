import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Check if all tasks are completed
    const { data: currentTask } = await supabase
      .from('recovery_tasks')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedData: any = { ...body };

    // Check if all conditions are met
    const allCompleted =
      (!currentTask.need_recovery || body.is_recovered !== undefined
        ? body.is_recovered
        : currentTask.is_recovered) &&
      (!currentTask.need_upload || body.is_uploaded !== undefined
        ? body.is_uploaded
        : currentTask.is_uploaded) &&
      (body.is_link_sent !== undefined ? body.is_link_sent : currentTask.is_link_sent) &&
      (body.no_error_24h !== undefined ? body.no_error_24h : currentTask.no_error_24h);

    if (allCompleted && !currentTask.completed_at) {
      updatedData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('recovery_tasks')
      .update(updatedData)
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

    const { error } = await supabase.from('recovery_tasks').delete().eq('id', params.id);

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


