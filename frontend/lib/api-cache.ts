interface CacheEntry {
    data: any
    timestamp: number
    ttl: number
  }
  
  class ApiCache {
    private cache = new Map<string, CacheEntry>()
    
    get<T>(key: string): T | null {
      const entry = this.cache.get(key)
      if (!entry) return null
      
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        return null
      }
      
      return entry.data
    }
    
    set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutes default
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      })
    }
    
    clear() {
      this.cache.clear()
    }
  }
  
  export const apiCache = new ApiCache()