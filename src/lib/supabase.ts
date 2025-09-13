import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      tourists: {
        Row: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          phoneNumber: string;
          nationality: string;
          passportNumber: string;
          emergencyContact?: string;
          status: 'ACTIVE' | 'INACTIVE';
          createdAt: string;
          updatedAt: string;
          lastSeenAt?: string;
          currentLocation?: any; // JSONB
        };
        Insert: Omit<Database['public']['Tables']['tourists']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['tourists']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          touristId: string;
          type: 'SOS' | 'PANIC' | 'EMERGENCY' | 'GEOFENCE' | 'SAFETY_CHECK';
          severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
          message: string;
          latitude?: number;
          longitude?: number;
          address?: string;
          metadata?: any; // JSONB
          acknowledgedBy?: string;
          resolvedBy?: string;
          acknowledgedAt?: string;
          resolvedAt?: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      locations: {
        Row: {
          id: string;
          touristId: string;
          latitude: number;
          longitude: number;
          accuracy?: number;
          speed?: number;
          heading?: number;
          altitude?: number;
          timestamp: string;
          createdAt: string;
        };
        Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'createdAt'>;
        Update: Partial<Database['public']['Tables']['locations']['Insert']>;
      };
      geofences: {
        Row: {
          id: string;
          name: string;
          type: 'SAFE_ZONE' | 'RESTRICTED_ZONE' | 'ALERT_ZONE';
          coordinates: any; // JSONB for polygon coordinates
          radius?: number;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Omit<Database['public']['Tables']['geofences']['Row'], 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Database['public']['Tables']['geofences']['Insert']>;
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];