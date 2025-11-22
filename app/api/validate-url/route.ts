import { NextRequest, NextResponse } from 'next/server'

interface ValidationResponse {
  valid: boolean
  accessible: boolean
  error?: string
  statusCode?: number
  redirectUrl?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ValidationResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({
        valid: false,
        accessible: false,
        error: 'URL parameter is required'
      }, { status: 400 })
    }

    // Basic URL format validation
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      return NextResponse.json({
        valid: false,
        accessible: false,
        error: 'Invalid URL format'
      }, { status: 400 })
    }

    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return NextResponse.json({
        valid: false,
        accessible: false,
        error: 'URL must use HTTP or HTTPS protocol'
      }, { status: 400 })
    }

    // Check for localhost/private IPs (security measure)
    const hostname = urlObj.hostname.toLowerCase()
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return NextResponse.json({
        valid: false,
        accessible: false,
        error: 'Private/local URLs are not allowed'
      }, { status: 400 })
    }

    // Test accessibility with a HEAD request
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Handle redirects
      if (response.redirected) {
        return NextResponse.json({
          valid: true,
          accessible: true,
          statusCode: response.status,
          redirectUrl: response.url
        })
      }

      // Check if response is successful
      if (response.ok) {
        return NextResponse.json({
          valid: true,
          accessible: true,
          statusCode: response.status
        })
      }

      // Handle specific error codes
      if (response.status === 403) {
        return NextResponse.json({
          valid: true,
          accessible: false,
          error: 'Access forbidden - website may be blocking automated requests',
          statusCode: response.status
        })
      }

      if (response.status === 404) {
        return NextResponse.json({
          valid: true,
          accessible: false,
          error: 'Website not found',
          statusCode: response.status
        })
      }

      if (response.status === 429) {
        return NextResponse.json({
          valid: true,
          accessible: false,
          error: 'Rate limited - too many requests',
          statusCode: response.status
        })
      }

      if (response.status >= 500) {
        return NextResponse.json({
          valid: true,
          accessible: false,
          error: 'Website server error',
          statusCode: response.status
        })
      }

      // Other non-success status codes
      return NextResponse.json({
        valid: true,
        accessible: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status
      })

    } catch (error) {
      if (error instanceof Error) {
        // Handle timeout
        if (error.name === 'AbortError') {
          return NextResponse.json({
            valid: true,
            accessible: false,
            error: 'Website took too long to respond (timeout)'
          })
        }

        // Handle network errors
        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
          return NextResponse.json({
            valid: true,
            accessible: false,
            error: 'Website not found - DNS resolution failed'
          })
        }

        if (error.message.includes('ECONNREFUSED')) {
          return NextResponse.json({
            valid: true,
            accessible: false,
            error: 'Connection refused - website may be down'
          })
        }

        if (error.message.includes('ECONNRESET') || error.message.includes('socket hang up')) {
          return NextResponse.json({
            valid: true,
            accessible: false,
            error: 'Connection reset - website may be unstable'
          })
        }

        // Generic network error
        return NextResponse.json({
          valid: true,
          accessible: false,
          error: `Network error: ${error.message}`
        })
      }

      // Unknown error
      return NextResponse.json({
        valid: true,
        accessible: false,
        error: 'Unknown error occurred while checking website'
      })
    }

  } catch (error) {
    console.error('URL validation error:', error)
    
    return NextResponse.json({
      valid: false,
      accessible: false,
      error: 'Internal server error during validation'
    }, { status: 500 })
  }
}