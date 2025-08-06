// === CONSOLE TEST SCRIPT ===
// Copy and paste this into the browser console on the Perplexity page

(function() {
  console.log('=== PROMO CODE AUTO-DETECTOR TEST ===');
  
  // Extract promo code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const promoCode = urlParams.get('discount_code');
  
  if (!promoCode) {
    console.log('❌ No promo code found in URL');
    return;
  }
  
  console.log(`🔍 Checking promo code: ${promoCode}`);
  
  // Get page content
  const bodyText = document.body.innerText.toLowerCase();
  console.log('📄 Page content sample:', bodyText.substring(0, 200) + '...');
  
  let status = 'pending';
  let message = 'Status unclear';
  
  // Check for SUCCESS patterns (including the new one from your screenshot)
  if (bodyText.includes('you are receiving a free') || 
      bodyText.includes('promo code applied') || 
      bodyText.includes('successfully applied') ||
      bodyText.includes('discount applied') ||
      bodyText.includes('thanks to airtel') ||
      bodyText.includes('subscription to perplexity pro')) {
    status = 'valid';
    message = 'Promo code successfully applied - Free subscription detected';
    console.log('✅ SUCCESS DETECTED!');
  }
  // Check for ERROR patterns
  else if (bodyText.includes('invalid promo code') || 
           bodyText.includes('please try copying and pasting') ||
           bodyText.includes('expired') ||
           bodyText.includes('not found') ||
           bodyText.includes('error occurred')) {
    status = 'invalid';
    message = 'Promo code is invalid or expired';
    console.log('❌ ERROR DETECTED!');
  }
  else {
    console.log('⏳ STATUS UNCLEAR - manual check needed');
  }
  
  console.log(`📊 Final Result: ${status.toUpperCase()} - ${message}`);
  
  // Create visual indicator
  const indicator = document.createElement('div');
  indicator.id = 'promo-result-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 15px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 300px;
    background: ${status === 'valid' ? '#10b981' : status === 'invalid' ? '#ef4444' : '#f59e0b'};
  `;
  
  const statusEmoji = status === 'valid' ? '✅' : status === 'invalid' ? '❌' : '⏳';
  indicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 20px;">${statusEmoji}</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">Code: ${promoCode}</div>
        <div style="font-size: 12px; opacity: 0.9;">${message}</div>
        <div style="font-size: 10px; margin-top: 4px; opacity: 0.7;">Auto-detected result</div>
      </div>
    </div>
  `;
  
  // Remove existing indicator if any
  const existing = document.getElementById('promo-result-indicator');
  if (existing) existing.remove();
  
  document.body.appendChild(indicator);
  
  // Send to your app (update the URL if your app is running on a different port)
  console.log('📡 Sending result to app...');
  fetch('http://localhost:3000/api/auto-update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: promoCode,
      status: status,
      message: message,
      source: 'console-test',
      timestamp: new Date().toISOString()
    })
  })
  .then(response => {
    if (response.ok) {
      console.log('✅ Successfully sent to app!');
      indicator.style.border = '2px solid #fff';
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  })
  .then(data => {
    console.log('📨 App response:', data);
  })
  .catch(error => {
    console.log('❌ Failed to send to app:', error);
    indicator.innerHTML += '<div style="font-size: 10px; margin-top: 5px; color: #ffcccc;">❌ Failed to update database</div>';
  });
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 10000);
  
  console.log('=== TEST COMPLETE ===');
})();
