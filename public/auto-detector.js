// This script can be run in browser console or as a content script
// It automatically detects the result when you open the promo code URL

(function() {
  'use strict';
  
  // Extract promo code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const promoCode = urlParams.get('discount_code');
  
  if (!promoCode) {
    console.log('No promo code found in URL');
    return;
  }
  
  console.log(`Checking promo code: ${promoCode}`);
  
  // Function to detect the result and send back to our app
  function detectAndReport() {
    const bodyText = document.body.innerText.toLowerCase();
    const fullHTML = document.documentElement.innerHTML.toLowerCase();
    
    let status = 'pending';
    let message = 'Status unclear';
    
    // Success detection patterns
    const successPatterns = [
      'promo code applied',
      'successfully applied',
      'discount applied',
      'code has been applied',
      'congratulations',
      'success',
      '✓',
      'checkmark'
    ];
    
    // Error detection patterns
    const errorPatterns = [
      'invalid',
      'expired',
      'not found',
      'error occurred',
      'promotion code is invalid',
      'code is not valid',
      'unable to apply',
      'not available in your region',
      'geographical restriction'
    ];
    
    // Check for success
    for (let pattern of successPatterns) {
      if (bodyText.includes(pattern) || fullHTML.includes(pattern)) {
        status = 'valid';
        message = 'Promo code successfully applied';
        break;
      }
    }
    
    // Check for errors (only if not already marked as valid)
    if (status === 'pending') {
      for (let pattern of errorPatterns) {
        if (bodyText.includes(pattern) || fullHTML.includes(pattern)) {
          status = 'invalid';
          message = 'Promo code is invalid or expired';
          break;
        }
      }
    }
    
    // Additional checks based on page structure
    if (status === 'pending') {
      // Look for specific elements that might indicate success
      const successSelectors = [
        '[class*="success"]',
        '[class*="applied"]',
        '[class*="valid"]',
        '.checkmark',
        '.check-icon',
        '[data-testid*="success"]'
      ];
      
      for (let selector of successSelectors) {
        if (document.querySelector(selector)) {
          const element = document.querySelector(selector);
          if (element && element.offsetParent !== null) { // Element is visible
            status = 'valid';
            message = 'Success indicator found on page';
            break;
          }
        }
      }
    }
    
    console.log(`Detection result for ${promoCode}: ${status} - ${message}`);
    
    // Send result back to our application
    sendResultToApp(promoCode, status, message);
    
    // Also show visual indicator
    showVisualIndicator(status, message);
  }
  
  // Function to send result to our app
  async function sendResultToApp(code, status, message) {
    try {
      // Replace with your actual app URL
      const appUrl = window.location.origin.includes('localhost') 
        ? 'http://localhost:3000' 
        : 'https://your-app-domain.com';
      
      const response = await fetch(`${appUrl}/api/auto-update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          status,
          message,
          source: 'browser-detection',
          timestamp: new Date().toISOString()
        }),
      });
      
      if (response.ok) {
        console.log('✅ Result sent to app successfully');
      } else {
        console.log('❌ Failed to send result to app');
      }
    } catch (error) {
      console.log('❌ Error sending result to app:', error.message);
    }
  }
  
  // Function to show visual indicator on the page
  function showVisualIndicator(status, message) {
    // Remove existing indicator if any
    const existing = document.getElementById('promo-checker-indicator');
    if (existing) existing.remove();
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.id = 'promo-checker-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
      ${status === 'valid' ? 'background: #10b981;' : ''}
      ${status === 'invalid' ? 'background: #ef4444;' : ''}
      ${status === 'pending' ? 'background: #f59e0b;' : ''}
    `;
    
    const statusEmoji = status === 'valid' ? '✅' : status === 'invalid' ? '❌' : '⏳';
    indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${statusEmoji}</span>
        <div>
          <div style="font-weight: 600;">Code: ${promoCode}</div>
          <div style="font-size: 12px; opacity: 0.9;">${message}</div>
        </div>
      </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => indicator.remove(), 300);
      }
    }, 10000);
  }
  
  // Wait for page to load and then detect
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(detectAndReport, 2000); // Wait 2 seconds for dynamic content
    });
  } else {
    setTimeout(detectAndReport, 2000);
  }
  
  // Also re-check after page changes (for SPAs)
  let lastURL = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastURL) {
      lastURL = url;
      setTimeout(detectAndReport, 2000);
    }
  }).observe(document, {subtree: true, childList: true});
  
})();
