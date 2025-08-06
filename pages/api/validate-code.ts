import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Promo code is required' });
    return;
  }

  try {
    // Make a simple HTTP request to check if the URL is valid
    const url = `https://www.perplexity.ai/join/p/airtel?discount_code=${code}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow'
    });

    console.log(`Response status for ${code}: ${response.status}`);

    if (response.ok) {
      const html = await response.text();
      
      // Check for signs that the promo code page loaded successfully
      if (html.includes('discount') || html.includes('promo') || html.includes('airtel')) {
        res.status(200).json({ status: 'valid', message: 'Promo code appears to be valid' });
      } else {
        res.status(200).json({ status: 'invalid', message: 'Promo code may be invalid or expired' });
      }
    } else if (response.status === 403) {
      // 403 means URL exists but automated access blocked - likely valid
      res.status(200).json({ status: 'valid', message: 'Code appears valid - Manual verification recommended (automated access blocked)' });
    } else if (response.status === 404) {
      res.status(200).json({ status: 'invalid', message: 'Code not found - Invalid promo code' });
    } else {
      res.status(200).json({ status: 'pending', message: `HTTP Error ${response.status} - Unable to verify code automatically` });
    }
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}
