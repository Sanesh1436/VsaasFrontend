import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTickets } from '../../context/TicketContext';
import StatsWidget from '../../components/StatsWidget';
import DetectionTypeIcon from '../../components/DetectionTypeIcon';
import {
  BarChart3, TrendingUp, Users, Eye, ShieldAlert,
  ScanFace, HardHat, ListOrdered, Clock, UserCheck,
  VideoOff, Flame, Activity, Fingerprint, Timer
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement);

const AnalyticsDashboard = () => {
  const { theme } = useTheme();
  const { analyticsData, tickets, agents } = useTickets();
  const [timeRange, setTimeRange] = useState('7d');

  const cs = getComputedStyle(document.documentElement);
  const chartLine = cs.getPropertyValue('--chart-line').trim() || '#950606';
  const chartFill = cs.getPropertyValue('--chart-fill').trim() || 'rgba(149,6,6,0.1)';
  const chartGrid = cs.getPropertyValue('--chart-grid').trim() || '#2a2f2f';
  const chartTick = cs.getPropertyValue('--chart-tick').trim() || '#6b7280';
  const primary = cs.getPropertyValue('--primary').trim() || '#950606';

  const totalAlerts = Object.values(analyticsData.detection_counts).reduce((a, b) => a + b, 0);

  // Line chart â€” Alerts over time
  const lineData = {
    labels: analyticsData.alerts_over_time.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      { label: 'Total', data: analyticsData.alerts_over_time.map(d => d.count), borderColor: chartLine, backgroundColor: chartFill, fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: chartLine, borderWidth: 2 },
      { label: 'Intrusion', data: analyticsData.alerts_over_time.map(d => d.intrusion), borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 1.5, borderDash: [5, 5] },
      { label: 'Crowd', data: analyticsData.alerts_over_time.map(d => d.crowd), borderColor: '#8b5cf6', backgroundColor: 'transparent', tension: 0.4, pointRadius: 3, borderWidth: 1.5, borderDash: [5, 5] },
    ]
  };

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: chartTick, usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } } },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#f8fafc', padding: 12, cornerRadius: 12 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartTick, font: { size: 11 } } },
      y: { grid: { color: chartGrid }, ticks: { color: chartTick, font: { size: 11 } }, beginAtZero: true }
    }
  };

  // Bar chart â€” Agent performance
  const barData = {
    labels: analyticsData.agent_performance.map(a => a.name.split(' ')[1] || a.name),
    datasets: [
      { label: 'Resolved', data: analyticsData.agent_performance.map(a => a.resolved), backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 6 },
      { label: 'Pending', data: analyticsData.agent_performance.map(a => a.pending), backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 6 },
    ]
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { color: chartTick, usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } } },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#94a3b8', bodyColor: '#f8fafc', padding: 12, cornerRadius: 12 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: chartTick, font: { size: 11 } } },
      y: { grid: { color: chartGrid }, ticks: { color: chartTick, font: { size: 11 } }, beginAtZero: true }
    }
  };

  // Doughnut â€” Detection categories
  const categoryTotals = { Security: 0, 'Human Activity': 0, Analytics: 0, 'Advanced AI': 0 };
  Object.entries(analyticsData.detection_counts).forEach(([key, val]) => {
    const found = [
      { names: ['Camera Blackout', 'Intrusion Crossing', 'Unauthorized Tracking', 'Object Missing', 'Unattended Object'], cat: 'Security' },
      { names: ['Crowd Detection', 'Loitering Detection', 'Staff Presence', 'Staff Seat Absence', 'Stay Duration'], cat: 'Human Activity' },
      { names: ['Visitor Count (Total)', 'Visitor Unique', 'Visitor Repeat', 'Waiting Time', 'Queue Management', 'Seat Occupancy Time'], cat: 'Analytics' },
      { names: ['Face Recognition', 'Gender Detection', 'PPE Detection'], cat: 'Advanced AI' },
    ].find(c => c.names.includes(key));
    if (found) categoryTotals[found.cat] += val;
  });

  const doughnutData = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: ['#ef4444', '#8b5cf6', '#3b82f6', '#f59e0b'],
      borderWidth: 0,
      spacing: 4,
      borderRadius: 4,
    }]
  };

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: chartTick, usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 11 } } },
    }
  };

  // Visitor hourly chart
  const visitorLineData = {
    labels: analyticsData.visitor_stats.hourly_data.map(h => h.hour),
    datasets: [
      { label: 'Total', data: analyticsData.visitor_stats.hourly_data.map(h => h.total), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4, borderWidth: 2 },
      { label: 'Unique', data: analyticsData.visitor_stats.hourly_data.map(h => h.unique), borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.4, borderWidth: 1.5, borderDash: [5, 5] },
    ]
  };

  return (
    <div className="space-y-8">
      {/* Time Range Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Activity size={22} style={{ color: 'var(--primary)' }} /> Analytics Overview
        </h2>
        <div className="flex gap-1.5 p-1.5 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
          {['24h', '7d', '30d'].map(r => (
            <button key={r} onClick={() => setTimeRange(r)}
              className="px-5 py-2 rounded-lg text-xs font-bold transition-all"
              style={timeRange === r
                ? { background: 'var(--primary)', color: 'white' }
                : { background: 'transparent', color: 'var(--text-muted)' }
              }>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-5">
        <StatsWidget label="Total Alerts" value={totalAlerts} icon={ShieldAlert} color="#ef4444" trend="up" trendValue="+12%" />
        <StatsWidget label="Intrusion Events" value={analyticsData.detection_counts['Intrusion Crossing']} icon={ShieldAlert} color="#ef4444" trend="up" trendValue="+3" />
        <StatsWidget label="Crowd Alerts" value={analyticsData.detection_counts['Crowd Detection']} icon={Users} color="#8b5cf6" trend="down" trendValue="-5" />
        <StatsWidget label="PPE Violations" value={analyticsData.detection_counts['PPE Detection']} icon={HardHat} color="#f59e0b" trend="up" trendValue="+8" />
        <StatsWidget label="Camera Blackouts" value={analyticsData.detection_counts['Camera Blackout']} icon={VideoOff} color="#6366f1" />
        <StatsWidget label="Face Scans Today" value={analyticsData.face_recognition.total_scans_today} icon={ScanFace} color="#3b82f6" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-7">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2 card">
          <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp style={{ color: 'var(--primary)' }} size={18} /> Alerts Over Time
          </h3>
          <div className="h-[300px]">
            <Line key={`line-${theme}`} data={lineData} options={lineOptions} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 style={{ color: 'var(--primary)' }} size={18} /> By Category
          </h3>
          <div className="h-[260px]">
            <Doughnut key={`doughnut-${theme}`} data={doughnutData} options={doughnutOptions} />
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
        <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 style={{ color: 'var(--primary)' }} size={18} /> Agent Performance
        </h3>
        <div className="h-[280px]">
          <Bar key={`bar-${theme}`} data={barData} options={barOptions} />
        </div>
      </motion.div>

      {/* Detection-wise Counts Table */}
      <div className="card">
        <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Eye style={{ color: 'var(--primary)' }} size={18} /> Detection-wise Counts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(analyticsData.detection_counts).map(([type, count]) => {
            const categories = {
              'Camera Blackout': 'Security', 'Intrusion Crossing': 'Security', 'Unauthorized Tracking': 'Security',
              'Object Missing': 'Security', 'Unattended Object': 'Security',
              'Crowd Detection': 'Human Activity', 'Loitering Detection': 'Human Activity', 'Staff Presence': 'Human Activity',
              'Staff Seat Absence': 'Human Activity', 'Stay Duration': 'Human Activity',
              'Visitor Count (Total)': 'Analytics', 'Visitor Unique': 'Analytics', 'Visitor Repeat': 'Analytics',
              'Waiting Time': 'Analytics', 'Queue Management': 'Analytics', 'Seat Occupancy Time': 'Analytics',
              'Face Recognition': 'Advanced AI', 'Gender Detection': 'Advanced AI', 'PPE Detection': 'Advanced AI',
            };
            return (
              <div key={type} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)' }}>
                <DetectionTypeIcon type={type} category={categories[type]} size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{type}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{categories[type]}</p>
                </div>
                <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">
        {/* Visitor Analytics Panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <Fingerprint style={{ color: '#3b82f6' }} size={18} /> Visitor Analytics
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-2xl font-black" style={{ color: '#3b82f6' }}>{analyticsData.visitor_stats.total_today}</p>
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Total</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-2xl font-black" style={{ color: '#10b981' }}>{analyticsData.visitor_stats.unique_today}</p>
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Unique</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-2xl font-black" style={{ color: '#f59e0b' }}>{analyticsData.visitor_stats.repeat_today}</p>
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Repeat</p>
            </div>
          </div>
          <div className="flex items-center gap-5 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Avg Stay: <strong style={{ color: 'var(--text-primary)' }}>{analyticsData.visitor_stats.avg_stay_minutes} min</strong></span>
            <span>Peak: <strong style={{ color: 'var(--text-primary)' }}>{analyticsData.visitor_stats.peak_hour}</strong></span>
          </div>
          <div className="h-[180px]">
            <Line key={`visitor-${theme}`} data={visitorLineData} options={{ ...lineOptions, plugins: { ...lineOptions.plugins, legend: { ...lineOptions.plugins.legend, labels: { ...lineOptions.plugins.legend.labels, font: { size: 10 } } } } }} />
          </div>
        </motion.div>

        {/* Queue Monitoring Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <ListOrdered style={{ color: '#f59e0b' }} size={18} /> Queue Monitoring
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{analyticsData.queue_stats.current_queue_length}</p>
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Current Queue</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{analyticsData.queue_stats.avg_wait_time_mins} min</p>
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Avg Wait</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{analyticsData.queue_stats.service_rate_per_hour}/hr</p>
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Service Rate</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-2xl font-black" style={{ color: 'var(--success)' }}>{analyticsData.queue_stats.total_served_today}</p>
              <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Served Today</p>
            </div>
          </div>
          <div className="space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Active Queues</p>
            {analyticsData.queue_stats.queues.map((q, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <span className="text-xs font-bold flex-1" style={{ color: 'var(--text-primary)' }}>{q.name}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{q.length} in queue</span>
                <span className="text-xs font-mono" style={{ color: q.avg_wait > 10 ? 'var(--danger)' : 'var(--text-muted)' }}>{q.avg_wait} min</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-7">
        {/* Staff Activity Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <UserCheck style={{ color: '#10b981' }} size={18} /> Staff Activity
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Presence Rate</span>
              <span className="text-lg font-black" style={{ color: 'var(--success)' }}>{analyticsData.staff_stats.presence_pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full" style={{ width: `${analyticsData.staff_stats.presence_pct}%`, background: 'var(--success)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xl font-black" style={{ color: 'var(--success)' }}>{analyticsData.staff_stats.present}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Present</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xl font-black" style={{ color: 'var(--danger)' }}>{analyticsData.staff_stats.absent}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Absent</p>
              </div>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Seat Absences: <strong>{analyticsData.staff_stats.seat_absences_today}</strong></span>
              <span>Compliance: <strong>{analyticsData.staff_stats.shift_compliance}%</strong></span>
            </div>
          </div>
        </motion.div>

        {/* Camera Health Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <VideoOff style={{ color: '#6366f1' }} size={18} /> Camera Health
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xl font-black" style={{ color: 'var(--success)' }}>{analyticsData.camera_health.active}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Active</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xl font-black" style={{ color: 'var(--danger)' }}>{analyticsData.camera_health.offline}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Offline</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{analyticsData.camera_health.avg_uptime_pct}%</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Uptime</p>
            </div>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Blackout Events Today: <strong style={{ color: 'var(--danger)' }}>{analyticsData.camera_health.blackout_events_today}</strong></p>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
            {analyticsData.camera_health.cameras.slice(0, 6).map((cam, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cam.is_active ? 'var(--success)' : 'var(--danger)' }} />
                <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{cam.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{cam.uptime_pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Face Recognition Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <h3 className="text-base font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <ScanFace style={{ color: '#f59e0b' }} size={18} /> Face Recognition
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Recognition Rate</span>
              <span className="text-lg font-black" style={{ color: 'var(--success)' }}>{analyticsData.face_recognition.recognition_rate}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full" style={{ width: `${analyticsData.face_recognition.recognition_rate}%`, background: 'var(--success)' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xl font-black" style={{ color: 'var(--success)' }}>{analyticsData.face_recognition.recognized}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Recognized</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xl font-black" style={{ color: 'var(--warning)' }}>{analyticsData.face_recognition.unknown}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Unknown</p>
              </div>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Male: <strong>{analyticsData.face_recognition.male}</strong></span>
              <span>Female: <strong>{analyticsData.face_recognition.female}</strong></span>
              <span>Alerts: <strong style={{ color: 'var(--danger)' }}>{analyticsData.face_recognition.alerts_triggered}</strong></span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
