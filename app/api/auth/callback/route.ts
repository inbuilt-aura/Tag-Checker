import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // This will set the Supabase session cookie from the frontend
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { event, session } = await request.json();

  if (event === "SIGNED_IN" && session) {
    await supabase.auth.setSession(session);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Invalid event or session" },
    { status: 400 }
  );
}
