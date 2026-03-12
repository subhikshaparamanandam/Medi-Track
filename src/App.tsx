/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity as ActivityIcon, 
  Heart, 
  Footprints, 
  Moon, 
  Droplets, 
  Plus, 
  Bell, 
  Search, 
  ArrowLeft, 
  Star, 
  Calendar, 
  User as UserIcon, 
  ChevronRight, 
  CheckCircle2, 
  Pill, 
  CreditCard,
  Settings,
  LogOut,
  HelpCircle,
  Lock,
  Stethoscope,
  LayoutDashboard,
  TrendingUp,
  Trophy,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { User, Metric, Doctor, Activity, Appointment, Insight } from './types';
import { getHealthInsights } from './services/geminiService';

type View = 'home' | 'vitals' | 'doctors' | 'profile' | 'booking';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, metricsRes, doctorsRes, activityRes, appointmentsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/metrics'),
          fetch('/api/doctors'),
          fetch('/api/activity'),
          fetch('/api/appointments')
        ]);

        const userData = await userRes.json();
        const metricsData = await metricsRes.json();
        const doctorsData = await doctorsRes.json();
        const activityData = await activityRes.json();
        const appointmentsData = await appointmentsRes.json();

        setUser(userData);
        setMetrics(metricsData);
        setDoctors(doctorsData);
        setActivities(activityData);
        setAppointments(appointmentsData);

        // Fetch insights from frontend service
        const insightsData = await getHealthInsights(metricsData);
        setInsights(insightsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setCurrentView('booking');
  };

  const confirmBooking = async (date: string, time: string) => {
    if (!selectedDoctor) return;
    
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          date,
          time,
          type: 'In-person'
        })
      });
      
      if (res.ok) {
        // Refresh appointments
        const apptRes = await fetch('/api/appointments');
        setAppointments(await apptRes.json());
        setCurrentView('home');
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <HomeView 
              key="home"
              user={user} 
              metrics={metrics} 
              appointments={appointments} 
              activities={activities} 
              insights={insights}
              onNavigate={setCurrentView}
            />
          )}
          {currentView === 'doctors' && (
            <DoctorsView 
              key="doctors"
              doctors={doctors} 
              onBack={() => setCurrentView('home')} 
              onBook={handleBookAppointment}
            />
          )}
          {currentView === 'booking' && selectedDoctor && (
            <BookingView 
              key="booking"
              doctor={selectedDoctor} 
              onBack={() => setCurrentView('doctors')} 
              onConfirm={confirmBooking}
            />
          )}
          {currentView === 'profile' && user && (
            <ProfileView 
              key="profile"
              user={user} 
              onBack={() => setCurrentView('home')} 
            />
          )}
          {currentView === 'vitals' && (
            <VitalsView 
              key="vitals"
              metrics={metrics} 
              insights={insights}
              onBack={() => setCurrentView('home')}
            />
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        {currentView !== 'booking' && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-lg border-t border-slate-100 flex items-center justify-around px-6 py-3 z-50">
            <NavButton active={currentView === 'home'} icon={<LayoutDashboard size={20} />} label="Home" onClick={() => setCurrentView('home')} />
            <NavButton active={currentView === 'vitals'} icon={<TrendingUp size={20} />} label="Vitals" onClick={() => setCurrentView('vitals')} />
            <div className="relative -top-8">
              <button 
                onClick={() => setCurrentView('doctors')}
                className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center border-4 border-slate-50 active:scale-95 transition-transform"
              >
                <Plus size={32} />
              </button>
            </div>
            <NavButton active={currentView === 'doctors'} icon={<Stethoscope size={20} />} label="Doctors" onClick={() => setCurrentView('doctors')} />
            <NavButton active={currentView === 'profile'} icon={<UserIcon size={20} />} label="Profile" onClick={() => setCurrentView('profile')} />
          </nav>
        )}
      </div>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function HomeView({ user, metrics, appointments, activities, insights, onNavigate }: any) {
  const upcoming = appointments.find((a: any) => a.status === 'upcoming');

  return (
    <motion.main 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto pb-24"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <img src={user?.avatar_url} className="w-10 h-10 rounded-full border border-blue-100" alt="Avatar" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Good Morning</p>
            <h1 className="text-lg font-bold leading-tight">{user?.name}</h1>
          </div>
        </div>
        <button className="relative p-2 rounded-full bg-slate-50 text-slate-600">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </header>

      {/* Stats Grid */}
      <section className="px-6 grid grid-cols-3 gap-3">
        {metrics.slice(0, 3).map((m: Metric) => (
          <div key={m.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              m.type === 'steps' ? 'bg-orange-50 text-orange-600' : 
              m.type === 'heart' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {m.type === 'steps' ? <Footprints size={16} /> : m.type === 'heart' ? <Heart size={16} /> : <Moon size={16} />}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{m.type}</p>
              <p className="text-sm font-bold">{m.value} <span className="text-[10px] font-normal text-slate-400">{m.unit}</span></p>
            </div>
          </div>
        ))}
      </section>

      {/* Upcoming Appointment */}
      <section className="px-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Upcoming Appointment</h3>
          <button onClick={() => onNavigate('doctors')} className="text-sm font-semibold text-blue-600">View All</button>
        </div>
        {upcoming ? (
          <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-100 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <img src={upcoming.doctor_avatar} className="w-14 h-14 rounded-xl border border-white/20 object-cover" alt="Doctor" />
              <div>
                <h4 className="font-bold text-lg leading-tight">{upcoming.doctor_name}</h4>
                <p className="text-blue-100 text-sm">{upcoming.doctor_specialty} • Specialist</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="text-sm font-medium">{upcoming.date}</span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <div className="flex items-center gap-2">
                <ActivityIcon size={14} />
                <span className="text-sm font-medium">{upcoming.time}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-8 text-center border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm">No upcoming appointments</p>
            <button onClick={() => onNavigate('doctors')} className="mt-2 text-blue-600 font-bold text-sm">Book one now</button>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="px-6 mt-8">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <button onClick={() => onNavigate('doctors')} className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 group active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus size={24} />
            </div>
            <span className="text-sm font-semibold">Book Appointment</span>
          </button>
          <button className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 group active:scale-95 transition-transform">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ActivityIcon size={24} />
            </div>
            <span className="text-sm font-semibold">View Reports</span>
          </button>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-6 mt-8">
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {activities.map((a: Activity) => (
            <div key={a.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-50 shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                a.type === 'check' ? 'bg-emerald-50 text-emerald-600' : 
                a.type === 'meds' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {a.type === 'check' ? <CheckCircle2 size={20} /> : a.type === 'meds' ? <Pill size={20} /> : <CreditCard size={20} />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{a.title}</p>
                <p className="text-xs text-slate-500">{a.description}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">{a.timestamp}</span>
            </div>
          ))}
        </div>
      </section>
    </motion.main>
  );
}

function DoctorsView({ doctors, onBack, onBook }: any) {
  return (
    <motion.main 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto pb-24"
    >
      <header className="sticky top-0 bg-white/80 backdrop-blur-md px-6 pt-6 pb-4 z-10">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Find Doctors</h1>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search doctors, specialties..." 
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
      </header>

      <section className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Top Specialists</h3>
          <button className="text-sm font-semibold text-blue-600">See All</button>
        </div>
        <div className="space-y-4">
          {doctors.map((d: Doctor) => (
            <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="relative">
                  <img src={d.avatar_url} className="w-24 h-24 rounded-2xl object-cover" alt={d.name} />
                  {d.available_today === 1 && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{d.name}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{d.specialty}</p>
                    </div>
                    <button className="text-slate-200 hover:text-red-500 transition-colors">
                      <Heart size={20} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold">{d.rating}</span>
                    <span className="text-xs text-slate-400">({d.reviews_count} Reviews)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
                  d.available_today === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                }`}>
                  {d.available_today === 1 ? 'Available Today' : 'Next: Tomorrow'}
                </span>
                <button 
                  onClick={() => onBook(d)}
                  className="bg-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.main>
  );
}

function BookingView({ doctor, onBack, onConfirm }: any) {
  const [selectedDate, setSelectedDate] = useState('Wed 25');
  const [selectedTime, setSelectedTime] = useState('11:00 AM');

  const dates = ['Mon 23', 'Tue 24', 'Wed 25', 'Thu 26', 'Fri 27'];
  const times = ['09:00 AM', '09:30 AM', '10:00 AM', '11:00 AM', '11:30 AM', '12:30 PM', '02:00 PM', '03:30 PM', '04:00 PM'];

  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex-1 flex flex-col"
    >
      <header className="flex items-center p-6 justify-between border-b border-slate-50">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">Book Appointment</h2>
        <div className="w-10"></div>
      </header>

      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Select Date</h3>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {dates.map(date => (
            <button 
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl transition-all ${
                selectedDate === date ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400 border border-transparent'
              }`}
            >
              <span className="text-[10px] font-bold uppercase">{date.split(' ')[0]}</span>
              <span className="text-lg font-bold">{date.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mt-8 mb-4">Available Slots</h3>
        <div className="grid grid-cols-3 gap-3">
          {times.map(time => (
            <button 
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                selectedTime === time ? 'bg-blue-50 text-blue-600 border-2 border-blue-600' : 'bg-white border border-slate-100 text-slate-600 hover:border-blue-200'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white border-t border-slate-50">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm">
            <p className="text-slate-400">Selected: <span className="text-slate-900 font-bold">{selectedDate}, {selectedTime}</span></p>
          </div>
          <p className="text-blue-600 font-bold text-lg">$45.00</p>
        </div>
        <button 
          onClick={() => onConfirm(selectedDate, selectedTime)}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Confirm Booking
          <ChevronRight size={20} />
        </button>
      </div>
    </motion.main>
  );
}

function ProfileView({ user, onBack }: any) {
  return (
    <motion.main 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto pb-24"
    >
      <header className="flex items-center p-6 justify-between border-b border-slate-50">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">Profile</h2>
        <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
          <Settings size={20} />
        </button>
      </header>

      <div className="p-8 flex flex-col items-center">
        <img src={user.avatar_url} className="w-32 h-32 rounded-full border-4 border-blue-50 shadow-xl mb-4" alt="Profile" />
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <p className="text-slate-400 text-sm font-medium">Member since {user.member_since}</p>
      </div>

      <div className="px-6 space-y-6">
        <div className="bg-blue-50/50 rounded-2xl p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Health Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Blood Type</span>
              <span className="text-sm font-bold text-blue-600">{user.blood_type}</span>
            </div>
            <div className="h-px bg-slate-100"></div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Allergies</span>
              <span className="text-sm font-bold">{user.allergies}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <ProfileLink icon={<Bell size={18} />} label="Notifications" />
          <ProfileLink icon={<Lock size={18} />} label="Privacy & Security" />
          <ProfileLink icon={<HelpCircle size={18} />} label="Help Center" />
        </div>

        <button className="w-full bg-slate-50 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors mt-4">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </motion.main>
  );
}

function ProfileLink({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="w-full flex items-center justify-between py-4 border-b border-slate-50 group">
      <div className="flex items-center gap-4 text-slate-500 group-hover:text-blue-600 transition-colors">
        {icon}
        <span className="text-sm font-bold text-slate-900">{label}</span>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );
}

function VitalsView({ metrics, insights, onBack }: any) {
  const [height, setHeight] = useState<string>('170');
  const [weight, setWeight] = useState<string>('70');
  const [bmi, setBmi] = useState<number | null>(null);

  const todayMetrics = metrics.filter((m: any) => m.date === '2026-03-12');
  const stepsData = metrics
    .filter((m: any) => m.type === 'steps')
    .map((m: any) => ({ date: m.date.split('-').slice(1).join('/'), value: parseInt(m.value.replace(',', '')) }));
  
  const heartData = metrics
    .filter((m: any) => m.type === 'heart')
    .map((m: any) => ({ date: m.date.split('-').slice(1).join('/'), value: parseInt(m.value) }));

  useEffect(() => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      setBmi(parseFloat((w / (h * h)).toFixed(1)));
    } else {
      setBmi(null);
    }
  }, [height, weight]);

  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
    if (val < 25) return { label: 'Normal', color: 'text-emerald-500' };
    if (val < 30) return { label: 'Overweight', color: 'text-amber-500' };
    return { label: 'Obese', color: 'text-rose-500' };
  };

  return (
    <motion.main 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto pb-24"
    >
      <header className="flex items-center p-6 justify-between border-b border-slate-50">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">Health Metrics</h2>
        <div className="w-10"></div>
      </header>

      <div className="p-6">
        <div className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-100 text-white relative overflow-hidden mb-8">
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium opacity-80">Daily Overview</p>
            <h2 className="text-3xl font-bold mt-1">Excellent</h2>
            <p className="text-sm mt-2 opacity-90">You've reached 85% of your daily goals. Keep it up!</p>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Core Metrics</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {todayMetrics.map((m: Metric) => (
            <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                m.type === 'steps' ? 'bg-orange-50 text-orange-600' : 
                m.type === 'heart' ? 'bg-red-50 text-red-600' : 
                m.type === 'sleep' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {m.type === 'steps' ? <Footprints size={24} /> : 
                 m.type === 'heart' ? <Heart size={24} /> : 
                 m.type === 'sleep' ? <Moon size={24} /> : <Droplets size={24} />}
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{m.type}</p>
              <p className="text-lg font-bold mt-1">{m.value} <span className="text-xs font-normal text-slate-400">{m.unit}</span></p>
              <span className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${
                m.trend.includes('+') ? 'text-emerald-500' : m.trend.includes('-') ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {m.trend.includes('+') ? <TrendingUp size={10} /> : m.trend.includes('-') ? <TrendingUp size={10} className="rotate-180" /> : null}
                {m.trend}
              </span>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Weekly Trends</h3>
        <div className="space-y-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold mb-4">Steps Activity</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stepsData}>
                  <defs>
                    <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1c74e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#1c74e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#1c74e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSteps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold mb-4">Heart Rate (BPM)</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={heartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={2} dot={{ r: 4, fill: '#e11d48' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* BMI Calculator */}
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">BMI Calculator</h3>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Height (cm)</label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Weight (kg)</label>
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          
          {bmi && (
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-xs text-slate-500 font-medium">Your BMI is</p>
              <p className="text-3xl font-black text-blue-600 my-1">{bmi}</p>
              <p className={`text-sm font-bold ${getBmiCategory(bmi).color}`}>
                {getBmiCategory(bmi).label}
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-900 mb-3">BMI Categories</h4>
            <div className="grid grid-cols-2 gap-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] text-slate-500 font-medium">&lt; 18.5: Underweight</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-slate-500 font-medium">18.5 - 24.9: Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[10px] text-slate-500 font-medium">25 - 29.9: Overweight</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-[10px] text-slate-500 font-medium">&gt; 30: Obese</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">Smart Insights</h3>
        <div className="space-y-3">
          {insights.map((insight: Insight, idx: number) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className={`p-2 rounded-xl ${idx === 0 ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                {idx === 0 ? <Lightbulb size={20} /> : <Trophy size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold">{insight.title}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.main>
  );
}
