# 🎯 **Bookmarklet for Auto-Detection**

## **📱 Simple Bookmarklet (Copy this and save as a bookmark):**

```javascript
javascript:(function(){
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('discount_code');
  if (!code) return alert('No promo code found in URL');
  
  const bodyText = document.body.innerText.toLowerCase();
  let status = 'pending';
  let message = 'Status unclear';
  
  // Check for invalid/error messages
  if (bodyText.includes('invalid promo code') || bodyText.includes('please try copying and pasting the code')) {
    status = 'invalid';
    message = 'Invalid promo code detected';
  }
  // Check for success messages
  else if (bodyText.includes('promo code applied') || bodyText.includes('successfully applied') || bodyText.includes('you are receiving a free')) {
    status = 'valid';
    message = 'Promo code successfully applied';
  }
  
  // Show visual feedback
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 15px; 
    background: ${status === 'valid' ? '#10b981' : status === 'invalid' ? '#ef4444' : '#f59e0b'}; 
    color: white; border-radius: 8px; font-family: sans-serif; font-size: 14px; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 300px;
  `;
  indicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 18px;">${status === 'valid' ? '✅' : status === 'invalid' ? '❌' : '⏳'}</span>
      <div>
        <div style="font-weight: 600;">${code}</div>
        <div style="font-size: 12px; opacity: 0.9;">${message}</div>
      </div>
    </div>
  `;
  document.body.appendChild(indicator);
  
  // Send to your app
  fetch('http://localhost:3000/api/auto-update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: code,
      status: status,
      message: message,
      source: 'bookmarklet',
      timestamp: new Date().toISOString()
    })
  }).then(response => {
    if (response.ok) {
      console.log('✅ Successfully updated database');
      indicator.style.border = '2px solid #fff';
    } else {
      console.log('❌ Failed to update database');
      indicator.innerHTML += '<div style="font-size: 10px; margin-top: 5px;">❌ DB Update Failed</div>';
    }
  }).catch(error => {
    console.log('❌ Network error:', error);
    indicator.innerHTML += '<div style="font-size: 10px; margin-top: 5px;">❌ Network Error</div>';
  });
  
  // Auto-remove after 8 seconds
  setTimeout(() => indicator.remove(), 8000);
})();
```

## **🚀 How to Use:**

### **Step 1: Create the Bookmarklet**
1. Copy the entire JavaScript code above
2. Create a new bookmark in your browser
3. Set the name as "Auto-Detect Promo"
4. Paste the code as the URL
5. Save the bookmark

### **Step 2: Use It**
1. Go to your app and click "Enhanced Validate" or "Manual Verify"
2. When promo pages open (like the one in your screenshot), click the bookmarklet
3. It will automatically detect "Invalid promo code" and update your database
4. You'll see a red popup showing the result

### **Step 3: Check Results**
- Go back to your app and refresh
- The code should now show as "invalid" in your results table
- No more manual clicking needed!

## **🎯 What It Detects:**

**✅ Valid Codes:**
- "promo code applied"
- "successfully applied" 
- "you are receiving a free"

**❌ Invalid Codes:**
- "invalid promo code" (like in your screenshot)
- "please try copying and pasting the code"

**⏳ Unclear:**
- Anything else gets marked as "pending"

## **💡 Pro Tip:**
You can also use the "Enhanced Validate" button first, which will automatically handle most codes. Then use the bookmarklet for any remaining pending codes!

**Try it now on the page you have open!**
