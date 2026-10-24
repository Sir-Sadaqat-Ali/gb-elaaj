// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Icon set (single-stroke, healthcare-tuned)
// All icons accept { size = 18, color = 'currentColor', strokeWidth = 1.6 }
// ═════════════════════════════════════════════════════════════════

const Ic = ({ children, size = 18, color = 'currentColor', strokeWidth = 1.6, fill = 'none', style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill={fill} stroke={color} strokeWidth={strokeWidth}
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
    {children}
  </svg>
);

const Icon = {
  Search:    (p) => <Ic {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Ic>,
  Pin:       (p) => <Ic {...p}><path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></Ic>,
  Calendar:  (p) => <Ic {...p}><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/></Ic>,
  Clock:     (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Ic>,
  Video:     (p) => <Ic {...p}><rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10 5-3v10l-5-3"/></Ic>,
  Stethoscope: (p) => <Ic {...p}><path d="M5 4v6a4 4 0 0 0 8 0V4"/><path d="M9 14v2a4 4 0 0 0 8 0v-1"/><circle cx="17" cy="13" r="2"/></Ic>,
  Pill:      (p) => <Ic {...p}><rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="m9 7 6 10" /></Ic>,
  Flask:     (p) => <Ic {...p}><path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 17l-5-9V3"/></Ic>,
  Heart:     (p) => <Ic {...p}><path d="M12 21s-7-4.5-9-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 5.5-9 10-9 10Z"/></Ic>,
  Shield:    (p) => <Ic {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></Ic>,
  Bell:      (p) => <Ic {...p}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></Ic>,
  Star:      (p) => <Ic {...p} fill="currentColor"><path d="m12 3 2.6 5.6 6 .8-4.3 4.2 1 6L12 17l-5.3 2.6 1-6L3.4 9.4l6-.8L12 3Z"/></Ic>,
  StarOutline: (p) => <Ic {...p}><path d="m12 3 2.6 5.6 6 .8-4.3 4.2 1 6L12 17l-5.3 2.6 1-6L3.4 9.4l6-.8L12 3Z"/></Ic>,
  Check:     (p) => <Ic {...p}><path d="m4 12 5 5 11-11"/></Ic>,
  CheckCircle: (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></Ic>,
  X:         (p) => <Ic {...p}><path d="M6 6 18 18M18 6 6 18"/></Ic>,
  Plus:      (p) => <Ic {...p}><path d="M12 5v14M5 12h14"/></Ic>,
  Minus:     (p) => <Ic {...p}><path d="M5 12h14"/></Ic>,
  Filter:    (p) => <Ic {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/></Ic>,
  Sliders:   (p) => <Ic {...p}><path d="M4 6h11M4 12h7M4 18h13"/><circle cx="18" cy="6" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="20" cy="18" r="2"/></Ic>,
  Arrow:     (p) => <Ic {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Ic>,
  ArrowLeft: (p) => <Ic {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Ic>,
  ChevronDown: (p) => <Ic {...p}><path d="m6 9 6 6 6-6"/></Ic>,
  ChevronRight:(p) => <Ic {...p}><path d="m9 6 6 6-6 6"/></Ic>,
  ChevronUp: (p) => <Ic {...p}><path d="m6 15 6-6 6 6"/></Ic>,
  Home:      (p) => <Ic {...p}><path d="M3 11.5 12 4l9 7.5V20a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-8.5Z"/></Ic>,
  User:      (p) => <Ic {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Ic>,
  Users:     (p) => <Ic {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a3.5 3.5 0 0 1 0 7M22 21a6 6 0 0 0-4-5.6"/></Ic>,
  Settings:  (p) => <Ic {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></Ic>,
  Logout:    (p) => <Ic {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Ic>,
  Wallet:    (p) => <Ic {...p}><rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M16 13h2"/><path d="M3 10h18"/></Ic>,
  CreditCard:(p) => <Ic {...p}><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/></Ic>,
  Chart:     (p) => <Ic {...p}><path d="M3 21h18M6 17v-5M11 17V7M16 17v-9M21 17v-3"/></Ic>,
  TrendUp:   (p) => <Ic {...p}><path d="M3 17 9 11l4 4 8-8"/><path d="M14 4h7v7"/></Ic>,
  TrendDown: (p) => <Ic {...p}><path d="M3 7 9 13l4-4 8 8"/><path d="M14 20h7v-7"/></Ic>,
  Doc:       (p) => <Ic {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></Ic>,
  Box:       (p) => <Ic {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/></Ic>,
  Truck:     (p) => <Ic {...p}><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></Ic>,
  Lab:       (p) => <Ic {...p}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 13h9"/></Ic>,
  Spark:     (p) => <Ic {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></Ic>,
  AI:        (p) => <Ic {...p}><path d="M12 2 9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7Z"/></Ic>,
  Send:      (p) => <Ic {...p}><path d="m4 12 17-9-6 19-3-8-8-2Z"/></Ic>,
  Phone:     (p) => <Ic {...p}><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></Ic>,
  Mail:      (p) => <Ic {...p}><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></Ic>,
  Menu:      (p) => <Ic {...p}><path d="M4 7h16M4 12h16M4 17h16"/></Ic>,
  Refresh:   (p) => <Ic {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16M3 20v-4h4"/></Ic>,
  Globe:     (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></Ic>,
  Lock:      (p) => <Ic {...p}><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></Ic>,
  Map:       (p) => <Ic {...p}><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2ZM9 4v14M15 6v14"/></Ic>,
  Activity:  (p) => <Ic {...p}><path d="M3 12h4l3-8 4 16 3-8h4"/></Ic>,
  Award:     (p) => <Ic {...p}><circle cx="12" cy="9" r="6"/><path d="m8.5 14-2 7 5.5-3 5.5 3-2-7"/></Ic>,
  Edit:      (p) => <Ic {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></Ic>,
  Plus2:     (p) => <Ic {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></Ic>,
  More:      (p) => <Ic {...p}><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/></Ic>,
  Mic:       (p) => <Ic {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Ic>,
  MicOff:    (p) => <Ic {...p}><path d="M3 3l18 18M9 9v2a3 3 0 0 0 5.2 2M15 12V6a3 3 0 0 0-6-.6M5 11a7 7 0 0 0 11.7 5.2M19 11a7 7 0 0 1-.6 2.8M12 18v3"/></Ic>,
  Eye:       (p) => <Ic {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></Ic>,
  Mountain:  (p) => <Ic {...p}><path d="M3 20 9 8l4 6 3-4 5 10H3Z"/><circle cx="8" cy="6" r="1.5"/></Ic>,
  Cross:     (p) => <Ic {...p} fill="currentColor" color="none"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/></Ic>,
  Briefcase: (p) => <Ic {...p}><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></Ic>,
  Building:  (p) => <Ic {...p}><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></Ic>,
  Headset:   (p) => <Ic {...p}><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></Ic>,
  Layers:    (p) => <Ic {...p}><path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 18l9 5 9-5"/></Ic>,
  Logo:      ({ size = 28, color = '#0B84FE' }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" rx="9" fill={color} />
      <path d="M11 14h4v-4h2v4h4v2h-4v4h-2v-4h-4v-2Z" fill="#fff" />
      <path d="M16 24c.6-2 2-4 4-4.5" stroke="#99CCFF" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  ),
};

window.Icon = Icon;
