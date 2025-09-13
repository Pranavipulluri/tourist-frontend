import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://emtjtehlwmjypgjmfwyh.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGp0ZWhsd21qeXBnam1md3loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1Mzg3MTIsImV4cCI6MjA1MzExNDcxMn0.2hkGiYhJNXBq1OggS7QAgOjgU-FvWuGayT3dWqH2gew'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      tourists: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone_number?: string
          emergency_contact?: string
          nationality?: string
          passport_number?: string
          digital_id?: string
          role: 'TOURIST' | 'ADMIN'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          phone_number?: string
          emergency_contact?: string
          nationality?: string
          passport_number?: string
          digital_id?: string
          role?: 'TOURIST' | 'ADMIN'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone_number?: string
          emergency_contact?: string
          nationality?: string
          passport_number?: string
          digital_id?: string
          role?: 'TOURIST' | 'ADMIN'
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          tourist_id: string
          type: 'SOS' | 'PANIC' | 'EMERGENCY' | 'GEOFENCE' | 'SAFETY_CHECK'
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
          message: string
          latitude: number
          longitude: number
          address?: string
          acknowledged_by?: string
          resolved_by?: string
          acknowledged_at?: string
          resolved_at?: string
          created_at: string
          updated_at: string
          metadata?: any
        }
        Insert: {
          id?: string
          tourist_id: string
          type: 'SOS' | 'PANIC' | 'EMERGENCY' | 'GEOFENCE' | 'SAFETY_CHECK'
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
          message: string
          latitude: number
          longitude: number
          address?: string
          acknowledged_by?: string
          resolved_by?: string
          acknowledged_at?: string
          resolved_at?: string
          created_at?: string
          updated_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          tourist_id?: string
          type?: 'SOS' | 'PANIC' | 'EMERGENCY' | 'GEOFENCE' | 'SAFETY_CHECK'
          severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          status?: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'
          message?: string
          latitude?: number
          longitude?: number
          address?: string
          acknowledged_by?: string
          resolved_by?: string
          acknowledged_at?: string
          resolved_at?: string
          created_at?: string
          updated_at?: string
          metadata?: any
        }
      }
      locations: {
        Row: {
          id: string
          tourist_id: string
          latitude: number
          longitude: number
          accuracy: number
          altitude?: number
          speed?: number
          heading?: number
          address?: string
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          tourist_id: string
          latitude: number
          longitude: number
          accuracy: number
          altitude?: number
          speed?: number
          heading?: number
          address?: string
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          tourist_id?: string
          latitude?: number
          longitude?: number
          accuracy?: number
          altitude?: number
          speed?: number
          heading?: number
          address?: string
          timestamp?: string
          created_at?: string
        }
      }
      geofences: {
        Row: {
          id: string
          name: string
          type: 'SAFE_ZONE' | 'DANGER_ZONE' | 'RESTRICTED_AREA'
          coordinates: any
          radius?: number
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
          metadata?: any
        }
        Insert: {
          id?: string
          name: string
          type: 'SAFE_ZONE' | 'DANGER_ZONE' | 'RESTRICTED_AREA'
          coordinates: any
          radius?: number
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          name?: string
          type?: 'SAFE_ZONE' | 'DANGER_ZONE' | 'RESTRICTED_AREA'
          coordinates?: any
          radius?: number
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          metadata?: any
        }
      }
      devices: {
        Row: {
          id: string
          tourist_id: string
          device_id: string
          device_type: 'SMARTWATCH' | 'PANIC_BUTTON' | 'GPS_TRACKER'
          device_name: string
          battery_level?: number
          last_seen?: string
          is_active: boolean
          configuration?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tourist_id: string
          device_id: string
          device_type: 'SMARTWATCH' | 'PANIC_BUTTON' | 'GPS_TRACKER'
          device_name: string
          battery_level?: number
          last_seen?: string
          is_active?: boolean
          configuration?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tourist_id?: string
          device_id?: string
          device_type?: 'SMARTWATCH' | 'PANIC_BUTTON' | 'GPS_TRACKER'
          device_name?: string
          battery_level?: number
          last_seen?: string
          is_active?: boolean
          configuration?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tourist = Database['public']['Tables']['tourists']['Row']
export type Alert = Database['public']['Tables']['alerts']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Geofence = Database['public']['Tables']['geofences']['Row']
export type Device = Database['public']['Tables']['devices']['Row']