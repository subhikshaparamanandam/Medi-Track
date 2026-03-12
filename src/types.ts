export interface User {
  id: number;
  name: string;
  email: string;
  blood_type: string;
  allergies: string;
  member_since: string;
  avatar_url: string;
}

export interface Metric {
  id: number;
  type: string;
  value: string;
  unit: string;
  trend: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  reviews_count: number;
  avatar_url: string;
  available_today: number;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  type: string;
}

export interface Appointment {
  id: number;
  doctor_id: number;
  doctor_name: string;
  doctor_specialty: string;
  doctor_avatar: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

export interface Insight {
  title: string;
  description: string;
}
