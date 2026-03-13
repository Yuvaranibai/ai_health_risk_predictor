import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Activity, MapPin, AlertTriangle, 
  Search, Filter, ArrowLeft, Download,
  Heart, Thermometer, Wind, ShieldAlert,
  ChevronRight, Calendar, User, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card3D, Header, Title3D, Button3D, cn } from '../components/UI';
import * as d3 from 'd3';

interface Screening {
  id: number;
  patient_name: string;
  age: number;
  sex: string;
  village: string;
  district: string;
  contact: string;
  email: string;
  symptoms: string;
  medical_history: string;
  risk_level: string;
  risk_score: number;
  explanation: string;
  created_at: string;
  lat: number;
  lng: number;
}

export default function CHWDashboard() {
  const navigate = useNavigate();
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const heatmapRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/chw/screenings');
      const data = await response.json();
      setScreenings(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch screenings", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (screenings.length > 0 && heatmapRef.current) {
      drawHeatmap();
    }
  }, [screenings]);

  const drawHeatmap = () => {
    const svg = d3.select(heatmapRef.current);
    svg.selectAll("*").remove();

    const width = heatmapRef.current?.clientWidth || 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    // Group by village
    const villageData = d3.rollups(
      screenings,
      (v: Screening[]) => v.length,
      (d: Screening) => d.village
    ).map(([village, count]) => ({ village, count }));

    const x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .domain(villageData.map(d => d.village))
      .padding(0.1);

    const y = d3.scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain([0, d3.max(villageData, d => d.count) || 10]);

    const color = d3.scaleSequential(d3.interpolateOrRd)
      .domain([0, d3.max(villageData, d => d.count) || 10]);

    // Add bars
    svg.append("g")
      .selectAll("rect")
      .data(villageData)
      .join("rect")
      .attr("x", d => x(d.village) || 0)
      .attr("y", d => y(d.count))
      .attr("width", x.bandwidth())
      .attr("height", d => height - margin.bottom - y(d.count))
      .attr("fill", d => color(d.count))
      .attr("rx", 4)
      .attr("class", "cursor-pointer hover:opacity-80 transition-opacity")
      .append("title")
      .text(d => `${d.village}: ${d.count} cases`);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-family", "Inter")
      .style("font-size", "10px")
      .style("color", "#94a3b8");

    // Add Y axis
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-family", "Inter")
      .style("font-size", "10px")
      .style("color", "#94a3b8");
  };

  const diseaseData = d3.rollups(
    screenings.flatMap(s => {
      try {
        return JSON.parse(s.symptoms || "[]") as string[];
      } catch (e) {
        return [] as string[];
      }
    }),
    (v: string[]) => v.length,
    (d: string) => d
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const filteredScreenings = screenings.filter(s => {
    const matchesSearch = s.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.village.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'All' || s.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const stats = {
    total: screenings.length,
    high: screenings.filter(s => s.risk_level === 'High').length,
    medium: screenings.filter(s => s.risk_level === 'Medium').length,
    low: screenings.filter(s => s.risk_level === 'Low').length,
  };

  const handleExportCSV = () => {
    if (screenings.length === 0) return;
    
    const headers = ['Name', 'Age', 'Sex', 'Village', 'Risk Level', 'Risk Score', 'Date'];
    const rows = screenings.map(s => [
      s.patient_name,
      s.age,
      s.sex,
      s.village,
      s.risk_level,
      s.risk_score,
      new Date(s.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `health_surveillance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintRecord = (s: Screening) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let symptomsList = [];
    try {
      symptomsList = JSON.parse(s.symptoms || "[]");
    } catch (e) {
      symptomsList = [s.symptoms];
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Health Report - ${s.patient_name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-left: 4px solid #10b981; padding-left: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-weight: 700; color: #475569; font-size: 12px; }
            .value { font-size: 14px; margin-bottom: 5px; }
            .risk-badge { display: inline-block; padding: 5px 15px; rounded: 20px; font-weight: 900; color: white; text-transform: uppercase; font-size: 12px; border-radius: 20px; }
            .risk-High { background-color: #ef4444; }
            .risk-Medium { background-color: #f59e0b; }
            .risk-Low { background-color: #10b981; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Patient Health Report</div>
            <div style="font-size: 12px; color: #64748b;">Report Date: ${new Date(s.created_at).toLocaleString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Patient Details</div>
            <div class="grid">
              <div>
                <div class="label">Name</div>
                <div class="value">${s.patient_name}</div>
                <div class="label">Age / Sex</div>
                <div class="value">${s.age}Y / ${s.sex}</div>
              </div>
              <div>
                <div class="label">Location</div>
                <div class="value">${s.village}, ${s.district}</div>
                <div class="label">Contact</div>
                <div class="value">${s.contact || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Risk Assessment</div>
            <div class="grid">
              <div>
                <div class="label">Risk Level</div>
                <div class="risk-badge risk-${s.risk_level}">${s.risk_level}</div>
              </div>
              <div>
                <div class="label">Risk Score</div>
                <div class="value">${s.risk_score}/100</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Clinical Findings</div>
            <div class="value"><strong>Symptoms:</strong> ${symptomsList.join(', ')}</div>
            <div class="value"><strong>Medical History:</strong> ${s.medical_history || 'None reported'}</div>
          </div>

          <div class="section">
            <div class="section-title">AI Analysis</div>
            <div class="value">${s.explanation}</div>
          </div>

          <div class="footer">
            This document is a digital health record generated by the AI Health Risk Predictor.
          </div>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-3 glass-morphism rounded-xl text-slate-400 hover:text-emerald-500 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <Title3D text="COMMUNITY WORKER DASHBOARD" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Village Health Surveillance System</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button3D onClick={handleExportCSV} className="bg-slate-800 text-white border-white/5">
              <Download size={16} className="mr-2" /> Export Data
            </Button3D>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Screened', value: stats.total, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { label: 'High Risk', value: stats.high, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Medium Risk', value: stats.medium, icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Low Risk', value: stats.low, icon: Heart, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <Card3D key={i} className="p-6 border-white/5 bg-brand-surface/20">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                  <stat.icon size={24} />
                </div>
                <span className="text-3xl font-black text-white italic">{stat.value}</span>
              </div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</h4>
            </Card3D>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Heatmap Section */}
          <Card3D className="lg:col-span-2 p-8 border-white/5 bg-brand-surface/20 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Disease Spread Heatmap</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Cases by Village / Area</p>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                  <div className="w-3 h-3 bg-rose-500 rounded-full" /> High
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" /> Low
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-[400px] glass-morphism rounded-3xl p-4 overflow-hidden">
              <svg ref={heatmapRef} className="w-full h-full" />
            </div>
          </Card3D>

          {/* Disease Breakdown */}
          <Card3D className="p-8 border-white/5 bg-brand-surface/20 flex flex-col gap-6">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Top Symptoms</h3>
            <div className="flex flex-col gap-4">
              {diseaseData.map(([disease, count], i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>{disease}</span>
                    <span>{count} cases</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / screenings.length) * 100}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              ))}
              {diseaseData.length === 0 && (
                <p className="text-center py-10 text-[10px] font-black text-slate-600 uppercase tracking-widest">No data available</p>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-white/5">
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">Critical Alerts</h3>
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                {screenings.filter(s => s.risk_level === 'High').slice(0, 5).map((s, i) => (
                  <div key={i} className="p-4 glass-morphism rounded-2xl border-l-4 border-l-rose-500 border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-white uppercase">{s.patient_name}</span>
                      <span className="text-[8px] font-black bg-rose-500 text-white px-2 py-1 rounded-full">EMERGENCY</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <MapPin size={10} /> {s.village}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card3D>
        </div>

        {/* Screening Details Table */}
        <Card3D className="p-8 border-white/5 bg-brand-surface/20 flex flex-col gap-6 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Screening Records</h3>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text"
                  placeholder="Search patient or village..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 glass-morphism rounded-xl border-white/10 text-white text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-64"
                />
              </div>
              <select 
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-4 py-2 glass-morphism rounded-xl border-white/10 text-white text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="All">All Risk Levels</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Patient</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Symptoms</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredScreenings.map((s, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                          <User size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-white uppercase">{s.patient_name}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{s.age}Y • {s.sex}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{s.village}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{s.district}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(s.symptoms || "[]").slice(0, 2).map((sym: string, j: number) => (
                          <span key={j} className="text-[8px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {sym}
                          </span>
                        ))}
                        {JSON.parse(s.symptoms || "[]").length > 2 && (
                          <span className="text-[8px] font-black text-slate-600">+{JSON.parse(s.symptoms || "[]").length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                        s.risk_level === 'High' ? "bg-rose-500/20 text-rose-500" :
                        s.risk_level === 'Medium' ? "bg-amber-500/20 text-amber-500" :
                        "bg-emerald-500/20 text-emerald-500"
                      )}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handlePrintRecord(s)}
                          className="p-2 glass-morphism rounded-lg text-slate-500 hover:text-emerald-500 transition-colors"
                          title="Print Report"
                        >
                          <Download size={16} />
                        </button>
                        <button className="p-2 glass-morphism rounded-lg text-slate-500 hover:text-white transition-colors">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card3D>
      </main>
    </div>
  );
}
