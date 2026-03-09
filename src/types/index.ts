export type Mode = 'fint' | 'snusk'
export type OrderStatus = 'pending' | 'accepted' | 'declined' | 'completed'

export interface Profile {
  id: string
  name: string
  partner_id: string | null
  pairing_code: string
  created_at: string
}

export interface Service {
  id: string
  user_id: string
  title: string
  description: string | null
  mode: Mode
  active: boolean
  created_at: string
}

export interface Availability {
  id: string
  user_id: string
  date: string
  available: boolean
}

export interface Order {
  id: string
  from_user_id: string
  to_user_id: string
  service_id: string
  date: string | null
  status: OrderStatus
  note: string | null
  response_note: string | null
  mode: Mode
  created_at: string
  service?: Service
  from_profile?: Profile
  to_profile?: Profile
}

