import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

// Input validation schemas
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(150, 'Username must be less than 150 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be less than 128 characters')
})

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(150, 'Username must be less than 150 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
           'Password must contain uppercase, lowercase, number, and special character'),
  password_confirm: z.string(),
  first_name: z.string()
    .min(1, 'First name is required')
    .max(150, 'First name must be less than 150 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(150, 'Last name must be less than 150 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  user_type: z.enum(['customer', 'driver'], {
    errorMap: () => ({ message: 'Invalid user type' })
  }),
  phone_number: z.string()
    .regex(/^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
           'Invalid phone number format'),
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must be less than 500 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'City can only contain letters and spaces'),
  state: z.string()
    .length(2, 'State must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'State must be uppercase letters'),
  zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  country: z.string()
    .length(2, 'Country must be 2 characters')
    .default('US')
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"]
})

export const packageSchema = z.object({
  weight: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Weight must be a valid number')
    .transform(val => parseFloat(val))
    .refine(val => val > 0 && val <= 1000, 'Weight must be between 0.01 and 1000 kg'),
  length: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Length must be a valid number')
    .transform(val => parseFloat(val))
    .refine(val => val > 0 && val <= 300, 'Length must be between 0.01 and 300 cm'),
  width: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Width must be a valid number')
    .transform(val => parseFloat(val))
    .refine(val => val > 0 && val <= 300, 'Width must be between 0.01 and 300 cm'),
  height: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Height must be a valid number')
    .transform(val => parseFloat(val))
    .refine(val => val > 0 && val <= 300, 'Height must be between 0.01 and 300 cm'),
  package_type: z.enum(['document', 'package', 'fragile', 'perishable'], {
    errorMap: () => ({ message: 'Invalid package type' })
  }),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  receiver_name: z.string()
    .min(2, 'Receiver name must be at least 2 characters')
    .max(100, 'Receiver name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Receiver name can only contain letters and spaces'),
  receiver_phone: z.string()
    .regex(/^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
           'Invalid phone number format'),
  receiver_address: z.string()
    .min(5, 'Receiver address must be at least 5 characters')
    .max(500, 'Receiver address must be less than 500 characters'),
  receiver_city: z.string()
    .min(2, 'Receiver city must be at least 2 characters')
    .max(100, 'Receiver city must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Receiver city can only contain letters and spaces'),
  receiver_state: z.string()
    .length(2, 'Receiver state must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Receiver state must be uppercase letters'),
  receiver_zip_code: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
})

// Sanitization functions
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '')

  // Remove potential script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  // Remove javascript: urls
  sanitized = sanitized.replace(/javascript:/gi, '')

  // Remove data: urls that aren't images
  sanitized = sanitized.replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml))[^;]+;[^,]*,/gi, '')

  return sanitized.trim()
}

export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false
  })
}

// Rate limiting utility
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()

  checkLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now()
    const attempt = this.attempts.get(key)

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (attempt.count >= maxAttempts) {
      return false
    }

    attempt.count++
    return true
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

// CSRF protection
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Secure local storage
export class SecureStorage {
  private static instance: SecureStorage
  private readonly prefix = 'swiftcourier_secure_'

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage()
    }
    return SecureStorage.instance
  }

  setItem(key: string, value: string): void {
    try {
      const encrypted = btoa(encodeURIComponent(value))
      localStorage.setItem(this.prefix + key, encrypted)
    } catch (error) {
      console.error('Failed to store secure item:', error)
    }
  }

  getItem(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(this.prefix + key)
      if (!encrypted) return null
      return decodeURIComponent(atob(encrypted))
    } catch (error) {
      console.error('Failed to retrieve secure item:', error)
      return null
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key)
  }

  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }
}

export const secureStorage = SecureStorage.getInstance()

// Content Security Policy violation handler
export const handleCSPViolation = (event: SecurityPolicyViolationEvent): void => {
  console.error('CSP Violation:', {
    documentURI: event.documentURI,
    violatedDirective: event.violatedDirective,
    effectiveDirective: event.effectiveDirective,
    originalPolicy: event.originalPolicy,
    blockedURI: event.blockedURI,
    statusCode: event.statusCode,
  })

  // In production, you might want to send this to a logging service
  // logSecurityEvent('CSP_VIOLATION', event)
}

// Export validation functions
export const validateLogin = (data: unknown) => loginSchema.safeParse(data)
export const validateRegister = (data: unknown) => registerSchema.safeParse(data)
export const validatePackage = (data: unknown) => packageSchema.safeParse(data)

// Type exports
export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type PackageData = z.infer<typeof packageSchema>