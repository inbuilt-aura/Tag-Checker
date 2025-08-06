import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { code, status, message, source, timestamp } = await request.json();

    if (!code || !status) {
      return NextResponse.json(
        { error: "Code and status are required" },
        { status: 400 }
      );
    }

    console.log(`Auto-update received: ${code} -> ${status} (${source})`);

    // Get Supabase client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find the promo code in the database
    const { data: existingCode, error: findError } = await supabase
      .from("promo_codes")
      .select("id, status, batch_id")
      .eq("code", code)
      .eq("user_id", user.id)
      .single();

    if (findError || !existingCode) {
      console.error("Code not found:", findError);
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    // Only update if status is different or if current status is pending
    if (existingCode.status === status && existingCode.status !== "pending") {
      return NextResponse.json({
        message: "No update needed - status already correct",
        currentStatus: existingCode.status,
      });
    }

    // Update the code status
    const { error: updateError } = await supabase
      .from("promo_codes")
      .update({
        status,
        message: message || `Auto-detected as ${status}`,
        timestamp: timestamp || new Date().toISOString(),
      })
      .eq("id", existingCode.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update code" },
        { status: 500 }
      );
    }

    console.log(`Successfully updated ${code} to ${status}`);

    return NextResponse.json({
      success: true,
      message: `Code ${code} updated to ${status}`,
      previousStatus: existingCode.status,
      newStatus: status,
    });
  } catch (error) {
    console.error("Auto-update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
