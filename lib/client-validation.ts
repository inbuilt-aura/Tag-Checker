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
    
    // Since direct fetch to Perplexity will be blocked by CORS,
    // we'll use a different approach: create a hidden iframe
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.style.width = '1px'
      iframe.style.height = '1px'
      
      let resolved = false
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true
          document.body.removeChild(iframe)
          resolve({
            code,
            status: 'invalid',
            message: 'Validation timeout - unable to reach Perplexity'
          })
        }
      }, 10000) // 10 second timeout
      
      iframe.onload = () => {
        if (resolved) return
        resolved = true
        
        try {
          // Check if we can access the iframe content
          // If we get an error, it might be due to region blocking
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
          
          if (!iframeDoc) {
            clearTimeout(timeout)
            document.body.removeChild(iframe)
            resolve({
              code,
              status: 'invalid',
              message: 'Unable to validate - possible region restriction'
            })
            return
          }
          
          const html = iframeDoc.documentElement.innerHTML.toLowerCase()
          let status: 'valid' | 'invalid' = 'invalid'
          let message = ''
          
          if (
            html.includes('an error occurred') ||
            html.includes('promotion code is invalid') ||
            html.includes('likely your promotion code is invalid') ||
            html.includes('not available in your region') ||
            html.includes('not available in your country')
          ) {
            status = 'invalid'
            if (html.includes('not available in your region') || html.includes('not available in your country')) {
              message = 'Code not available in current region/country'
            } else {
              message = 'Promotion code is invalid'
            }
          } else if (
            html.includes('enter your promo code') ||
            html.includes('continue') ||
            html.includes('you are receiving a free 1-year subscription') ||
            html.includes('subscription') ||
            html.includes('upgrade')
          ) {
            status = 'valid'
            message = 'Promo code is valid and ready to use'
          } else {
            status = 'invalid'
            message = 'Unable to validate - check manually'
          }
          
          clearTimeout(timeout)
          document.body.removeChild(iframe)
          resolve({ code, status, message })
          
        } catch (error) {
          clearTimeout(timeout)
          document.body.removeChild(iframe)
          resolve({
            code,
            status: 'invalid',
            message: 'Validation blocked - possible region restriction or security policy'
          })
        }
      }
      
      iframe.onerror = () => {
        if (resolved) return
        resolved = true
        clearTimeout(timeout)
        document.body.removeChild(iframe)
        resolve({
          code,
          status: 'invalid',
          message: 'Failed to load validation page - check your connection'
        })
      }
      
      const url = `https://www.perplexity.ai/join/p/priority/${code}`
      document.body.appendChild(iframe)
      iframe.src = url
    })

  } catch (error) {
    console.error(`Error validating code ${code}:`, error)
    return {
      code,
      status: 'invalid',
      message: 'Validation error occurred - check your internet connection'
    }
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
