import { supabase } from "./supabase";
import { toast } from "sonner";

export type ValidationResult = {
  code: string;
  status: "valid" | "invalid" | "pending";
  message: string;
};

export async function validateCodeClientSide(
  code: string
): Promise<ValidationResult> {
  try {
    console.log(`Validating code client-side: ${code}`);

    const response = await fetch("/api/validate-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("Failed to validate promo code");
    }

    const data = await response.json();

    return {
      code,
      status: data.status,
      message: data.message,
    };
  } catch (error) {
    console.error(`Error validating code ${code}:`, error);
    return {
      code,
      status: "pending",
      message: "Error during validation - please try again",
    };
  }
}

export async function validateCodesClientSide(
  batchId: string,
  codes: Array<{ id: string; code: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (let i = 0; i < codes.length; i++) {
    const codeRecord = codes[i];

    // Update progress
    onProgress?.(i + 1, codes.length);

    // Validate the code
    const result = await validateCodeClientSide(codeRecord.code);
    results.push(result);

    // Update database with result
    try {
      await supabase
        .from("promo_codes")
        .update({
          status: result.status,
          message: result.message,
          timestamp: new Date().toISOString(),
        })
        .eq("id", codeRecord.id);
    } catch (error) {
      console.error(
        `Error updating database for code ${codeRecord.code}:`,
        error
      );
    }

    // Add delay to avoid rate limiting (1 second between requests)
    if (i < codes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
