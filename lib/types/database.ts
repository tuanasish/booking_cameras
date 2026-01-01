export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string
          delivery_fee_per_km: number
          default_deposit: number
          late_fee_divisor: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          delivery_fee_per_km?: number
          default_deposit?: number
          late_fee_divisor?: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          delivery_fee_per_km?: number
          default_deposit?: number
          late_fee_divisor?: number
          updated_at?: string | null
        }
      }
      cameras: {
        Row: {
          id: string
          name: string
          model_line: string | null
          price_6h: number
          price_12h: number | null
          price_24h: number | null
          price_additional_day: number | null
          quantity: number
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          model_line?: string | null
          price_6h: number
          price_12h?: number | null
          price_24h?: number | null
          price_additional_day?: number | null
          quantity?: number
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          model_line?: string | null
          price_6h?: number
          price_12h?: number | null
          price_24h?: number | null
          price_additional_day?: number | null
          quantity?: number
          is_active?: boolean
          created_at?: string | null
        }
      }
      accessories: {
        Row: {
          id: string
          type: 'tripod' | 'reflector' | 'other'
          name: string
          quantity: number
          price: number
          is_active: boolean
        }
        Insert: {
          id?: string
          type: 'tripod' | 'reflector' | 'other'
          name: string
          quantity?: number
          price?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          type?: 'tripod' | 'reflector' | 'other'
          name?: string
          quantity?: number
          price?: number
          is_active?: boolean
        }
      }
      admins: {
        Row: {
          id: string
          username: string
          password_hash: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          name?: string
          created_at?: string | null
        }
      }
      employees: {
        Row: {
          id: string
          email: string
          name: string
          is_active: boolean
          approved_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          is_active?: boolean
          approved_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          is_active?: boolean
          approved_by?: string | null
          created_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          platforms: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          phone: string
          platforms?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          platforms?: string[] | null
          created_at?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          created_by: string | null
          pickup_time: string
          return_time: string
          payment_status: 'pending' | 'deposited' | 'paid' | 'cancelled'
          deposit_type: 'none' | 'default' | 'custom' | 'cccd' | 'vneid'
          deposit_amount: number
          cccd_name: string | null
          has_vneid: boolean
          total_rental_fee: number
          discount_percent: number
          discount_reason: string | null
          final_fee: number
          late_fee: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          created_by?: string | null
          pickup_time: string
          return_time: string
          payment_status?: 'pending' | 'deposited' | 'paid' | 'cancelled'
          deposit_type?: 'none' | 'default' | 'custom' | 'cccd' | 'vneid'
          deposit_amount?: number
          cccd_name?: string | null
          has_vneid?: boolean
          total_rental_fee?: number
          discount_percent?: number
          discount_reason?: string | null
          final_fee?: number
          late_fee?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          created_by?: string | null
          pickup_time?: string
          return_time?: string
          payment_status?: 'pending' | 'deposited' | 'paid' | 'cancelled'
          deposit_type?: 'none' | 'default' | 'custom' | 'cccd' | 'vneid'
          deposit_amount?: number
          cccd_name?: string | null
          has_vneid?: boolean
          total_rental_fee?: number
          discount_percent?: number
          discount_reason?: string | null
          final_fee?: number
          late_fee?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      booking_items: {
        Row: {
          id: string
          booking_id: string
          camera_id: string | null
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          booking_id: string
          camera_id?: string | null
          quantity?: number
          unit_price: number
          subtotal: number
        }
        Update: {
          id?: string
          booking_id?: string
          camera_id?: string | null
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
      }
      booking_accessories: {
        Row: {
          id: string
          booking_id: string
          accessory_type: string
          name: string | null
          quantity: number
          note: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          accessory_type: string
          name?: string | null
          quantity?: number
          note?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          accessory_type?: string
          name?: string | null
          quantity?: number
          note?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          booking_id: string
          type: 'pickup' | 'return'
          due_at: string
          completed_at: string | null
          staff_id: string | null
          location: string | null
          delivery_fee: number
        }
        Insert: {
          id?: string
          booking_id: string
          type: 'pickup' | 'return'
          due_at: string
          completed_at?: string | null
          staff_id?: string | null
          location?: string | null
          delivery_fee?: number
        }
        Update: {
          id?: string
          booking_id?: string
          type?: 'pickup' | 'return'
          due_at?: string
          completed_at?: string | null
          staff_id?: string | null
          location?: string | null
          delivery_fee?: number
        }
      }
      recovery_tasks: {
        Row: {
          id: string
          booking_id: string
          memory_card_code: string | null
          need_recovery: boolean
          need_upload: boolean
          is_recovered: boolean
          is_uploaded: boolean
          is_link_sent: boolean
          no_error_24h: boolean
          created_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          memory_card_code?: string | null
          need_recovery?: boolean
          need_upload?: boolean
          is_recovered?: boolean
          is_uploaded?: boolean
          is_link_sent?: boolean
          no_error_24h?: boolean
          created_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          memory_card_code?: string | null
          need_recovery?: boolean
          need_upload?: boolean
          is_recovered?: boolean
          is_uploaded?: boolean
          is_link_sent?: boolean
          no_error_24h?: boolean
          created_at?: string | null
          completed_at?: string | null
        }
      }
    }
    Functions: {
      check_camera_availability: {
        Args: {
          p_camera_id: string
          p_pickup_time: string
          p_return_time: string
          p_quantity?: number
        }
        Returns: number
      }
      get_available_cameras: {
        Args: {
          p_pickup_time: string
          p_return_time: string
        }
        Returns: {
          camera_id: string
          name: string
          model_line: string | null
          price_6h: number
          total_qty: number
          available_qty: number
        }[]
      }
    }
  }
}

// Helper types
export type Settings = Database['public']['Tables']['settings']['Row']
export type Camera = Database['public']['Tables']['cameras']['Row']
export type Accessory = Database['public']['Tables']['accessories']['Row']
export type Admin = Database['public']['Tables']['admins']['Row']
export type Employee = Database['public']['Tables']['employees']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingItem = Database['public']['Tables']['booking_items']['Row']
export type BookingAccessory = Database['public']['Tables']['booking_accessories']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type RecoveryTask = Database['public']['Tables']['recovery_tasks']['Row']

export type PaymentStatus = 'pending' | 'deposited' | 'paid' | 'cancelled'
export type DepositType = 'none' | 'default' | 'custom' | 'cccd'
export type TaskType = 'pickup' | 'return'
export type AccessoryType = 'tripod' | 'reflector' | 'other'

