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
    
    // Try a direct fetch first - this likely won't work due to CORS, but it's worth a try
    try {
      const response = await fetch(`https://www.perplexity.ai/join/p/priority/${code}`, {
        method: 'GET',
        mode: 'no-cors', // This allows the request but limits response access
        redirect: 'follow',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'User-Agent': navigator.userAgent || 'Mozilla/5.0'
        }
      });
      
      // This will use your current network connection (including VPN if active)
      console.log(`Fetch response type: ${response.type} - Using current network/VPN connection`);
    } catch (fetchError) {
      console.log('Fetch failed (expected due to CORS):', fetchError);
    }
    
    // Use a better approach - open in a popup window
    return new Promise((resolve) => {
      // Create a popup window to check the code - this works with VPNs
      const popupWidth = 800;
      const popupHeight = 600;
      const left = (window.screen.width - popupWidth) / 2;
      const top = (window.screen.height - popupHeight) / 2;
      
      const newWindow = window.open(
        `https://www.perplexity.ai/join/p/priority/${code}`, 
        'validateCode',
        `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`
      );
      
      // User will need to manually check and report the result
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
        // After 3 seconds, show the validation buttons
        try {
          // Focus window to get user attention
          newWindow.focus();
          
          // Create a control panel for reporting results
          const controlPanel = document.createElement('div');
          controlPanel.style.position = 'fixed';
          controlPanel.style.bottom = '0';
          controlPanel.style.left = '0';
          controlPanel.style.width = '100%';
          controlPanel.style.padding = '10px';
          controlPanel.style.backgroundColor = '#f0f0f0';
          controlPanel.style.borderTop = '1px solid #ccc';
          controlPanel.style.zIndex = '9999';
          controlPanel.style.textAlign = 'center';
          
          controlPanel.innerHTML = `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h3 style="margin: 0 0 10px 0;">Is the promo code "${code}" valid?</h3>
              <p style="margin: 0 0 15px 0;">Check if you see "Promo Code Applied" message above</p>
              <div>
                <button id="codeValid" style="background: #4CAF50; color: white; border: none; padding: 10px 15px; margin: 0 5px; cursor: pointer; border-radius: 4px;">
                  Valid ✓ (Code Applied)
                </button>
                <button id="codeInvalid" style="background: #F44336; color: white; border: none; padding: 10px 15px; margin: 0 5px; cursor: pointer; border-radius: 4px;">
                  Invalid ✗ (Error/Not Available)
                </button>
                <button id="codeCancel" style="background: #9E9E9E; color: white; border: none; padding: 10px 15px; margin: 0 5px; cursor: pointer; border-radius: 4px;">
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
        }
      }, 2000);
      
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
