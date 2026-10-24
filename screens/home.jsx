// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Public Home Page
// 3 hero variations toggleable via Tweaks
// ═════════════════════════════════════════════════════════════════
const { useState: useS_H, useEffect: useE_H, useRef: useR_H } = React;

// ── Public Nav ─────────────────────────────────────────────────
function PublicNav() {
  const links = ['Find Doctors', 'Lab Tests', 'Pharmacy', 'Home Care', 'Health Records', 'For Doctors'];
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', gap: 28,
      padding: '18px 56px',
      background: 'rgba(255,255,255,.78)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--ge-border-soft)',
      position: 'sticky', top: 0, zIndex: 5,
    }}>
      <GbLogo size={32}/>
      <div style={{ display: 'flex', gap: 4, marginLeft: 32 }}>
        {links.map(l => (
          <a key={l} style={{
            fontSize: 13, fontWeight: 500, color: '#4B5970',
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            textDecoration: 'none',
          }}
          onMouseEnter={(e)=>e.currentTarget.style.color='#1071F1'}
          onMouseLeave={(e)=>e.currentTarget.style.color='#4B5970'}>{l}</a>
        ))}
      </div>
      <span style={{ flex: 1 }}/>
      <button style={{ fontSize: 13, fontWeight: 500, color: '#4B5970', background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <Icon.Globe size={14} style={{ verticalAlign: -2, marginRight: 4 }}/> EN / اردو
      </button>
      <button className="ge-btn ge-btn-ghost" style={{ padding: '8px 16px' }}>Sign In</button>
      <button className="ge-btn ge-btn-primary" style={{ padding: '8px 18px' }}>Get Started</button>
    </nav>
  );
}

// ── HERO VARIATION A — Command Center (animated cards on right) ─
function HeroA() {
  const [tick, setTick] = useS_H(0);
  useE_H(() => {
    const id = setInterval(() => setTick(t => t + 1), 2400);
    return () => clearInterval(id);
  }, []);

  const notifications = [
    { type: 'appt', text: 'Dr. Ayesha Khan confirmed your 4:30 PM slot', icon: 'Calendar', color: '#1071F1' },
    { type: 'lab',  text: 'CBC Report uploaded — Chughtai Lab', icon: 'Flask', color: '#0E9F6E' },
    { type: 'med',  text: 'Order #PH-2841 dispatched, ETA 28 min', icon: 'Truck', color: '#5B4ABD' },
  ];
  const visible = notifications[tick % notifications.length];

  return (
    <section style={{
      padding: '56px 56px 96px', position: 'relative',
      background: 'radial-gradient(80% 60% at 70% 0%, rgba(153,204,255,.45) 0%, transparent 60%), linear-gradient(180deg, #F7F9FC 0%, #F5F9FE 100%)',
      overflow: 'hidden',
    }}>
      {/* GB mountain silhouette accent */}
      <svg width="100%" height="100%" viewBox="0 0 1280 600" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: .06, pointerEvents: 'none' }}>
        <path d="M0 500 L180 320 L320 420 L520 220 L700 380 L900 250 L1080 400 L1280 280 L1280 600 L0 600 Z" fill="#1071F1"/>
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 40, alignItems: 'center', position: 'relative' }}>
        {/* LEFT: copy + search */}
        <div>
          <span className="ge-chip ge-chip-blue" style={{ padding: '6px 12px', fontSize: 11.5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: '#0E9F6E' }} className="ge-pulse"/>
            Trusted Healthcare Platform for GB & Pakistan
          </span>

          <h1 className="ge-display" style={{ fontSize: 56, margin: '20px 0 16px', color: '#0A2540', maxWidth: 620 }}>
            Find trusted doctors, book appointments, and manage your health <em style={{ fontStyle: 'normal', color: '#1071F1', fontFamily: 'Fraunces, serif', fontWeight: 500 }}>in one place.</em>
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.55, color: '#4B5970', maxWidth: 540, margin: 0 }}>
            From Gilgit to Karachi — connect with verified specialists, order lab tests at home, refill prescriptions, and book home nursing care. All in one secure platform.
          </p>

          {/* SEARCH BAR */}
          <div className="ge-card-soft" style={{
            marginTop: 32, padding: 8, display: 'grid',
            gridTemplateColumns: '1.1fr 1fr 1fr auto', alignItems: 'center', gap: 4,
            borderRadius: 18, boxShadow: 'var(--ge-shadow-md)', maxWidth: 720,
          }}>
            <SearchField icon="Stethoscope" label="Specialty or symptom" placeholder="e.g. Cardiologist, fever"/>
            <SearchField icon="Pin" label="City" placeholder="Gilgit, Islamabad…" divider/>
            <SearchField icon="Calendar" label="When" placeholder="Today, 4:30 PM" divider/>
            <button className="ge-btn ge-btn-primary" style={{ padding: '14px 22px', borderRadius: 14, fontSize: 14 }}>
              <Icon.Search size={15}/> Search
            </button>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="ge-btn ge-btn-primary" style={{ padding: '14px 22px', fontSize: 14 }}>
              <Icon.Stethoscope size={15}/> Find a Doctor
            </button>
            <button className="ge-btn ge-btn-ghost" style={{ padding: '14px 22px', fontSize: 14 }}>
              <Icon.Video size={15}/> Book Video Consultation
            </button>
            <span style={{ fontSize: 12, color: '#4B5970', marginLeft: 8 }}>
              <Icon.Lock size={12} style={{ verticalAlign: -2, marginRight: 4 }}/> PMDC verified · End-to-end encrypted
            </span>
          </div>

          {/* social proof bar */}
          <div style={{ display: 'flex', gap: 28, marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--ge-border-soft)' }}>
            {[
              { v: '12,400+', l: 'Verified doctors' },
              { v: '380K+',   l: 'Appointments booked' },
              { v: '4.9★',    l: '38,000 reviews' },
              { v: '98%',     l: 'Patient satisfaction' },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.02em' }}>{s.v}</div>
                <div style={{ fontSize: 11.5, color: '#4B5970', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Animated command center mockup */}
        <CommandCenter notification={visible}/>
      </div>
    </section>
  );
}

function SearchField({ icon, label, placeholder, divider }) {
  const Icn = Icon[icon];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      borderLeft: divider ? '1px solid var(--ge-border-soft)' : 'none',
    }}>
      <Icn size={16} color="#1071F1"/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#4B5970', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
        <input placeholder={placeholder} style={{
          border: 'none', background: 'transparent', outline: 'none',
          fontSize: 13.5, fontFamily: 'inherit', color: '#0B1729',
          width: '100%', padding: '2px 0', marginTop: 1,
        }}/>
      </div>
    </div>
  );
}

function CommandCenter({ notification }) {
  const [bookingStep, setBookingStep] = useS_H(0);
  useE_H(() => {
    const id = setInterval(() => setBookingStep(s => (s + 1) % 4), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: 'relative', height: 540 }}>
      {/* Glow halo */}
      <div style={{
        position: 'absolute', inset: '10% -10% 10% -10%',
        background: 'radial-gradient(50% 50% at 50% 50%, rgba(11,132,254,.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* Main appointment card (back) */}
      <div className="ge-card" style={{
        position: 'absolute', top: 20, left: 20, width: 320, padding: 18,
        boxShadow: 'var(--ge-shadow-lg)',
        transform: 'rotate(-1.5deg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={GB_DATA.PORTRAITS.f1} name="Dr. Ayesha Khan" size={48}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0B1729' }}>Dr. Ayesha Khan</span>
              <Icon.Shield size={11} color="#1071F1"/>
            </div>
            <div style={{ fontSize: 11, color: '#4B5970' }}>Cardiology · Islamabad</div>
          </div>
          <button style={{ background: '#E6F0FE', border: 'none', width: 32, height: 32, borderRadius: 99, cursor: 'pointer' }}>
            <Icon.Video size={14} color="#1071F1"/>
          </button>
        </div>
        <div style={{ marginTop: 14, padding: 12, background: '#F5F9FE', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1071F1', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, lineHeight: 1 }}>
            <span style={{ fontSize: 9 }}>MAY</span>
            <span style={{ fontSize: 14, marginTop: 2 }}>03</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0B1729' }}>Video Consultation</div>
            <div style={{ fontSize: 11, color: '#4B5970' }}>Today · 4:30 PM – 4:50 PM</div>
          </div>
          <span className="ge-chip ge-chip-success" style={{ fontSize: 10 }}>Confirmed</span>
        </div>
        {/* Booking step bar */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          {['Type', 'Slot', 'Notes', 'Pay'].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 99,
                  background: i <= bookingStep ? '#1071F1' : '#E2E8F0',
                  color: '#fff', fontSize: 9, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .3s',
                }}>{i < bookingStep ? '✓' : i+1}</span>
                <span style={{ fontSize: 10.5, color: i <= bookingStep ? '#0B1729' : '#7B8AA1', fontWeight: i === bookingStep ? 600 : 500 }}>{s}</span>
              </div>
              {i < 3 && <span style={{ flex: 1, height: 1.5, background: i < bookingStep ? '#1071F1' : '#E2E8F0', borderRadius: 99, transition: 'background .3s' }}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Lab report card (mid) */}
      <div className="ge-card" style={{
        position: 'absolute', top: 230, left: 0, width: 248, padding: 14,
        boxShadow: 'var(--ge-shadow-lg)',
        transform: 'rotate(2deg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#DEF3F1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.Flask size={14} color="#0F9F95"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0B1729' }}>CBC Lab Report</div>
            <div style={{ fontSize: 10, color: '#4B5970' }}>Chughtai · 2 hrs ago</div>
          </div>
          <span className="ge-chip ge-chip-success" style={{ fontSize: 9 }}>Ready</span>
        </div>
        {[
          { l: 'Hemoglobin',   v: '14.2 g/dL', ok: true },
          { l: 'WBC Count',    v: '7,800 /µL', ok: true },
          { l: 'Platelets',    v: '212K /µL',  ok: true },
        ].map(r => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 11, borderBottom: '1px dashed #E6F0FE' }}>
            <span style={{ color: '#4B5970' }}>{r.l}</span>
            <span style={{ color: '#0B1729', fontWeight: 500 }}>{r.v} <span style={{ color: '#0E9F6E', marginLeft: 4 }}>●</span></span>
          </div>
        ))}
      </div>

      {/* Medicine order card (front-right) */}
      <div className="ge-card" style={{
        position: 'absolute', top: 130, right: 0, width: 264, padding: 14,
        boxShadow: 'var(--ge-shadow-lg)',
        transform: 'rotate(-1deg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECE9FA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.Pill size={14} color="#5B4ABD"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0B1729' }}>Order #PH-2841</div>
            <div style={{ fontSize: 10, color: '#4B5970' }}>4 items · Rs. 1,840</div>
          </div>
        </div>
        {/* Delivery progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 0' }}>
          {['Confirmed', 'Packed', 'Out', 'Delivered'].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{
                width: 8, height: 8, borderRadius: 99,
                background: i <= 2 ? '#5B4ABD' : '#E2E8F0',
              }}/>
              {i < 3 && <span style={{ flex: 1, height: 1.5, background: i < 2 ? '#5B4ABD' : '#E2E8F0', borderRadius: 99 }}/>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: '#4B5970' }}>
          <span>Out for delivery</span>
          <span style={{ color: '#5B4ABD', fontWeight: 600 }}>ETA 28 min</span>
        </div>
        <div style={{ marginTop: 10, padding: 8, background: '#FBFAFF', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name="Faraz" size={26}/>
          <div style={{ flex: 1, fontSize: 10.5, color: '#0B1729' }}>
            <div style={{ fontWeight: 600 }}>Faraz Ahmed</div>
            <div style={{ color: '#4B5970' }}>Rider</div>
          </div>
          <Icon.Phone size={14} color="#5B4ABD"/>
        </div>
      </div>

      {/* AI Insight card (bottom-right) */}
      <div className="ge-card" style={{
        position: 'absolute', bottom: 30, right: 30, width: 284, padding: 14,
        boxShadow: 'var(--ge-shadow-lg)',
        transform: 'rotate(1deg)',
        background: 'linear-gradient(140deg, #0A2540 0%, #0B5BB8 100%)',
        color: '#fff', border: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.AI size={14} color="#6EAFF8"/>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Gb Elaaj AI Assistant</span>
        </div>
        <div style={{ fontSize: 11.5, lineHeight: 1.5, color: 'rgba(255,255,255,.9)' }}>
          Based on your CBC, vitals are within normal range. I'd recommend a follow-up with Dr. Khan in 2 weeks. Want me to schedule it?
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button style={{ background: '#1071F1', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>Yes, schedule</button>
          <button style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>Later</button>
        </div>
      </div>

      {/* Floating live notification */}
      {notification && (
        <div key={notification.text} className="ge-slide-in" style={{
          position: 'absolute', top: -8, right: 30, width: 290,
          background: '#fff', padding: '10px 14px', borderRadius: 12,
          boxShadow: 'var(--ge-shadow-lg)', border: '1px solid var(--ge-border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: notification.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.createElement(Icon[notification.icon], { size: 14, color: notification.color })}
          </div>
          <div style={{ flex: 1, fontSize: 11.5, color: '#0B1729', lineHeight: 1.35 }}>{notification.text}</div>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: '#0E9F6E' }} className="ge-pulse"/>
        </div>
      )}
    </div>
  );
}

// ── HERO VARIATION B — Centered, hero photo collage ────────────
function HeroB() {
  return (
    <section style={{
      padding: '80px 56px 60px', position: 'relative',
      background: 'linear-gradient(180deg, #A5CDFC 0%, #CCE2FE 30%, #F5F9FE 100%)',
      overflow: 'hidden', textAlign: 'center',
    }}>
      <span className="ge-chip" style={{ background: 'rgba(255,255,255,.7)', color: '#0A2540', padding: '7px 14px', fontSize: 12, backdropFilter: 'blur(8px)' }}>
        <Icon.Mountain size={13} color="#0A2540"/> Trusted Healthcare Platform for GB & Pakistan
      </span>
      <h1 className="ge-display" style={{ fontSize: 72, margin: '24px auto 18px', maxWidth: 980, color: '#0A2540' }}>
        Care for every corner of <span style={{ color: '#1071F1', display: 'inline-block', position: 'relative' }}>
          Pakistan
          <svg width="100%" height="14" viewBox="0 0 200 14" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -4, left: 0 }}>
            <path d="M2 8 Q 50 2, 100 6 T 198 8" stroke="#1071F1" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        </span>.
      </h1>
      <p style={{ fontSize: 17, color: '#0A2540', opacity: .75, maxWidth: 620, margin: '0 auto', lineHeight: 1.5 }}>
        Verified doctors, lab tests, online pharmacy, and home nursing — from Hunza to Karachi.
      </p>

      {/* Search */}
      <div className="ge-card-soft" style={{
        margin: '36px auto 0', padding: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
        borderRadius: 99, boxShadow: 'var(--ge-shadow-lg)',
      }}>
        <SearchField icon="Stethoscope" label="Specialty" placeholder="Cardiologist"/>
        <SearchField icon="Pin" label="City" placeholder="Gilgit" divider/>
        <button className="ge-btn ge-btn-primary" style={{ padding: '14px 26px', borderRadius: 99 }}>
          <Icon.Search size={15}/> Search Doctors
        </button>
      </div>

      {/* Photo collage */}
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 56, alignItems: 'flex-end' }}>
        {[
          { src: GB_DATA.PORTRAITS.f1, h: 200, label: 'Dr. Ayesha · Cardio' },
          { src: GB_DATA.PORTRAITS.m1, h: 240, label: 'Dr. Imran · GP' },
          { src: GB_DATA.PORTRAITS.f3, h: 220, label: 'Dr. Mehwish · Paeds' },
          { src: GB_DATA.PORTRAITS.m4, h: 260, label: 'Dr. Bilal · Cardio' },
          { src: GB_DATA.PORTRAITS.f2, h: 200, label: 'Dr. Saima · Gynae' },
        ].map((p, i) => (
          <div key={i} style={{
            width: 130, height: p.h, borderRadius: 16, overflow: 'hidden',
            backgroundImage: `url(${p.src})`, backgroundSize: 'cover', backgroundPosition: 'center',
            boxShadow: 'var(--ge-shadow-lg)', position: 'relative',
            transform: `translateY(${i % 2 ? 0 : -10}px) rotate(${(i-2)*1.5}deg)`,
          }}>
            <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, padding: '6px 8px', background: 'rgba(255,255,255,.92)', borderRadius: 8, fontSize: 10, fontWeight: 600, color: '#0B1729' }}>
              {p.label}
              <div style={{ fontSize: 9, color: '#0E9F6E', marginTop: 1 }}>● Available now</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── HERO VARIATION C — Split with city map ──────────────────────
function HeroC() {
  return (
    <section style={{
      padding: '64px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56,
      background: '#F7F9FC', alignItems: 'center', minHeight: 600, position: 'relative',
    }}>
      <div>
        <span className="ge-chip ge-chip-blue"><Icon.Mountain size={12}/> Built for Gilgit-Baltistan, scaling to Pakistan</span>
        <h1 className="ge-display" style={{ fontSize: 60, margin: '20px 0 16px', color: '#0A2540' }}>
          Healthcare<br/>
          <span style={{ background: 'linear-gradient(90deg, #1071F1 0%, #6EAFF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            without the distance.
          </span>
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.55, color: '#4B5970', maxWidth: 480 }}>
          Whether you're in a Hunza valley or Karachi high-rise — book verified doctors, get lab tests at home, and have medicines delivered the same day.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button className="ge-btn ge-btn-primary" style={{ padding: '14px 22px', fontSize: 14 }}>
            <Icon.Stethoscope size={15}/> Find a Doctor
          </button>
          <button className="ge-btn ge-btn-dark" style={{ padding: '14px 22px', fontSize: 14 }}>
            <Icon.Video size={15}/> Book Video Consultation
          </button>
        </div>
        {/* mini stats */}
        <div style={{ display: 'flex', gap: 32, marginTop: 36 }}>
          {[
            { v: '12.4K', l: 'Verified Doctors', i: 'Stethoscope' },
            { v: '450+',  l: 'Lab Partners',     i: 'Flask' },
            { v: '8 cities', l: 'Same-day delivery', i: 'Truck' },
          ].map(s => {
            const Icn = Icon[s.i];
            return (
              <div key={s.l}>
                <Icn size={18} color="#1071F1"/>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', marginTop: 6 }}>{s.v}</div>
                <div style={{ fontSize: 11.5, color: '#4B5970' }}>{s.l}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pakistan map illustration with active city pulses */}
      <div style={{ position: 'relative', height: 480 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(11,132,254,.08) 0%, transparent 70%)',
          borderRadius: 24,
        }}/>
        <svg width="100%" height="100%" viewBox="0 0 400 480" style={{ position: 'absolute', inset: 0 }}>
          {/* simplified PK shape */}
          <path d="M120 80 L180 50 L240 70 L300 60 L340 110 L320 180 L340 240 L300 290 L320 360 L260 410 L200 420 L160 380 L130 320 L90 290 L70 220 L100 160 Z"
            fill="#E6F0FE" stroke="#CCE2FE" strokeWidth="1.5"/>
          {/* GB region highlight */}
          <path d="M180 50 L240 70 L260 110 L220 130 L170 100 Z" fill="#A5CDFC" opacity=".6"/>

          {/* city pulses */}
          {[
            { x: 215, y: 90,  name: 'Gilgit',     status: 'active' },
            { x: 245, y: 70,  name: 'Skardu',     status: 'active' },
            { x: 195, y: 95,  name: 'Hunza',      status: 'active' },
            { x: 230, y: 165, name: 'Islamabad',  status: 'active' },
            { x: 260, y: 220, name: 'Lahore',     status: 'active' },
            { x: 130, y: 350, name: 'Karachi',    status: 'active' },
            { x: 200, y: 145, name: 'Peshawar',   status: 'active' },
          ].map(c => (
            <g key={c.name}>
              <circle cx={c.x} cy={c.y} r="14" fill="#1071F1" opacity=".15"/>
              <circle cx={c.x} cy={c.y} r="6" fill="#1071F1">
                <animate attributeName="r" values="6;9;6" dur="2.4s" repeatCount="indefinite"/>
              </circle>
              <circle cx={c.x} cy={c.y} r="3" fill="#fff"/>
              <text x={c.x + 12} y={c.y + 4} fontSize="11" fill="#0A2540" fontWeight="500">{c.name}</text>
            </g>
          ))}
        </svg>
        {/* live counter */}
        <div className="ge-card" style={{ position: 'absolute', bottom: 16, left: 16, padding: 14, boxShadow: 'var(--ge-shadow-md)' }}>
          <div style={{ fontSize: 11, color: '#4B5970' }}>Live consultations right now</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#0B1729', marginTop: 4 }}>
            <span style={{ color: '#0E9F6E' }}>●</span> 1,247
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Specialties section ────────────────────────────────────────
function Specialties() {
  return (
    <section style={{ padding: '72px 56px', background: '#fff' }}>
      <SectionHead
        eyebrow="Browse by Specialty"
        title="Care for every condition"
        subtitle="Find verified specialists across 50+ medical disciplines, available for video and clinic visits."
        action={<button className="ge-btn ge-btn-ghost">View all specialties <Icon.Arrow size={13}/></button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {GB_DATA.SPECIALTIES.slice(0, 10).map(s => {
          const Icn = Icon[s.icon];
          return (
            <div key={s.id} className="ge-card ge-lift" style={{ padding: 18, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #E6F0FE, #F5F9FE)',
                color: '#1071F1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12, border: '1px solid var(--ge-border-soft)',
              }}>
                <Icn size={22} color="#1071F1"/>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0B1729' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: '#4B5970', marginTop: 3 }}>{s.count} doctors</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Top doctors ────────────────────────────────────────────────
function TopDoctors() {
  return (
    <section style={{ padding: '72px 56px', background: '#F5F9FE' }}>
      <SectionHead
        eyebrow="Top Verified Doctors"
        title="Meet the specialists patients trust most"
        subtitle="Every doctor is verified against PMDC/PMC records and reviewed by our medical board."
        action={<button className="ge-btn ge-btn-ghost">See all 12,400 doctors <Icon.Arrow size={13}/></button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {GB_DATA.DOCTORS.slice(0, 4).map(d => (
          <div key={d.id} className="ge-card ge-lift" style={{ padding: 18 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', backgroundImage: `url(${d.photo})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}>
              <span style={{ position: 'absolute', top: 10, left: 10 }}><VerifiedBadge small/></span>
              <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(255,255,255,.95)', padding: '4px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: '#0B1729', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon.Star size={11} color="#D89614"/> {d.rating}
              </span>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#0B1729', marginTop: 14 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: '#0B5BB8', marginTop: 2, fontWeight: 500 }}>{d.specialty}</div>
            <div style={{ fontSize: 11, color: '#4B5970', marginTop: 4 }}>{d.experience} yrs · {d.city}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--ge-border)' }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0B1729' }}>Rs. {d.fee.toLocaleString()}</span>
              <button className="ge-btn ge-btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}>Book</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', icon: 'Search', title: 'Search & filter', body: 'Find a verified doctor by specialty, city, fee, or availability — in seconds.' },
    { n: '02', icon: 'Calendar', title: 'Book in 60 seconds', body: 'Pick an open slot, add symptoms, pay securely. Confirmation lands instantly on WhatsApp.' },
    { n: '03', icon: 'Video', title: 'Consult & follow up', body: 'Join the video room or visit the clinic. Prescriptions and notes save automatically.' },
    { n: '04', icon: 'Heart', title: 'Manage your health', body: 'Order medicines, schedule labs, request home nursing — all from one dashboard.' },
  ];
  return (
    <section style={{ padding: '72px 56px', background: '#fff' }}>
      <SectionHead eyebrow="How it works" title="From symptom to care, in four steps" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, position: 'relative' }}>
        {/* connecting line */}
        <div style={{ position: 'absolute', top: 38, left: '12%', right: '12%', height: 1.5, borderTop: '1.5px dashed #CCE2FE', zIndex: 0 }}/>
        {steps.map((s, i) => {
          const Icn = Icon[s.icon];
          return (
            <div key={s.n} style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 76, height: 76, borderRadius: 22,
                background: '#fff', border: '1.5px solid #CCE2FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--ge-shadow-sm)', position: 'relative',
              }}>
                <Icn size={28} color="#1071F1"/>
                <span style={{ position: 'absolute', top: -8, right: -8, background: '#0A2540', color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 99 }}>{s.n}</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#0B1729', marginTop: 18, letterSpacing: '-0.01em' }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#4B5970', marginTop: 6, lineHeight: 1.55 }}>{s.body}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Service tiles (Lab, Pharmacy, Home Care) ───────────────────
function Services() {
  const services = [
    {
      title: 'Lab tests at home', tag: 'LAB',
      body: '500+ tests, sample collection from your doorstep, digital reports in 6 hours.',
      bullets: ['CBC, LFT, RFT, COVID-PCR', 'Free home sample collection', 'Reports synced to records'],
      icon: 'Flask', accent: '#0F9F95', accentBg: '#DEF3F1',
    },
    {
      title: 'Online pharmacy', tag: 'PHARMA',
      body: 'Upload a prescription or shop direct. Genuine medicines, same-day delivery.',
      bullets: ['Verified prescriptions only', 'Up to 25% off MRP', '8 cities, same-day delivery'],
      icon: 'Pill', accent: '#5B4ABD', accentBg: '#ECE9FA',
    },
    {
      title: 'Home nursing & care', tag: 'CARE',
      body: 'Trained nurses, physiotherapists, and elderly caregivers visit at your schedule.',
      bullets: ['IV, dressing, post-op care', 'Hourly or full-day plans', 'Live check-in tracking'],
      icon: 'Heart', accent: '#1071F1', accentBg: '#E6F0FE',
    },
  ];
  return (
    <section style={{ padding: '72px 56px', background: '#F5F9FE' }}>
      <SectionHead eyebrow="More than just doctors" title="One platform, every healthcare service"/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {services.map(s => {
          const Icn = Icon[s.icon];
          return (
            <div key={s.title} className="ge-card ge-lift" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: s.accentBg, opacity: .8 }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.accentBg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icn size={22} color={s.accent}/>
                  </div>
                  <span className="ge-chip" style={{ background: '#fff', border: '1px solid var(--ge-border)', color: s.accent, fontWeight: 600, letterSpacing: '.08em' }}>{s.tag}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#0A2540', marginTop: 18, letterSpacing: '-0.015em' }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#4B5970', marginTop: 6, lineHeight: 1.55 }}>{s.body}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {s.bullets.map(b => (
                    <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#0B1729' }}>
                      <Icon.Check size={12} color={s.accent} strokeWidth="2.5"/> {b}
                    </li>
                  ))}
                </ul>
                <button className="ge-btn ge-btn-ghost" style={{ padding: '10px 16px', fontSize: 13 }}>
                  Explore {s.tag.toLowerCase()} <Icon.Arrow size={13}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Reviews ────────────────────────────────────────────────────
function Reviews() {
  return (
    <section style={{ padding: '72px 56px', background: '#fff' }}>
      <SectionHead eyebrow="Patient stories" title="Trusted by patients across Pakistan"/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {GB_DATA.REVIEWS.map((r, i) => (
          <div key={r.id} className="ge-card" style={{ padding: 24, position: 'relative' }}>
            <Stars value={r.rating} size={14}/>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#0B1729', marginTop: 14, letterSpacing: '-0.005em' }}>
              "{r.text}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--ge-border-soft)' }}>
              <Avatar src={[GB_DATA.PORTRAITS.pat1, GB_DATA.PORTRAITS.pat2, GB_DATA.PORTRAITS.pat3][i]} name={r.name} size={36}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#4B5970' }}><Icon.Pin size={10} style={{ verticalAlign: -1 }}/> {r.city} · {r.when}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: '64px 56px', background: '#F5F9FE' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0A2540 0%, #0B5BB8 60%, #1071F1 100%)',
        borderRadius: 24, padding: '56px 56px', color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative pattern */}
        <svg width="240" height="240" viewBox="0 0 240 240" style={{ position: 'absolute', top: -40, right: -40, opacity: .15 }}>
          <circle cx="120" cy="120" r="100" stroke="#fff" strokeWidth="1.5" fill="none"/>
          <circle cx="120" cy="120" r="70"  stroke="#fff" strokeWidth="1.5" fill="none"/>
          <circle cx="120" cy="120" r="40"  stroke="#fff" strokeWidth="1.5" fill="none"/>
          <path d="M110 100h20v20h20v20h-20v20h-20v-20H90v-20h20Z" fill="#fff" opacity=".4"/>
        </svg>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ maxWidth: 560 }}>
            <span className="ge-chip" style={{ background: 'rgba(255,255,255,.12)', color: '#A5CDFC', backdropFilter: 'blur(8px)' }}>
              <Icon.Mountain size={11}/> From the mountains, for everyone
            </span>
            <h2 className="ge-display" style={{ fontSize: 40, margin: '14px 0 10px', color: '#fff' }}>
              Your family's complete healthcare<br/>partner — start today.
            </h2>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.78)', margin: 0, lineHeight: 1.55 }}>
              Free to sign up. No subscription. Pay only for what you use.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="ge-btn" style={{ padding: '14px 22px', fontSize: 14, background: '#fff', color: '#1071F1' }}>
              <Icon.User size={15}/> Sign up as Patient
            </button>
            <button className="ge-btn" style={{ padding: '14px 22px', fontSize: 14, background: 'rgba(255,255,255,.12)', color: '#fff', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)' }}>
              <Icon.Stethoscope size={15}/> Join as Doctor
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────
function Footer() {
  const groups = [
    { title: 'For Patients', items: ['Find Doctors', 'Lab Tests', 'Pharmacy', 'Home Care', 'Health Records'] },
    { title: 'For Providers', items: ['Doctor Onboarding', 'Lab Partners', 'Pharmacy Network', 'Hospital Tie-ups'] },
    { title: 'Company', items: ['About', 'Press', 'Careers', 'Blog', 'Contact'] },
    { title: 'Legal & Trust', items: ['Privacy', 'Terms', 'Code of Ethics', 'PMDC Compliance'] },
  ];
  return (
    <footer style={{ background: '#0A2540', color: '#fff', padding: '56px 56px 28px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 32 }}>
        <div>
          <GbLogo size={32} dark color="#6EAFF8"/>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, marginTop: 16, maxWidth: 280 }}>
            Pakistan's connected healthcare platform. Built in Gilgit-Baltistan, loved across the country.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {['Phone', 'Mail', 'Send'].map(i => {
              const Icn = Icon[i];
              return (
                <button key={i} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Icn size={14}/>
                </button>
              );
            })}
          </div>
        </div>
        {groups.map(g => (
          <div key={g.title}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6EAFF8', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 14 }}>{g.title}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.items.map(i => <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', cursor: 'pointer' }}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.1)', fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
        <span>© 2026 Gb Elaaj Health Technologies (Pvt) Ltd. PMDC Reg. No. PK-HC-2024-0192</span>
        <span><Icon.Lock size={11} style={{ verticalAlign: -1, marginRight: 4 }}/> SSL secured · HIPAA-equivalent privacy</span>
      </div>
    </footer>
  );
}

// ── ROOT — pick variation ──────────────────────────────────────
function HomePage({ variant = 'A' }) {
  const Hero = variant === 'B' ? HeroB : variant === 'C' ? HeroC : HeroA;
  return (
    <div style={{ background: '#fff', minHeight: '100%' }}>
      <PublicNav/>
      <Hero/>
      <Specialties/>
      <TopDoctors/>
      <HowItWorks/>
      <Services/>
      <Reviews/>
      <FinalCTA/>
      <Footer/>
    </div>
  );
}

window.HomePage = HomePage;
