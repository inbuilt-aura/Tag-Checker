import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { codeId, status, message } = await request.json();
    
    if (!codeId || !status) {
      return NextResponse.json({ error: 'Code ID and status are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the code status
    const { data, error } = await supabase
      .from('promo_codes')
      .update({
        status: status,
        message: message || `Manually verified as ${status}`,
        timestamp: new Date().toISOString(),
      })
      .eq('id', codeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating code:', error);
      return NextResponse.json({ error: 'Failed to update code' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Code updated successfully',
      code: data 
    });

  } catch (error) {
    console.error('Manual update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
