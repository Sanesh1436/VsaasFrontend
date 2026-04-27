import React from 'react';
import {
  VideoOff, ShieldAlert, UserX, PackageX, Package,
  Users, Footprints, UserCheck, Armchair, Timer,
  BarChart3, Fingerprint, Repeat, Clock, ListOrdered,
  Sofa, ScanFace, User, HardHat, Flame
} from 'lucide-react';

const iconMap = {
  'Camera Blackout': VideoOff,
  'Intrusion Crossing': ShieldAlert,
  'Unauthorized Tracking': UserX,
  'Object Missing': PackageX,
  'Unattended Object': Package,
  'Crowd Detection': Users,
  'Loitering Detection': Footprints,
  'Staff Presence': UserCheck,
  'Staff Seat Absence': Armchair,
  'Stay Duration': Timer,
  'Visitor Count (Total)': BarChart3,
  'Visitor Unique': Fingerprint,
  'Visitor Repeat': Repeat,
  'Waiting Time': Clock,
  'Queue Management': ListOrdered,
  'Seat Occupancy Time': Sofa,
  'Face Recognition': ScanFace,
  'Gender Detection': User,
  'PPE Detection': HardHat,
  'Heatmap': Flame,
};

const categoryColors = {
  'Security': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  'Human Activity': { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  'Analytics': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  'Advanced AI': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
};

const DetectionTypeIcon = ({ type, category, size = 18, showLabel = false }) => {
  const Icon = iconMap[type] || ShieldAlert;
  const colors = categoryColors[category] || categoryColors['Security'];

  if (showLabel) {
    return (
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-bold"
        style={{ background: colors.bg, color: colors.color }}>
        <Icon size={size - 4} />
        <span>{type}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center justify-center rounded-lg p-1.5"
      style={{ background: colors.bg, color: colors.color }}>
      <Icon size={size} />
    </div>
  );
};

export { iconMap, categoryColors };
export default DetectionTypeIcon;
