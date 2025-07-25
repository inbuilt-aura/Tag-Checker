import { supabase } from './supabase'
import { toast } from 'sonner'

export type ValidationResult = {
  code: string
  status: 'valid' | 'invalid' | 'pending'
  message: string
}

export async function validateCodeClientSide(code: string): Promise<ValidationResult> {
  try {
    console.log(`Validating code client-side: ${code}`)
    
    // Skip the direct fetch attempt since it will fail due to CORS
    // We'll go straight to the popup approach which works with VPN
    
    return new Promise((resolve) => {
      // Create a popup window to check the code - this works with VPNs
      const popupWidth = 800;
      const popupHeight = 600;
      const left = (window.screen.width - popupWidth) / 2;
      const top = (window.screen.height - popupHeight) / 2;

      // Open validation window directly - no login needed
      const newWindow = window.open(
        `https://www.perplexity.ai/join/p/priority/${code}`, 
        'validateCode',
        `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`
      );
      
      if (!newWindow) {
        // Popup was blocked
        resolve({
          code,
          status: 'pending',
          message: 'Popup blocked - please allow popups and try again'
        });
        return;
      }
      
      // Create buttons for user to report the result
      const validationTimer = setTimeout(() => {
        // After 1.5 seconds, show the validation buttons
        try {
          // Focus window to get user attention
          newWindow.focus();
          
          // Create a control panel for reporting results
          const controlPanel = document.createElement('div');
          controlPanel.style.position = 'fixed';
          controlPanel.style.bottom = '0';
          controlPanel.style.left = '0';
          controlPanel.style.width = '100%';
          controlPanel.style.padding = '20px';
          controlPanel.style.backgroundColor = '#111';
          controlPanel.style.borderTop = '1px solid #333';
          controlPanel.style.zIndex = '9999';
          controlPanel.style.textAlign = 'center';
          
          controlPanel.innerHTML = `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: white;">
              <h3 style="margin: 0 0 10px 0; color: white;">Is the promo code "${code}" valid?</h3>
              <p style="margin: 0 0 15px 0; color: white;">Check if you see "Promo Code Applied" or enter the code to validate</p>
              <div>
                <button id="codeValid" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; margin: 0 5px; cursor: pointer; border-radius: 4px; font-weight: bold;">
                  Valid ✓ (Code Applied)
                </button>
                <button id="codeInvalid" style="background: #F44336; color: white; border: none; padding: 10px 20px; margin: 0 5px; cursor: pointer; border-radius: 4px; font-weight: bold;">
                  Invalid ✗ (Error/Not Available)
                </button>
                <button id="codeCancel" style="background: #555; color: white; border: none; padding: 10px 20px; margin: 0 5px; cursor: pointer; border-radius: 4px;">
                  Cancel
                </button>
              </div>
            </div>
          `;
          
          // Add to body or create a new body if needed
          if (newWindow.document.body) {
            newWindow.document.body.appendChild(controlPanel);
          }
          
          // Add event listeners
          const validBtn = newWindow.document.getElementById('codeValid');
          const invalidBtn = newWindow.document.getElementById('codeInvalid');
          const cancelBtn = newWindow.document.getElementById('codeCancel');
          
          if (validBtn) {
            validBtn.addEventListener('click', () => {
              newWindow.close();
              resolve({
                code,
                status: 'valid',
                message: 'Promo code is valid (manually verified)'
              });
            });
          }
          
          if (invalidBtn) {
            invalidBtn.addEventListener('click', () => {
              newWindow.close();
              resolve({
                code,
                status: 'invalid',
                message: 'Promo code is invalid or region-restricted (manually verified)'
              });
            });
          }
          
          if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
              newWindow.close();
              resolve({
                code,
                status: 'pending',
                message: 'Validation cancelled'
              });
            });
          }
        } catch (error) {
          // If we can't modify the popup (CORS), provide instructions
          console.log('Could not modify popup:', error);
          toast.error('Please manually check if the code is valid and close the popup when done');
        }
      }, 1500); // Reduced time to 1.5 seconds - faster feedback
      
      // Handle window close
      const checkClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkClosed);
          clearTimeout(validationTimer);
          
          // If window was closed without selecting an option
          resolve({
            code,
            status: 'pending',
            message: 'Validation window closed - please verify manually'
          });
        }
      }, 500);
    });
  } catch (error) {
    console.error(`Error validating code ${code}:`, error);
    return {
      code,
      status: 'pending',
      message: 'Error during validation - please try again'
    };
  }
}

export async function validateCodesClientSide(
  batchId: string, 
  codes: Array<{ id: string, code: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = []
  
  for (let i = 0; i < codes.length; i++) {
    const codeRecord = codes[i]
    
    // Update progress
    onProgress?.(i + 1, codes.length)
    
    // Validate the code
    const result = await validateCodeClientSide(codeRecord.code)
    results.push(result)
    
    // Update database with result
    try {
      await supabase
        .from('promo_codes')
        .update({
          status: result.status,
          message: result.message,
          timestamp: new Date().toISOString(),
        })
        .eq('id', codeRecord.id)
    } catch (error) {
      console.error(`Error updating database for code ${codeRecord.code}:`, error)
    }
    
    // Add delay to avoid rate limiting (1 second between requests)
    if (i < codes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}
