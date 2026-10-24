// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Patient Dashboard
// ═════════════════════════════════════════════════════════════════
const { useState: useSPD } = React;

function PatientDashboard() {
  const [active, setActive] = useSPD('home');
  const items = [
    { section: 'Care' },
    { id: 'home', icon: 'Home', label: 'Dashboard' },
    { id: 'appts', icon: 'Calendar', label: 'Appointments', badge: 2 },
    { id: 'records', icon: 'Doc', label: 'Health Records' },
    { id: 'labs', icon: 'Flask', label: 'Lab Tests' },
    { section: 'Shop' },
    { id: 'pharm', icon: 'Pill', label: 'Pharmacy' },
    { id: 'care', icon: 'Heart', label: 'Home Care' },
    { section: 'Account' },
    { id: 'fam', icon: 'Users', label: 'Family' },
    { id: 'wallet', icon: 'Wallet', label: 'Wallet' },
    { id: 'settings', icon: 'Settings', label: 'Settings' },
  ];

  return (
    <div className="ge-app-shell">
      <Sidebar items={items} active={active} onSelect={setActive}
        user={{ name: 'Sana Yousaf', role: 'Patient · Gilgit', avatar: GB_DATA.PORTRAITS.pat1 }}/>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Asalam o Alaikum, Sana 👋" subtitle="Tuesday, May 3 — Here's your health snapshot for today." search="Search doctors, labs, medicines…" actions={
          <button className="ge-btn ge-btn-primary" style={{ padding: '8px 14px', fontSize: 12.5 }}><Icon.Plus size={13}/> Book consultation</button>
        }/>

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* Top row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
            {/* Upcoming appointment */}
            <div className="ge-card" style={{ padding: 20, background: 'linear-gradient(135deg, #0A2540 0%, #0B5BB8 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
              <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', top: -30, right: -30, opacity: .15 }}>
                <circle cx="100" cy="100" r="80" stroke="#fff" strokeWidth="1" fill="none"/>
                <circle cx="100" cy="100" r="50" stroke="#fff" strokeWidth="1" fill="none"/>
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, position: 'relative' }}>
                <span className="ge-chip" style={{ background: 'rgba(255,255,255,.15)', color: '#A5CDFC' }}>● Upcoming · in 2h 15m</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                <Avatar src={GB_DATA.PORTRAITS.f1} name="Dr. Ayesha Khan" size={56} ring/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>Dr. Ayesha Khan</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Cardiology · Today, 4:30 PM · Video Consultation</div>
                </div>
                <button className="ge-btn" style={{ background: '#fff', color: '#1071F1', padding: '10px 18px', fontSize: 13 }}>
                  <Icon.Video size={14}/> Join Video Call
                </button>
              </div>
              {/* checklist */}
              <div style={{ display: 'flex', gap: 12, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.1)', position: 'relative' }}>
                {[
                  { l: 'Test camera & mic', done: true },
                  { l: 'Upload latest CBC', done: true },
                  { l: 'List your symptoms', done: false },
                ].map(c => (
                  <span key={c.l} style={{ fontSize: 11.5, color: c.done ? '#A5CDFC' : '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {c.done ? <Icon.Check size={12} strokeWidth="3"/> : <span style={{ width: 10, height: 10, border: '1.5px solid #fff', borderRadius: 99, display: 'inline-block' }}/>}
                    {c.l}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Assistant card */}
            <div className="ge-card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(109,91,208,.12) 0%, transparent 60%)' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ECE9FA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon.AI size={16} color="#5B4ABD"/>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>Health AI · Aafiyat</span>
                  <span style={{ flex: 1 }}/>
                  <span className="ge-chip ge-chip-purple" style={{ fontSize: 9.5 }}>BETA</span>
                </div>
                <p style={{ fontSize: 12.5, color: '#0B1729', lineHeight: 1.5, marginTop: 12 }}>
                  Your last 3 readings show <strong>BP slightly elevated</strong>. Want me to schedule a follow-up with Dr. Khan?
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  <button className="ge-btn ge-btn-primary" style={{ padding: '7px 12px', fontSize: 11.5, background: '#5B4ABD' }}>Yes, schedule</button>
                  <button className="ge-btn ge-btn-ghost" style={{ padding: '7px 12px', fontSize: 11.5 }}>Ask Aafiyat</button>
                </div>
              </div>
            </div>
          </div>

          {/* Health insights row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
            <Metric label="Heart rate (avg)" value="78 bpm" delta="2%" deltaDir="down" icon="Heart" accent="#D03B3A" sparkline="M0,18 L20,15 L40,17 L60,12 L80,14 L100,11 L120,13 L140,9 L160,12 L180,8 L200,10"/>
            <Metric label="Blood pressure" value="128/84" delta="HIGH" deltaDir="up" icon="Activity" accent="#C28220" sparkline="M0,20 L20,18 L40,22 L60,16 L80,18 L100,14 L120,12 L140,10 L160,8 L180,12 L200,9"/>
            <Metric label="Steps today" value="6,842" delta="12%" deltaDir="up" icon="TrendUp" accent="#0E9F6E" sparkline="M0,28 L20,24 L40,20 L60,22 L80,16 L100,18 L120,14 L140,12 L160,10 L180,8 L200,6"/>
            <Metric label="Sleep" value="7h 12m" delta="0%" deltaDir="up" icon="Clock" accent="#1071F1" sparkline="M0,16 L20,18 L40,14 L60,12 L80,15 L100,11 L120,13 L140,10 L160,12 L180,9 L200,11"/>
          </div>

          {/* Two-col body */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Recommended doctors */}
              <div className="ge-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Recommended for you</span>
                  <span style={{ fontSize: 11.5, color: '#4B5970' }}>Based on your records</span>
                  <span style={{ flex: 1 }}/>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#1071F1', fontSize: 12, fontWeight: 500 }}>View all</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {GB_DATA.DOCTORS.slice(0, 3).map(d => <DoctorCard key={d.id} doctor={d} variant="mini"/>)}
                </div>
              </div>

              {/* Lab reports */}
              <div className="ge-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Recent lab reports</span>
                  <span style={{ flex: 1 }}/>
                  <button className="ge-btn ge-btn-ghost" style={{ padding: '6px 12px', fontSize: 11.5 }}><Icon.Plus size={12}/> Order test</button>
                </div>
                {[
                  { name: 'Complete Blood Count (CBC)', lab: 'Chughtai Lab', date: 'May 02', status: 'Ready', flag: 'Normal', color: '#0E9F6E' },
                  { name: 'Lipid Profile', lab: 'Excel Labs', date: 'Apr 28', status: 'Ready', flag: 'Borderline', color: '#C28220' },
                  { name: 'HbA1c', lab: 'Chughtai Lab', date: 'Apr 18', status: 'Ready', flag: 'Normal', color: '#0E9F6E' },
                  { name: 'Cardiac Echo', lab: 'Shifa Diagnostics', date: 'May 04', status: 'Scheduled', flag: 'Tomorrow', color: '#1071F1' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i ? '1px solid var(--ge-border-soft)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: r.color + '15', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon.Flask size={16} color={r.color}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#0B1729' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: '#4B5970' }}>{r.lab} · {r.date}</div>
                    </div>
                    <span className="ge-chip" style={{ background: r.color + '15', color: r.color, fontSize: 10.5 }}>{r.flag}</span>
                    <button style={{ background: 'transparent', border: 'none', color: '#1071F1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 4 }}><Icon.Arrow size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Order tracking */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Icon.Truck size={16} color="#5B4ABD"/>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>Medicine order</span>
                  <span style={{ flex: 1 }}/>
                  <span className="ge-chip ge-chip-purple" style={{ fontSize: 10 }}>Out for delivery</span>
                </div>
                <div style={{ fontSize: 12, color: '#4B5970' }}>Order #PH-2841 · 4 items · Rs. 1,840</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '14px 0' }}>
                  {['Confirmed', 'Packed', 'Out', 'Delivered'].map((s, i) => (
                    <React.Fragment key={s}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 99, background: i <= 2 ? '#5B4ABD' : '#E2E8F0' }}/>
                        <span style={{ fontSize: 9.5, color: i <= 2 ? '#0B1729' : '#7B8AA1', fontWeight: i === 2 ? 600 : 400 }}>{s}</span>
                      </div>
                      {i < 3 && <span style={{ flex: 1, height: 2, background: i < 2 ? '#5B4ABD' : '#E2E8F0', marginBottom: 14, borderRadius: 99 }}/>}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ padding: 10, background: '#F5F9FE', borderRadius: 8, fontSize: 11, color: '#4B5970', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon.Clock size={11}/> ETA 28 min · Faraz is heading to your address
                </div>
              </div>

              {/* Health records */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Icon.Doc size={16} color="#1071F1"/>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>Medical Records</span>
                  <span style={{ flex: 1 }}/>
                  <button style={{ background: 'transparent', border: 'none', color: '#1071F1', cursor: 'pointer', fontSize: 11.5 }}>+ Add</button>
                </div>
                {[
                  { i: 'Doc', l: 'Prescriptions', n: 12, c: '#1071F1' },
                  { i: 'Flask', l: 'Lab Reports', n: 24, c: '#0F9F95' },
                  { i: 'Activity', l: 'Vital Signs', n: 8, c: '#D03B3A' },
                  { i: 'Pill', l: 'Medications', n: 4, c: '#5B4ABD' },
                ].map((r, idx) => {
                  const Icn = Icon[r.i];
                  return (
                    <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: idx ? '1px solid var(--ge-border-soft)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: r.c + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icn size={13} color={r.c}/>
                      </div>
                      <span style={{ fontSize: 12.5, color: '#0B1729', flex: 1 }}>{r.l}</span>
                      <span style={{ fontSize: 11.5, color: '#4B5970' }}>{r.n}</span>
                      <Icon.ChevronRight size={13} color="#7B8AA1"/>
                    </div>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="ge-card" style={{ padding: 18, background: 'linear-gradient(135deg, #F5F9FE 0%, #E6F0FE 100%)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 12 }}>Quick actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { i: 'Stethoscope', l: 'Find doctor' },
                    { i: 'Flask', l: 'Order lab' },
                    { i: 'Pill', l: 'Refill meds' },
                    { i: 'Heart', l: 'Home nurse' },
                  ].map(a => {
                    const Icn = Icon[a.i];
                    return (
                      <button key={a.l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fff', border: '1px solid var(--ge-border-soft)', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', color: '#0B1729' }}>
                        <Icn size={14} color="#1071F1"/> {a.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PatientDashboard = PatientDashboard;
