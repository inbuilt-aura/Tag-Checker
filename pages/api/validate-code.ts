import puppeteer from 'puppeteer';
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
    // Launch a headless browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the validation page
    await page.goto('https://www.perplexity.ai/join/p/priority');

    // Simulate entering the promo code and submitting the form
    await page.type('input[name="promoCode"]', code);
    await page.click('button[type="submit"]');

    // Wait for the result to load
    await page.waitForSelector('.result-message', { timeout: 5000 });

    // Extract the result message
    const resultMessage = await page.$eval(
      '.result-message',
      (el) => (el as HTMLElement).textContent || ''
    );

    await browser.close();

    if (resultMessage.includes('Promo Code Applied')) {
      res.status(200).json({ status: 'valid', message: 'Promo code is valid' });
    } else {
      res.status(200).json({ status: 'invalid', message: 'Promo code is invalid or expired' });
    }
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}
