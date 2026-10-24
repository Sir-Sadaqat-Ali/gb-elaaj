// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Enterprise UI Primitives v2
// Refined: precise spacing, layered cards, professional density
// ═════════════════════════════════════════════════════════════════
const { useState, useEffect, useRef, useMemo } = React;

// ── Logo ───────────────────────────────────────────────────────
function GbLogo({ size = 30, withWordmark = true, dark = false, mark = false }) {
  const ink = dark ? '#FFFFFF' : '#0B1729';
  const sub = dark ? 'rgba(255,255,255,.55)' : '#7B8AA1';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <defs>
          <linearGradient id="gbGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1071F1"/>
            <stop offset="100%" stopColor="#0B5BB8"/>
          </linearGradient>
          <linearGradient id="gbHi" x1="0" y1="0" x2="0" y2="36">
            <stop offset="0%" stopColor="#fff" stopOpacity=".18"/>
            <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="32" height="32" rx="9" fill="url(#gbGrad)"/>
        <rect x="2" y="2" width="32" height="32" rx="9" fill="url(#gbHi)"/>
        <path d="M7 25 L13 16 L17 21 L22 12 L29 25 Z" fill="rgba(255,255,255,.18)"/>
        <path d="M16 11h4v5h5v4h-5v5h-4v-5h-5v-4h5v-5Z" fill="#fff"/>
      </svg>
      {withWordmark && !mark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: 16.5, fontWeight: 700, color: ink, letterSpacing: '-0.025em' }}>
            Gb<span style={{ color: '#1071F1' }}> Elaaj</span>
          </span>
          <span style={{ fontSize: 8.5, fontWeight: 600, color: sub, letterSpacing: '0.16em', marginTop: 4, textTransform: 'uppercase' }}>
            علاج · Care for All
          </span>
        </div>
      )}
    </div>
  );
}

function Avatar({ src, name = '?', size = 40, ring = false }) {
  const initials = name.split(' ').filter(s => !/^Dr\.?$/i.test(s)).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const style = {
    width: size, height: size, borderRadius: '50%',
    background: 'linear-gradient(135deg, #CCE2FE, #6EAFF8)', color: '#0B5BB8',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
    border: ring ? '2px solid #fff' : 'none',
    boxShadow: ring ? '0 0 0 2px #1071F1' : 'none',
    overflow: 'hidden',
  };
  if (src) return <img src={src} alt={name} style={style} />;
  return <div style={style}>{initials}</div>;
}

// ── Sidebar (enterprise) ───────────────────────────────────────
function Sidebar({ items, active, onSelect, user, accent = '#1071F1' }) {
  return (
    <aside style={{
      width: 232, flexShrink: 0,
      background: '#FFFFFF', borderRight: '1px solid var(--ge-border)',
      display: 'flex', flexDirection: 'column',
      padding: '18px 12px', gap: 14,
    }}>
      <div style={{ padding: '4px 8px 6px' }}>
        <GbLogo size={28}/>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', background: 'var(--ge-bg-subtle)',
        border: '1px solid var(--ge-border)', borderRadius: 8,
        fontSize: 12, color: '#7B8AA1',
      }}>
        <Icon.Search size={13}/>
        <span style={{ flex: 1 }}>Search…</span>
        <kbd style={{ fontSize: 10, fontWeight: 600, color: '#7B8AA1', background: '#fff', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--ge-border)' }}>⌘K</kbd>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((it, i) => {
          if (it.section) return (
            <div key={'s' + i} className="ge-section-label" style={{ padding: '14px 10px 6px' }}>{it.section}</div>
          );
          const isActive = it.id === active;
          const Icn = it.icon ? Icon[it.icon] : null;
          return (
            <button key={it.id} onClick={() => onSelect && onSelect(it.id)}
              className={'ge-nav-item' + (isActive ? ' active' : '')}
              style={{ border: 'none', background: 'transparent', textAlign: 'left', fontFamily: 'inherit', position: 'relative', ...(isActive && { background: 'var(--ge-blue-50)', color: accent, fontWeight: 600 }) }}
            >
              {isActive && <span style={{ position: 'absolute', left: -12, top: 7, bottom: 7, width: 2.5, background: accent, borderRadius: 99 }}/>}
              {Icn && <Icn size={16} color={isActive ? accent : '#4B5970'} />}
              <span>{it.label}</span>
              {it.badge && (
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                  background: isActive ? accent : 'var(--ge-bg-subtle)',
                  color: isActive ? '#fff' : '#4B5970',
                  padding: '1px 7px', borderRadius: 99,
                  border: isActive ? 'none' : '1px solid var(--ge-border)',
                }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 10px',
          borderRadius: 10, border: '1px solid var(--ge-border)',
          background: 'var(--ge-white)',
        }}>
          <Avatar src={user.avatar} name={user.name} size={32} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0B1729', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 10.5, color: '#7B8AA1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.role}</div>
          </div>
          <Icon.More size={14} color="#7B8AA1"/>
        </div>
      </div>
    </aside>
  );
}

// ── TopBar ────────────────────────────────────────────────────
function TopBar({ title, subtitle, actions, search, breadcrumb }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 24px', background: '#fff',
      borderBottom: '1px solid var(--ge-border)',
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {breadcrumb && <div style={{ fontSize: 11, color: '#7B8AA1', marginBottom: 4 }}>{breadcrumb}</div>}
        <div style={{ fontSize: 17, fontWeight: 600, color: '#0B1729', letterSpacing: '-0.02em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#7B8AA1', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {search && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--ge-bg-subtle)', border: '1px solid var(--ge-border)',
          borderRadius: 8, padding: '7px 12px', minWidth: 280,
        }}>
          <Icon.Search size={14} color="#7B8AA1"/>
          <input placeholder={search} style={{
            border: 'none', background: 'transparent', outline: 'none',
            fontSize: 12.5, fontFamily: 'inherit', color: '#0B1729', width: '100%',
          }}/>
          <kbd style={{ fontSize: 10, fontWeight: 600, color: '#7B8AA1', background: '#fff', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--ge-border)' }}>⌘K</kbd>
        </div>
      )}
      <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--ge-border)', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
        <Icon.Bell size={15} color="#4B5970"/>
        <span style={{ position: 'absolute', top: 5, right: 6, width: 6, height: 6, borderRadius: 99, background: '#D03B3A', border: '2px solid #fff' }}/>
      </button>
      {actions}
    </div>
  );
}

// ── Metric (KPI) ───────────────────────────────────────────────
function Metric({ label, value, delta, deltaDir = 'up', icon, accent = '#1071F1', sparkline, sub }) {
  const Icn = icon ? Icon[icon] : null;
  const dirColor = deltaDir === 'up' ? '#0E9F6E' : '#D03B3A';
  const id = 'sg' + label.replace(/\s/g, '');
  return (
    <div className="ge-kpi">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icn && (
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: accent + '12', color: accent,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icn size={13} color={accent}/>
          </div>
        )}
        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#7B8AA1', letterSpacing: '-0.005em' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
        <span className="ge-tnum" style={{ fontSize: 24, fontWeight: 600, color: '#0B1729', letterSpacing: '-0.03em' }}>{value}</span>
        {delta && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: dirColor,
            display: 'inline-flex', alignItems: 'center', gap: 2,
            background: dirColor + '12', padding: '2px 6px', borderRadius: 4,
          }}>
            {deltaDir === 'up' ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 10.5, color: '#7B8AA1', marginTop: 4 }}>{sub}</div>}
      {sparkline && (
        <svg width="100%" height="32" viewBox="0 0 200 32" preserveAspectRatio="none" style={{ marginTop: 8 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity=".2"/>
              <stop offset="100%" stopColor={accent} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={sparkline} stroke={accent} strokeWidth="1.5" fill="none"/>
          <path d={sparkline + ' L200,32 L0,32 Z'} fill={`url(#${id})`}/>
        </svg>
      )}
    </div>
  );
}

function Stars({ value, size = 12, showNumber = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ display: 'inline-flex' }}>
        {[1,2,3,4,5].map(i => (
          <Icon.Star key={i} size={size} color={i <= Math.round(value) ? '#D89614' : '#E2E8F0'} />
        ))}
      </span>
      {showNumber && <span style={{ fontSize: 12, fontWeight: 600, color: '#0B1729' }}>{value.toFixed(1)}</span>}
    </span>
  );
}

function VerifiedBadge({ small = false }) {
  return (
    <span className="ge-verified" style={small ? { fontSize: 9.5, padding: '2px 6px' } : {}}>
      <Icon.Shield size={small ? 9 : 11} color="#1071F1" strokeWidth="2"/>
      PMDC Verified
    </span>
  );
}

function Pillbox({ value, onChange, options }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--ge-bg-subtle)', border: '1px solid var(--ge-border)', borderRadius: 7, padding: 2 }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange && onChange(o.v)} style={{
          padding: '4px 10px', fontSize: 11.5, fontWeight: 500,
          border: 'none', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
          background: value === o.v ? '#fff' : 'transparent',
          color: value === o.v ? '#0B1729' : '#7B8AA1',
          boxShadow: value === o.v ? 'var(--ge-shadow-xs)' : 'none',
        }}>{o.l}</button>
      ))}
    </div>
  );
}

const selectS = {
  width: '100%', padding: '8px 12px', fontSize: 12.5,
  borderRadius: 8, border: '1px solid var(--ge-border)',
  background: '#fff', fontFamily: 'inherit', color: '#0B1729', outline: 'none',
};

// ── Doctor card ────────────────────────────────────────────────
function DoctorCard({ doctor, variant = 'list', onBook }) {
  const d = doctor;
  if (variant === 'mini') {
    return (
      <div className="ge-card ge-lift" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Avatar src={d.photo} name={d.name} size={44}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>{d.name}</div>
          <div style={{ fontSize: 11, color: '#7B8AA1', marginTop: 1 }}>{d.specialty}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
            <Stars value={d.rating} size={10}/>
            <span style={{ fontSize: 10.5, color: '#7B8AA1' }}>{d.satisfaction}%</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="ge-card ge-lift" style={{ padding: 18, display: 'flex', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <Avatar src={d.photo} name={d.name} size={72}/>
        <span style={{
          position: 'absolute', bottom: 2, right: 2,
          width: 12, height: 12, borderRadius: 99,
          background: d.available === 'today' ? '#0E9F6E' : '#C28220',
          border: '2px solid #fff',
        }}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0B1729', letterSpacing: '-0.01em' }}>{d.name}</span>
              {d.verified && <VerifiedBadge small/>}
            </div>
            <div style={{ fontSize: 12, color: '#0B5BB8', fontWeight: 500, marginTop: 2 }}>{d.specialty}</div>
            <div style={{ fontSize: 11, color: '#7B8AA1', marginTop: 3 }}>{d.qualifications}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10.5, color: '#7B8AA1' }}>Consultation</div>
            <div className="ge-tnum" style={{ fontSize: 15, fontWeight: 600, color: '#0B1729', marginTop: 2 }}>Rs. {d.fee.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: '#7B8AA1', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Stars value={d.rating} size={10}/>
            <strong style={{ color: '#0B1729', fontWeight: 600 }}>{d.rating}</strong>
            <span>({d.reviews})</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon.Activity size={11}/> {d.experience} yrs
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon.Clock size={11}/> ~{d.waitTime} min
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon.Pin size={11}/> {d.clinic}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--ge-border)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {d.types.includes('video') && <span className="ge-chip ge-chip-blue"><Icon.Video size={10}/> Video</span>}
            {d.types.includes('clinic') && <span className="ge-chip ge-chip-soft"><Icon.Building size={10}/> Clinic</span>}
          </div>
          <span style={{ flex: 1 }}/>
          <span style={{ fontSize: 11, color: '#0E9F6E', fontWeight: 500 }}>
            <Icon.Clock size={10} style={{ marginRight: 3, verticalAlign: -1 }}/> Next: {d.nextSlot}
          </span>
          <button className="ge-btn ge-btn-ghost" style={{ padding: '6px 12px', fontSize: 11.5 }}>View</button>
          <button className="ge-btn ge-btn-primary" style={{ padding: '6px 12px', fontSize: 11.5 }} onClick={onBook}>
            Book <Icon.Arrow size={12}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, subtitle, action, align = 'left' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
      <div style={{ textAlign: align, maxWidth: 720 }}>
        {eyebrow && <div style={{ fontSize: 10.5, fontWeight: 600, color: '#1071F1', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>{eyebrow}</div>}
        <h2 className="ge-display" style={{ fontSize: 32, margin: 0, color: '#0A2540', fontWeight: 600 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 14.5, color: '#4B5970', margin: '12px 0 0', lineHeight: 1.55, maxWidth: 640 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon = 'Search', title, body, action }) {
  const Icn = Icon[icon];
  return (
    <div style={{ padding: 48, textAlign: 'center', background: 'var(--ge-bg-subtle)', borderRadius: 14, border: '1px dashed var(--ge-border)' }}>
      <div style={{ width: 52, height: 52, borderRadius: 99, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--ge-shadow-sm)' }}>
        <Icn size={20} color="#1071F1"/>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#0B1729', marginTop: 14 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#7B8AA1', marginTop: 6, maxWidth: 320, margin: '6px auto 0' }}>{body}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

Object.assign(window, { GbLogo, Avatar, Sidebar, TopBar, Metric, Stars, VerifiedBadge, DoctorCard, SectionHead, EmptyState, Pillbox, selectS });
