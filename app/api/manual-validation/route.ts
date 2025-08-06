import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { codes } = await request.json();
    
    if (!codes || !Array.isArray(codes)) {
      return NextResponse.json({ error: 'Codes array is required' }, { status: 400 });
    }

    const results = [];
    
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      console.log(`Testing code: ${code}`);
      
      try {
        // Add delay between requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
        }
        
        const url = `https://www.perplexity.ai/join/p/airtel?discount_code=${code}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.google.com/',
          },
          redirect: 'follow',
        });

        console.log(`Response for ${code}: ${response.status}`);
        
        let status = 'pending';
        let message = '';
        
        if (response.ok) {
          const html = await response.text();
          
          // Look for success indicators
          if (html.includes('Promo Code Applied') || 
              html.includes('Successfully applied') ||
              html.includes('checkmark') ||
              html.toLowerCase().includes('applied')) {
            status = 'valid';
            message = 'Promo code is valid';
          } else if (html.includes('Invalid') || 
                     html.includes('expired') || 
                     html.includes('not found')) {
            status = 'invalid';
            message = 'Promo code is invalid or expired';
          } else {
            status = 'pending';
            message = 'Could not determine validity - manual check needed';
          }
        } else if (response.status === 404) {
          status = 'invalid';
          message = 'Code not found';
        } else if (response.status === 403) {
          status = 'pending';
          message = 'Access blocked - manual verification required';
        } else {
          status = 'pending';
          message = `HTTP ${response.status} - manual check needed`;
        }
        
        results.push({
          code,
          status,
          message,
          httpStatus: response.status
        });
        
      } catch (error) {
        console.error(`Error testing ${code}:`, error);
        results.push({
          code,
          status: 'pending',
          message: 'Error during validation',
          httpStatus: null
        });
      }
    }
    
    return NextResponse.json({ results });
    
  } catch (error) {
    console.error('Manual validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
