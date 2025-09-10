import { authService } from "./auth"

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private listeners: Map<string, Function[]> = new Map()

  connect(endpoint: string) {
    const token = authService.getToken()
    const wsUrl = `${WS_URL}${endpoint}${token ? `?token=${token}` : ""}`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log("[v0] WebSocket connected to:", endpoint)
        this.reconnectAttempts = 0
        this.emit("connected", { endpoint })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit("message", data)

          // Emit specific event types
          if (data.type) {
            this.emit(data.type, data)
          }
        } catch (error) {
          console.error("[v0] WebSocket message parse error:", error)
        }
      }

      this.ws.onclose = (event) => {
        console.log("[v0] WebSocket disconnected:", event.code, event.reason)
        this.emit("disconnected", { code: event.code, reason: event.reason })

        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++
            console.log(`[v0] Reconnecting... Attempt ${this.reconnectAttempts}`)
            this.connect(endpoint)
          }, this.reconnectInterval)
        }
      }

      this.ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
        this.emit("error", error)
      }
    } catch (error) {
      console.error("[v0] WebSocket connection failed:", error)
      this.emit("error", error)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, "Intentional disconnect")
      this.ws = null
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn("[v0] WebSocket not connected, cannot send message")
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data))
    }
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsManager = new WebSocketManager()
