import { type User } from '@clerk/nextjs/server'

export type UserRole = 'admin' | 'user' | 'athlete'

export interface AppUser extends User {
  role?: UserRole
}

export interface Application {
  id: string
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  applicationData: Record<string, unknown>
}

export interface DatabaseError {
  message: string
  code?: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ActionResult<T = unknown> = 
  | { success: true; data: T }
  | { success: false; error: string }