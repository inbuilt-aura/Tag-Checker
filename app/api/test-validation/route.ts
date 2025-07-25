import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const url = `https://www.perplexity.ai/join/p/priority/${code}`
    console.log(`Testing URL: ${url}`)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        redirect: 'follow'
      })

      const html = await response.text()
      
      return NextResponse.json({
        code,
        url,
        status: response.status,
        statusText: response.statusText,
        htmlLength: html.length,
        htmlPreview: html.substring(0, 500),
        containsError: html.toLowerCase().includes('error'),
        containsPromo: html.toLowerCase().includes('promo'),
        containsInvalid: html.toLowerCase().includes('invalid'),
        containsSubscription: html.toLowerCase().includes('subscription')
      })
      
    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({
        code,
        url,
        error: 'Fetch failed',
        errorMessage: fetchError.message,
        errorType: fetchError.name
      })
    }

  } catch (error: any) {
    console.error('Test validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    )
  }
}