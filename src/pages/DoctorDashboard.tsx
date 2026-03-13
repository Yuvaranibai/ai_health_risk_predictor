import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, ArrowLeft, RefreshCw, 
  CheckCircle, XCircle, Clock, Search,
  Filter, User, MapPin, Calendar
} from 'lucide-react';
import { Card3D, Header, Title3D, Button3D, cn } from '../components/UI';

export default function DoctorDashboard() {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'ignored'>('pending');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/dashboard');
      const data = await res.json();
      setScreenings(data);
    } catch (error) {
      console.error("Failed to fetch doctor dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/screenings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, doctor_notes: 'Reviewed and updated via Dashboard' })
      });
      setScreenings(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const filteredScreenings = screenings.filter(s => {
    if (filter === 'pending') return s.status === 'pending';
    return s.status === filter;
  });

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="p-3 glass-morphism rounded-xl text-slate-400 hover:text-emerald-500 transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <Title3D text="DOCTOR DASHBOARD" />
          <button 
            onClick={fetchDashboard}
            className="p-3 glass-morphism rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-colors"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats & Filter */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex gap-2 p-1 glass-morphism rounded-2xl border border-white/5">
            {(['pending', 'approved', 'ignored'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                  filter === f 
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                    : "text-slate-500 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 glass-morphism rounded-xl border border-white/5">
              <Clock size={14} className="text-amber-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {screenings.filter(s => s.status === 'pending').length} Pending
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <RefreshCw className="text-emerald-500 animate-spin w-12 h-12" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScreenings.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600 gap-4">
                <Stethoscope size={64} className="opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm">No {filter} screenings found</p>
              </div>
            ) : (
              filteredScreenings.map((s) => (
                <Card3D key={s.id} className="flex flex-col gap-4 border-white/5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 border border-white/5">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white uppercase italic tracking-tighter leading-none">{s.patient_name}</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                          {s.age}y • {s.sex}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                      s.risk_level === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                      s.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    )}>
                      {s.risk_level} Risk
                    </div>
                  </div>

                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin size={12} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{s.village}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(s.symptoms).map((sym: string, i: number) => (
                        <span key={i} className="text-[9px] font-black bg-white/5 border border-white/10 text-slate-400 px-2 py-1 rounded-lg uppercase tracking-widest">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>

                  {s.status === 'pending' && (
                    <div className="flex gap-3 mt-2">
                      <button 
                        onClick={() => updateStatus(s.id, 'approved')}
                        className="flex-1 bg-emerald-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button 
                        onClick={() => updateStatus(s.id, 'ignored')}
                        className="flex-1 bg-slate-800 text-slate-400 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle size={14} /> Ignore
                      </button>
                    </div>
                  )}

                  {s.status !== 'pending' && (
                    <div className={cn(
                      "mt-2 p-3 rounded-xl border text-center font-black uppercase text-[10px] tracking-widest",
                      s.status === 'approved' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-slate-800 text-slate-500 border-white/5'
                    )}>
                      Status: {s.status}
                    </div>
                  )}
                </Card3D>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
