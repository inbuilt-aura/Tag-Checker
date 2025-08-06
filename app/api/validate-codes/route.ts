import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { batchId } = await request.json();
    console.log("=== VALIDATION DEBUG START ===");
    console.log("Received batchId:", batchId);

    if (!batchId) {
      return NextResponse.json(
        { error: "Batch ID is required" },
        { status: 400 }
      );
    }

    // Create authenticated Supabase client with proper cookie handling
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Debug: Check all cookies
    const allCookies = cookieStore.getAll();
    console.log(
      "All cookies:",
      allCookies.map((c) => ({
        name: c.name,
        value: c.value.substring(0, 50) + "...",
      }))
    );

    // Get the access token from the Authorization header as fallback
    const authHeader = request.headers.get("authorization");
    console.log("Auth header present:", !!authHeader);

    let user = null;
    let authError = null;

    try {
      // First try to get user from session
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      user = userData.user;
      authError = userError;
      console.log("Session user result:", {
        userId: user?.id,
        error: userError?.message,
      });

      // If that fails and we have an auth header, try using the token directly
      if ((!user || userError) && authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        console.log("Trying with bearer token...");
        const { data: tokenUser, error: tokenError } =
          await supabase.auth.getUser(token);
        user = tokenUser.user;
        authError = tokenError;
        console.log("Token user result:", {
          userId: user?.id,
          error: tokenError?.message,
        });
      }
    } catch (error) {
      console.log("Auth check error:", error);
      authError = error;
    }

    console.log("Final authenticated user:", user?.id);
    console.log("Final auth error:", authError);

    if (authError || !user) {
      console.log("Authentication failed:", authError);
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: (authError as any)?.message || "No user found",
          debug: {
            hasAuthHeader: !!authHeader,
            cookieCount: allCookies.length,
          },
        },
        { status: 401 }
      );
    }

    // First, let's see all codes in this batch
    const { data: allCodes, error: allCodesError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("batch_id", batchId);

    console.log("All codes in batch:", allCodes);
    console.log("All codes error:", allCodesError);

    // Get all pending codes for this batch
    const { data: codes, error: fetchError } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("batch_id", batchId)
      .eq("status", "pending");

    console.log("Pending codes found:", codes);
    console.log("Fetch error:", fetchError);

    if (fetchError) {
      console.log("Database error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!codes || codes.length === 0) {
      console.log("No pending codes found");
      return NextResponse.json({
        message: "No pending codes to validate",
        debug: {
          batchId,
          allCodesCount: allCodes?.length || 0,
          pendingCodesCount: 0,
          allCodes: allCodes,
        },
      });
    }

    // Validate each code with delay to avoid rate limiting
    const validationPromises = codes.map(async (codeRecord, index) => {
      try {
        // Add delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, index * 2000)); // 2 second delay between each request

        console.log(`Validating code: ${codeRecord.code}`);
        const url = `https://www.perplexity.ai/join/p/airtel?discount_code=${codeRecord.code}`;

        // Make request to Perplexity URL with more realistic browser headers
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
            Referer: "https://www.google.com/",
          },
          redirect: "follow",
          cache: "no-store",
        });

        console.log(
          `Response status for ${codeRecord.code}: ${response.status}`
        );

        let status: "valid" | "invalid" | "pending" = "pending";
        let message = "";

        if (response.ok) {
          const html = await response.text();
          console.log(`HTML length for ${codeRecord.code}: ${html.length}`);

          // Check for specific success indicators in the response
          if (
            html.includes("Promo Code Applied") ||
            html.includes("discount_code") ||
            html.includes("Successfully applied") ||
            html.includes("checkmark") ||
            html.toLowerCase().includes("applied")
          ) {
            status = "valid";
            message = "Promo code is valid and active";
          } else if (
            html.includes("Invalid") ||
            html.includes("expired") ||
            html.includes("not found") ||
            html.includes("error")
          ) {
            status = "invalid";
            message = "Promo code is invalid or expired";
          } else if (
            html.includes("An error occurred") ||
            html.includes("promotion code is invalid") ||
            html.includes("likely your promotion code is invalid") ||
            html.includes("not available in your region") ||
            html.includes("not available in your country")
          ) {
            status = "invalid";
            message = "Promo code is invalid or region restricted";
          } else if (
            html.includes("Enter your promo code") ||
            html.includes("Continue") ||
            html.includes("You are receiving a free 1-year subscription") ||
            html.includes("subscription") ||
            html.includes("upgrade")
          ) {
            status = "valid";
            message = "Promo code is valid and ready to use";
          } else {
            status = "pending";
            message =
              "Could not determine code validity from response - manual check needed";
          }
        } else {
          console.log(
            `HTTP Error ${response.status} for code ${codeRecord.code}`
          );

          if (response.status === 403) {
            // For 403, we can't be sure - mark as pending for manual check
            status = "pending";
            message = `Access blocked (${response.status}) - Manual verification needed`;
          } else if (response.status === 404) {
            status = "invalid";
            message = `Code not found (${response.status}) - Invalid promo code`;
          } else if (response.status === 429) {
            status = "pending";
            message = `Rate limited (${response.status}) - Try again later`;
          } else if (response.status >= 400 && response.status < 500) {
            status = "invalid";
            message = `Client Error ${response.status} - Code may be invalid`;
          } else {
            status = "pending";
            message = `HTTP Error ${response.status} - Unable to verify code`;
          }
        }

        console.log(`Code ${codeRecord.code} result: ${status} - ${message}`);

        // Update the code status in database
        await supabase
          .from("promo_codes")
          .update({
            status,
            message,
            timestamp: new Date().toISOString(),
          })
          .eq("id", codeRecord.id);

        return { code: codeRecord.code, status, message };
      } catch (error) {
        console.error(`Error validating code ${codeRecord.code}:`, error);

        // Update as error in database
        await supabase
          .from("promo_codes")
          .update({
            status: "invalid",
            message: "Validation error occurred",
            timestamp: new Date().toISOString(),
          })
          .eq("id", codeRecord.id);

        return {
          code: codeRecord.code,
          status: "invalid" as const,
          message: "Validation error occurred",
        };
      }
    });

    // Execute validations with rate limiting (delay between requests)
    const results = [];
    for (const promise of validationPromises) {
      const result = await promise;
      results.push(result);

      // Add delay to avoid rate limiting (1 second between requests)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      message: "Validation completed",
      results,
      validated: results.length,
    });
  } catch (error) {
    console.error("Validation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
