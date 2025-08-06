import { NextRequest, NextResponse } from 'next/server';

// Free proxy services for rotation
const PROXY_SERVICES = [
  // Add rotating proxy services here if needed
  null, // Direct connection as fallback
];

// Rotate User-Agent strings
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomDelay(min = 3000, max = 8000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function validateCodeWithRetry(code: string, maxRetries = 3): Promise<{
  status: 'valid' | 'invalid' | 'pending';
  message: string;
  httpStatus?: number;
}> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} for code: ${code}`);
      
      // Random delay before each attempt
      if (attempt > 1) {
        const delay = getRandomDelay(5000, 12000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const url = `https://www.perplexity.ai/join/p/airtel?discount_code=${code}`;
      
      const headers: Record<string, string> = {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };
      
      // Add some randomness to headers
      if (Math.random() > 0.5) {
        headers['X-Requested-With'] = 'XMLHttpRequest';
      }
      
      if (Math.random() > 0.5) {
        headers['Referer'] = Math.random() > 0.5 ? 'https://www.google.com/' : 'https://duckduckgo.com/';
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        redirect: 'follow',
        // Add timeout
        signal: AbortSignal.timeout(15000),
      });

      console.log(`Response status for ${code} (attempt ${attempt}): ${response.status}`);

      if (response.ok) {
        const html = await response.text();
        console.log(`HTML received for ${code}, length: ${html.length}`);
        
        // Enhanced content detection
        const lowerHtml = html.toLowerCase();
        
        // Success indicators
        if (lowerHtml.includes('promo code applied') || 
            lowerHtml.includes('successfully applied') ||
            lowerHtml.includes('discount applied') ||
            lowerHtml.includes('code has been applied') ||
            html.includes('✓') || html.includes('checkmark') ||
            lowerHtml.includes('congratulations') ||
            lowerHtml.includes('success')) {
          return {
            status: 'valid',
            message: 'Promo code successfully applied',
            httpStatus: response.status
          };
        }
        
        // Error indicators
        if (lowerHtml.includes('invalid') || 
            lowerHtml.includes('expired') ||
            lowerHtml.includes('not found') ||
            lowerHtml.includes('error occurred') ||
            lowerHtml.includes('promotion code is invalid') ||
            lowerHtml.includes('code is not valid') ||
            lowerHtml.includes('unable to apply')) {
          return {
            status: 'invalid',
            message: 'Promo code is invalid or expired',
            httpStatus: response.status
          };
        }
        
        // Region restrictions
        if (lowerHtml.includes('not available in your region') ||
            lowerHtml.includes('not available in your country') ||
            lowerHtml.includes('geographical restriction')) {
          return {
            status: 'invalid',
            message: 'Code not available in current region',
            httpStatus: response.status
          };
        }
        
        // If we get content but can't determine status
        return {
          status: 'pending',
          message: `Received response but status unclear (attempt ${attempt}/${maxRetries})`,
          httpStatus: response.status
        };
      }
      
      // Handle non-200 responses
      if (response.status === 403 && attempt < maxRetries) {
        console.log(`403 received for ${code}, will retry with different headers...`);
        continue; // Retry with different user agent
      }
      
      if (response.status === 404) {
        return {
          status: 'invalid',
          message: 'Code not found - Invalid promo code',
          httpStatus: response.status
        };
      }
      
      if (response.status === 429 && attempt < maxRetries) {
        const retryDelay = getRandomDelay(10000, 20000);
        console.log(`Rate limited for ${code}, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // For other errors, try again if we have retries left
      if (attempt < maxRetries) {
        console.log(`HTTP ${response.status} for ${code}, retrying...`);
        continue;
      }
      
      return {
        status: 'pending',
        message: `HTTP ${response.status} after ${maxRetries} attempts - Manual check needed`,
        httpStatus: response.status
      };
      
    } catch (error: any) {
      console.error(`Error on attempt ${attempt} for ${code}:`, error.message);
      
      if (attempt < maxRetries) {
        const delay = getRandomDelay(8000, 15000);
        console.log(`Waiting ${delay}ms before retry due to error...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return {
        status: 'pending',
        message: `Network error after ${maxRetries} attempts - Manual check needed`,
      };
    }
  }
  
  return {
    status: 'pending',
    message: 'All retry attempts failed - Manual check needed',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { codes } = await request.json();
    
    if (!codes || !Array.isArray(codes)) {
      return NextResponse.json({ error: 'Codes array is required' }, { status: 400 });
    }

    console.log(`Starting enhanced validation for ${codes.length} codes`);
    const results = [];
    
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      console.log(`\n=== Validating code ${i + 1}/${codes.length}: ${code} ===`);
      
      // Random delay between codes
      if (i > 0) {
        const delay = getRandomDelay(4000, 10000);
        console.log(`Inter-code delay: ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await validateCodeWithRetry(code);
      results.push({
        code,
        ...result
      });
      
      console.log(`Result for ${code}: ${result.status} - ${result.message}`);
    }
    
    return NextResponse.json({ 
      results,
      summary: {
        total: results.length,
        valid: results.filter(r => r.status === 'valid').length,
        invalid: results.filter(r => r.status === 'invalid').length,
        pending: results.filter(r => r.status === 'pending').length,
      }
    });
    
  } catch (error) {
    console.error('Enhanced validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
