import { authService } from "./auth"

// Production-ready WebSocket URL construction
const getWebSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  const isSecure = apiUrl.startsWith('https')
  const protocol = isSecure ? 'wss' : 'ws'
  
  // Extract host without protocol
  const host = apiUrl.replace(/^https?:\/\//, '')
  
  return `${protocol}://${host}`
}

// Production-ready WebSocket with better error handling
export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private url: string
  private eventListeners: { [key: string]: Function[] } = {}
  private isDevelopment = process.env.NODE_ENV === 'development'

  constructor(url: string) {
    // Dynamic WebSocket URL for production
    const baseUrl = getWebSocketUrl()
    this.url = `${baseUrl}${url}`
  }

  private buildWebSocketUrl(path: string): string {
    const baseUrl = getWebSocketUrl()
    return `${baseUrl}${path}`
  }

  connect(path?: string) {
    if (path) {
      this.url = this.buildWebSocketUrl(path)
    }

    try {
      // Get token with better error handling
      const token = this.getAuthToken()
      const urlWithToken = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url
      
      this.ws = new WebSocket(urlWithToken)
      this.setupEventHandlers()
    } catch (error) {
      // Don't retry on setup errors
      this.emit('error', error)
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = (event) => {
        this.reconnectAttempts = 0
      this.emit('connected', event)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
            this.emit(data.type, data)
        } catch (error) {
        // Silent error handling for malformed messages
        }
      }

      this.ws.onclose = (event) => {
      // Only reconnect on specific error codes
      if (event.code === 1006 || event.code === 1008 || event.code === 1011) {
        // These are recoverable errors
        this.handleReconnect()
      } else {
        // Don't reconnect for normal closures (1000) or policy violations (1008)
        this.emit('disconnected', event)
        }
      }

      this.ws.onerror = (error) => {
      // Emit error but don't log to console to reduce noise
      this.emit('error', { type: 'websocket_error', event: error })
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect_attempts_reached', { attempts: this.reconnectAttempts })
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000) // Cap at 30s
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  private getAuthToken(): string | null {
    // Get token from localStorage or wherever you store it
    if (typeof window !== 'undefined') {
      try {
        // Try different token storage keys
        const token = localStorage.getItem('swiftcourier_token') || 
                     localStorage.getItem('token') || 
                     sessionStorage.getItem('swiftcourier_token')
        
        return token
    } catch (error) {
        return null
      }
    }
    return null
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  private emit(event: string, data: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

// Singleton pattern for consistent WebSocket management
const wsManager = new WebSocketManager('/ws/notifications/')
export { wsManager }
