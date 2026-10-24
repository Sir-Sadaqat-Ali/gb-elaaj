// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Doctor / Admin / Pharmacy / Lab / Nurse / Finance dashboards
// Premium fintech-y feel: dense data, subtle gradients
// ═════════════════════════════════════════════════════════════════
const { useState: useSD } = React;

// ── DOCTOR DASHBOARD ───────────────────────────────────────────
function DoctorDashboard() {
  const items = [
    { section: 'Practice' },
    { id: 'home', icon: 'Home', label: 'Today' },
    { id: 'sched', icon: 'Calendar', label: 'Schedule' },
    { id: 'pat', icon: 'Users', label: 'Patients', badge: 8 },
    { id: 'notes', icon: 'Doc', label: 'Notes & Rx' },
    { id: 'video', icon: 'Video', label: 'Video Room' },
    { section: 'Earnings' },
    { id: 'earn', icon: 'Wallet', label: 'Earnings' },
    { id: 'rev', icon: 'Star', label: 'Reviews' },
    { id: 'set', icon: 'Settings', label: 'Settings' },
  ];
  const today = [
    { t: '9:00 AM',  p: 'Bilal Ahmed',     r: 'Hypertension follow-up', type: 'video', status: 'done' },
    { t: '9:30 AM',  p: 'Sara Mahmood',    r: 'Chest pain consultation', type: 'clinic', status: 'done' },
    { t: '10:30 AM', p: 'Hassan Raza',     r: 'Echo report review', type: 'video', status: 'done' },
    { t: '11:30 AM', p: 'Naila Sheikh',    r: 'New patient', type: 'clinic', status: 'progress' },
    { t: '4:30 PM',  p: 'Sana Yousaf',     r: 'BP & medication review', type: 'video', status: 'upcoming' },
    { t: '5:00 PM',  p: 'Faisal Ahmed',    r: 'Routine checkup', type: 'video', status: 'upcoming' },
    { t: '6:00 PM',  p: 'Aisha Rahman',    r: 'Cholesterol consultation', type: 'clinic', status: 'upcoming' },
  ];
  return (
    <div className="ge-app-shell">
      <Sidebar items={items} active="home" accent="#1071F1"
        user={{ name: 'Dr. Ayesha Khan', role: 'Cardiology · PMDC verified', avatar: GB_DATA.PORTRAITS.f1 }}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Today's clinic" subtitle={`Tuesday, May 3 · 7 appointments scheduled · 2 pending requests`} search="Search patients, prescriptions…"
          actions={<button className="ge-btn ge-btn-primary" style={{ padding: '8px 14px', fontSize: 12.5 }}><Icon.Plus size={13}/> Add slot</button>}/>

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
            <Metric label="Today's appointments" value="7" delta="+2" deltaDir="up" icon="Calendar" accent="#1071F1"/>
            <Metric label="Pending requests" value="3" icon="Bell" accent="#C28220"/>
            <Metric label="This week earnings" value="Rs. 84,500" delta="14%" deltaDir="up" icon="Wallet" accent="#0E9F6E" sparkline="M0,28 L20,22 L40,18 L60,20 L80,14 L100,16 L120,12 L140,10 L160,8 L180,6 L200,4"/>
            <Metric label="Patient rating" value="4.9 ★" delta="+0.1" deltaDir="up" icon="Star" accent="#D89614"/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Today's schedule */}
              <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--ge-border-soft)' }}>
                  <Icon.Calendar size={16} color="#1071F1"/>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Today's schedule</span>
                  <span style={{ flex: 1 }}/>
                  <Pillbox value="day" onChange={()=>{}} options={[{v:'day',l:'Day'},{v:'week',l:'Week'},{v:'month',l:'Month'}]}/>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F5F9FE' }}>
                      {['Time', 'Patient', 'Reason', 'Type', 'Status', ''].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#4B5970', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {today.map((a, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--ge-border-soft)', background: a.status === 'progress' ? '#F5F9FE' : '#fff' }}>
                        <td style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: '#0B1729' }}>{a.t}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#0B1729' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={a.p} size={28}/> {a.p}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#4B5970' }}>{a.r}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={'ge-chip ' + (a.type === 'video' ? 'ge-chip-blue' : 'ge-chip-soft')} style={{ fontSize: 10.5 }}>
                            {a.type === 'video' ? <Icon.Video size={10}/> : <Icon.Building size={10}/>} {a.type === 'video' ? 'Video' : 'Clinic'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={'ge-chip ' + (a.status === 'done' ? 'ge-chip-success' : a.status === 'progress' ? 'ge-chip-warn' : 'ge-chip-soft')} style={{ fontSize: 10.5 }}>
                            {a.status === 'done' ? '● Completed' : a.status === 'progress' ? '● In progress' : '● Upcoming'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {a.status === 'upcoming' && a.type === 'video'
                            ? <button className="ge-btn ge-btn-primary" style={{ padding: '5px 12px', fontSize: 11 }}><Icon.Video size={11}/> Join</button>
                            : <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4B5970' }}><Icon.More size={14}/></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pending requests + recent notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div className="ge-card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 12 }}>Pending requests · 3</div>
                  {[
                    { p: 'Naveed Khan', r: 'Wants tomorrow 11 AM', when: '2 min ago' },
                    { p: 'Maryam Iqbal', r: 'Reschedule to Thu', when: '14 min ago' },
                    { p: 'Adnan Saleem', r: 'New booking · Friday', when: '1 hr ago' },
                  ].map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? '1px dashed var(--ge-border-soft)' : 'none' }}>
                      <Avatar name={p.p} size={32}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0B1729' }}>{p.p}</div>
                        <div style={{ fontSize: 11, color: '#4B5970' }}>{p.r} · {p.when}</div>
                      </div>
                      <button className="ge-btn ge-btn-primary" style={{ padding: '5px 10px', fontSize: 11 }}>Approve</button>
                      <button style={{ background: 'transparent', border: '1px solid var(--ge-border)', borderRadius: 99, width: 26, height: 26, cursor: 'pointer' }}><Icon.X size={11}/></button>
                    </div>
                  ))}
                </div>

                <div className="ge-card" style={{ padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 12 }}>Patient notes · last 24h</div>
                  {[
                    { p: 'Bilal Ahmed', n: 'Increased Atenolol to 75mg. F/U in 2 weeks. BP target 120/80.' },
                    { p: 'Sara Mahmood', n: 'ECG normal. Reassured. No further action needed.' },
                    { p: 'Hassan Raza', n: 'Echo shows mild LV dysfunction. Refer to interventional team.' },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: '10px 0', borderTop: i ? '1px dashed var(--ge-border-soft)' : 'none' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0B1729', marginBottom: 4 }}>{n.p}</div>
                      <div style={{ fontSize: 11.5, color: '#4B5970', lineHeight: 1.5 }}>{n.n}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Video room preview */}
              <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '16/10', background: 'linear-gradient(135deg, #0A2540 0%, #0B5BB8 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar src={GB_DATA.PORTRAITS.pat1} name="Sana" size={70} ring/>
                  {/* PiP self */}
                  <div style={{ position: 'absolute', bottom: 12, right: 12, width: 64, height: 80, borderRadius: 8, overflow: 'hidden', border: '2px solid #fff', backgroundImage: `url(${GB_DATA.PORTRAITS.f1})`, backgroundSize: 'cover', backgroundPosition: 'center' }}/>
                  {/* timer */}
                  <span style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(8px)', borderRadius: 99, color: '#fff', fontSize: 11, fontWeight: 500 }}>
                    <span style={{ color: '#0E9F6E', marginRight: 4 }}>●</span> LIVE · 04:12
                  </span>
                  {/* controls */}
                  <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 6 }}>
                    {[Icon.Mic, Icon.Video, Icon.Send].map((Icn, i) => (
                      <button key={i} style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(255,255,255,.18)', border: 'none', backdropFilter: 'blur(8px)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icn size={13} color="#fff"/>
                      </button>
                    ))}
                    <button style={{ width: 32, height: 32, borderRadius: 99, background: '#D03B3A', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon.Phone size={13} color="#fff"/>
                    </button>
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#4B5970' }}>In consultation with</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1729', marginTop: 2 }}>Sana Yousaf · Hypertension F/U</div>
                </div>
              </div>

              {/* Time slots manager */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon.Clock size={14} color="#1071F1"/>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>Tomorrow's slots</span>
                  <span style={{ flex: 1 }}/>
                  <button style={{ background: 'transparent', border: 'none', color: '#1071F1', fontSize: 11.5, cursor: 'pointer' }}>Edit</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { t: '10:00', f: false }, { t: '10:30', f: true }, { t: '11:00', f: false },
                    { t: '11:30', f: false }, { t: '1:00', f: false }, { t: '1:30', f: true },
                    { t: '3:30', f: false }, { t: '4:00', f: true }, { t: '5:00', f: false },
                  ].map((s, i) => (
                    <div key={i} style={{
                      padding: '8px 6px', textAlign: 'center', borderRadius: 8, fontSize: 11, fontWeight: 500,
                      background: s.f ? '#E6F0FE' : '#F5F9FE', color: s.f ? '#1071F1' : '#4B5970',
                      border: '1px solid', borderColor: s.f ? '#CCE2FE' : 'var(--ge-border-soft)',
                    }}>{s.t} {s.f && <span style={{ fontSize: 9 }}>· booked</span>}</div>
                  ))}
                </div>
              </div>

              {/* Earnings */}
              <div className="ge-card" style={{ padding: 18, background: 'linear-gradient(135deg, #0A2540 0%, #0B5BB8 100%)', color: '#fff', border: 'none' }}>
                <div style={{ fontSize: 12, opacity: .7 }}>This month</div>
                <div style={{ fontSize: 28, fontWeight: 600, marginTop: 4, letterSpacing: '-0.02em' }}>Rs. 312,500</div>
                <div style={{ fontSize: 11, marginTop: 4, color: '#A5CDFC' }}>▲ 18% vs last month</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.12)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, opacity: .7 }}>Consultations</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>124</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, opacity: .7 }}>Avg fee</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Rs. 2,520</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, opacity: .7 }}>Payout</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>May 5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ────────────────────────────────────────────
function AdminDashboard() {
  const items = [
    { section: 'Overview' },
    { id: 'home', icon: 'Home', label: 'Dashboard' },
    { id: 'users', icon: 'Users', label: 'Users' },
    { id: 'docs', icon: 'Stethoscope', label: 'Doctors', badge: 12 },
    { id: 'appts', icon: 'Calendar', label: 'Appointments' },
    { section: 'Operations' },
    { id: 'lab', icon: 'Flask', label: 'Labs' },
    { id: 'pharm', icon: 'Pill', label: 'Pharmacies' },
    { id: 'care', icon: 'Heart', label: 'Home Care' },
    { id: 'fin', icon: 'Wallet', label: 'Finance' },
    { section: 'System' },
    { id: 'set', icon: 'Settings', label: 'Settings' },
  ];

  return (
    <div className="ge-app-shell">
      <Sidebar items={items} active="home" accent="#0A2540"
        user={{ name: 'Hassan Iqbal', role: 'Super Admin' }}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Platform overview" subtitle="Live metrics across all services · Updated just now" search="Search users, transactions…"/>

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 18 }}>
            <Metric label="Total users" value="284,419" delta="+8.2%" deltaDir="up" icon="Users" accent="#1071F1" sparkline="M0,30 L20,28 L40,24 L60,22 L80,18 L100,16 L120,14 L140,12 L160,10 L180,8 L200,5"/>
            <Metric label="Verified doctors" value="12,408" delta="+124" deltaDir="up" icon="Stethoscope" accent="#0E9F6E" sparkline="M0,28 L20,26 L40,24 L60,22 L80,20 L100,18 L120,16 L140,14 L160,12 L180,10 L200,8"/>
            <Metric label="Appointments (mo.)" value="48,291" delta="+12%" deltaDir="up" icon="Calendar" accent="#5B4ABD" sparkline="M0,25 L20,22 L40,18 L60,20 L80,15 L100,17 L120,13 L140,11 L160,9 L180,7 L200,6"/>
            <Metric label="Orders (mo.)" value="9,847" delta="+5%" deltaDir="up" icon="Box" accent="#0F9F95" sparkline="M0,24 L20,20 L40,22 L60,18 L80,16 L100,14 L120,15 L140,12 L160,10 L180,9 L200,7"/>
            <Metric label="Revenue (mo.)" value="Rs. 4.2 Cr" delta="+18%" deltaDir="up" icon="Wallet" accent="#D89614" sparkline="M0,30 L20,26 L40,22 L60,20 L80,16 L100,14 L120,12 L140,10 L160,8 L180,5 L200,3"/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Doctor verification table */}
              <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--ge-border-soft)' }}>
                  <Icon.Shield size={16} color="#1071F1"/>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Doctor verification queue</span>
                  <span className="ge-chip ge-chip-warn">12 pending</span>
                  <span style={{ flex: 1 }}/>
                  <button className="ge-btn ge-btn-ghost" style={{ padding: '6px 12px', fontSize: 11.5 }}>Filter</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F5F9FE' }}>
                      {['Doctor', 'Specialty', 'PMDC #', 'Submitted', 'Documents', 'Action'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#4B5970', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { n: 'Dr. Faisal Karim', s: 'Dermatology', pmdc: '24891-PK', sub: '2h ago', docs: 4, photo: GB_DATA.PORTRAITS.m2 },
                      { n: 'Dr. Mehwish Ali', s: 'Pediatrics', pmdc: '19228-PK', sub: '5h ago', docs: 4, photo: GB_DATA.PORTRAITS.f3 },
                      { n: 'Dr. Tariq Mehmood', s: 'Orthopedic', pmdc: '34102-PK', sub: '1d ago', docs: 5, photo: GB_DATA.PORTRAITS.m3 },
                      { n: 'Dr. Hina Shah', s: 'Dermatology', pmdc: '40192-PK', sub: '2d ago', docs: 4, photo: GB_DATA.PORTRAITS.f4 },
                    ].map((d, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--ge-border-soft)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar src={d.photo} name={d.n} size={32}/>
                            <span style={{ fontSize: 12.5, fontWeight: 500, color: '#0B1729' }}>{d.n}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#4B5970' }}>{d.s}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#0B1729', fontFamily: 'JetBrains Mono, monospace' }}>{d.pmdc}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#4B5970' }}>{d.sub}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="ge-chip ge-chip-blue" style={{ fontSize: 10.5 }}>{d.docs} files</span>
                        </td>
                        <td style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                          <button className="ge-btn ge-btn-primary" style={{ padding: '5px 10px', fontSize: 11 }}>Approve</button>
                          <button className="ge-btn ge-btn-ghost" style={{ padding: '5px 10px', fontSize: 11 }}>Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent transactions */}
              <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--ge-border-soft)' }}>
                  <Icon.Wallet size={16} color="#0E9F6E"/>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Recent transactions</span>
                  <span style={{ flex: 1 }}/>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#1071F1', fontSize: 12 }}>Export CSV</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F5F9FE' }}>
                      {['Txn ID', 'Type', 'User', 'Amount', 'Commission', 'Status', 'Time'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#4B5970', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'TX-008412', t: 'Consult', u: 'Sana Y.', a: 2500, c: 250, s: 'success', when: '2 min' },
                      { id: 'TX-008411', t: 'Pharmacy', u: 'Bilal A.', a: 1840, c: 184, s: 'success', when: '5 min' },
                      { id: 'TX-008410', t: 'Lab', u: 'Saima B.', a: 3200, c: 320, s: 'pending', when: '8 min' },
                      { id: 'TX-008409', t: 'Consult', u: 'Faisal K.', a: 3500, c: 350, s: 'success', when: '14 min' },
                      { id: 'TX-008408', t: 'Refund', u: 'Hira M.', a: -2000, c: 0, s: 'refund', when: '22 min' },
                    ].map(t => (
                      <tr key={t.id} style={{ borderTop: '1px solid var(--ge-border-soft)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: '#4B5970' }}>{t.id}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#0B1729' }}>{t.t}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#0B1729' }}>{t.u}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: t.a < 0 ? '#D03B3A' : '#0B1729' }}>Rs. {Math.abs(t.a).toLocaleString()}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#4B5970' }}>Rs. {t.c}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span className={'ge-chip ' + (t.s === 'success' ? 'ge-chip-success' : t.s === 'pending' ? 'ge-chip-warn' : 'ge-chip-danger')} style={{ fontSize: 10.5 }}>
                            {t.s}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 11.5, color: '#4B5970' }}>{t.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Revenue chart */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>Revenue · last 30 days</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#0B1729', letterSpacing: '-0.02em' }}>Rs. 4.21 Cr</div>
                <div style={{ fontSize: 11, color: '#0E9F6E', marginTop: 2 }}>▲ Rs. 64L vs prev period</div>
                <svg width="100%" height="120" viewBox="0 0 280 120" style={{ marginTop: 14 }}>
                  <defs>
                    <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1071F1" stopOpacity=".25"/>
                      <stop offset="100%" stopColor="#1071F1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0,90 L20,82 L40,86 L60,72 L80,78 L100,64 L120,68 L140,52 L160,58 L180,44 L200,48 L220,32 L240,38 L260,22 L280,26"
                    stroke="#1071F1" strokeWidth="2" fill="none"/>
                  <path d="M0,90 L20,82 L40,86 L60,72 L80,78 L100,64 L120,68 L140,52 L160,58 L180,44 L200,48 L220,32 L240,38 L260,22 L280,26 L280,120 L0,120 Z" fill="url(#revG)"/>
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7B8AA1', marginTop: 4 }}>
                  <span>Apr 3</span><span>Apr 13</span><span>Apr 23</span><span>May 3</span>
                </div>
              </div>

              {/* Commission settings */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 12 }}>Commission rates</div>
                {[
                  { l: 'Doctor consultations', v: 10, c: '#1071F1' },
                  { l: 'Lab tests', v: 12, c: '#0F9F95' },
                  { l: 'Pharmacy orders', v: 8, c: '#5B4ABD' },
                  { l: 'Home care', v: 15, c: '#D03B3A' },
                ].map((r, i) => (
                  <div key={r.l} style={{ padding: '10px 0', borderTop: i ? '1px dashed var(--ge-border-soft)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#0B1729' }}>{r.l}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: r.c }}>{r.v}%</span>
                    </div>
                    <div style={{ height: 5, background: '#F5F9FE', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
                      <div style={{ width: `${r.v * 4}%`, height: '100%', background: r.c, borderRadius: 99 }}/>
                    </div>
                  </div>
                ))}
                <button className="ge-btn ge-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14, padding: '10px', fontSize: 12 }}>
                  <Icon.Edit size={12}/> Adjust rates
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PHARMACY ADMIN ─────────────────────────────────────────────
function PharmacyDashboard() {
  const items = [
    { section: 'Pharmacy' },
    { id: 'home', icon: 'Home', label: 'Overview' },
    { id: 'orders', icon: 'Box', label: 'Orders', badge: 24 },
    { id: 'inv', icon: 'Layers', label: 'Inventory' },
    { id: 'rx', icon: 'Doc', label: 'Prescriptions' },
    { id: 'earn', icon: 'Wallet', label: 'Earnings' },
  ];
  return (
    <div className="ge-app-shell">
      <Sidebar items={items} active="home" accent="#5B4ABD"
        user={{ name: 'Wahab Pharmacy', role: 'Karachi · Verified' }}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Pharmacy operations" subtitle="24 active orders · 3 prescriptions awaiting verification · 8 low-stock alerts" search="Search SKU, prescription, order…"/>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
            <Metric label="Today's orders" value="84" delta="+12%" deltaDir="up" icon="Box" accent="#5B4ABD"/>
            <Metric label="Out for delivery" value="18" icon="Truck" accent="#1071F1"/>
            <Metric label="Today's revenue" value="Rs. 142,800" delta="+9%" deltaDir="up" icon="Wallet" accent="#0E9F6E"/>
            <Metric label="Low-stock alerts" value="8" delta="critical" deltaDir="up" icon="Bell" accent="#D03B3A"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            {/* Orders */}
            <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ge-border-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Active orders</span>
                <span style={{ flex: 1 }}/>
                <Pillbox value="all" onChange={()=>{}} options={[{v:'all',l:'All'},{v:'pack',l:'Packing'},{v:'out',l:'Out'}]}/>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#F5F9FE' }}>
                  {['Order', 'Customer', 'Items', 'Total', 'Status', ''].map(h => <th key={h} style={{ textAlign:'left', padding:'10px 16px', fontSize:11, fontWeight:600, color:'#4B5970', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[
                    { id: 'PH-2841', c: 'Sana Y.', it: 4, t: 1840, s: 'Out', sc: '#5B4ABD' },
                    { id: 'PH-2840', c: 'Bilal A.', it: 2, t: 920, s: 'Packing', sc: '#C28220' },
                    { id: 'PH-2839', c: 'Hira M.', it: 7, t: 3240, s: 'Confirmed', sc: '#1071F1' },
                    { id: 'PH-2838', c: 'Kamran R.', it: 3, t: 1560, s: 'Delivered', sc: '#0E9F6E' },
                    { id: 'PH-2837', c: 'Naila S.', it: 5, t: 2480, s: 'Rx review', sc: '#D03B3A' },
                  ].map(o => (
                    <tr key={o.id} style={{ borderTop: '1px solid var(--ge-border-soft)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: '#0B1729' }}>{o.id}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#0B1729' }}>{o.c}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#4B5970' }}>{o.it} items</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#0B1729' }}>Rs. {o.t}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className="ge-chip" style={{ background: o.sc + '15', color: o.sc, fontSize: 10.5 }}>● {o.s}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}><Icon.ChevronRight size={14} color="#7B8AA1"/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Low stock */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>Low stock alerts</span>
                  <span className="ge-chip ge-chip-danger" style={{ fontSize: 10 }}>8 critical</span>
                </div>
                {[
                  { n: 'Atenolol 50mg', q: 14, low: true },
                  { n: 'Metformin 500mg', q: 22, low: true },
                  { n: 'Augmentin 625mg', q: 6, low: true },
                  { n: 'Panadol Extra', q: 38 },
                ].map((m, i) => (
                  <div key={m.n} style={{ padding: '10px 0', borderTop: i ? '1px dashed var(--ge-border-soft)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: m.low ? '#FBEAEA' : '#F5F9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon.Pill size={13} color={m.low ? '#D03B3A' : '#1071F1'}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#0B1729' }}>{m.n}</div>
                      <div style={{ fontSize: 10.5, color: m.low ? '#D03B3A' : '#4B5970' }}>{m.q} units left</div>
                    </div>
                    <button className="ge-btn ge-btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>Reorder</button>
                  </div>
                ))}
              </div>

              {/* Rx verification */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 10 }}>Prescriptions to verify · 3</div>
                {[
                  { p: 'Naila S.', d: 'Dr. Bilal A.', meds: 'Augmentin, Brufen' },
                  { p: 'Adnan S.', d: 'Dr. Mehwish A.', meds: 'Calpol syrup, ORS' },
                  { p: 'Kashif R.', d: 'Dr. Imran H.', meds: 'Zyrtec, Otrivin' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: '10px 0', borderTop: i ? '1px dashed var(--ge-border-soft)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#0B1729' }}>{r.p}</span>
                      <span style={{ fontSize: 10.5, color: '#4B5970' }}>by {r.d}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#4B5970', margin: '4px 0' }}>{r.meds}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="ge-btn ge-btn-primary" style={{ padding: '4px 10px', fontSize: 11, background: '#5B4ABD' }}>Verify</button>
                      <button className="ge-btn ge-btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }}>View Rx</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LAB ADMIN ──────────────────────────────────────────────────
function LabDashboard() {
  const items = [
    { section: 'Lab' },
    { id: 'home', icon: 'Home', label: 'Overview' },
    { id: 'book', icon: 'Calendar', label: 'Bookings', badge: 18 },
    { id: 'rep', icon: 'Doc', label: 'Reports' },
    { id: 'cat', icon: 'Layers', label: 'Test catalog' },
    { id: 'earn', icon: 'Wallet', label: 'Earnings' },
  ];
  return (
    <div className="ge-app-shell">
      <Sidebar items={items} active="home" accent="#0F9F95"
        user={{ name: 'Chughtai Lab GB', role: 'Gilgit · Verified' }}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Lab operations" subtitle="18 sample collections today · 12 reports awaiting upload" search="Search test, patient, report ID…"/>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
            <Metric label="Bookings today" value="48" delta="+22%" deltaDir="up" icon="Calendar" accent="#0F9F95"/>
            <Metric label="Reports pending" value="12" icon="Doc" accent="#C28220"/>
            <Metric label="On-time delivery" value="97%" delta="+2%" deltaDir="up" icon="CheckCircle" accent="#0E9F6E"/>
            <Metric label="Today's revenue" value="Rs. 86,400" delta="+14%" deltaDir="up" icon="Wallet" accent="#1071F1"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
            <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ge-border-soft)', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Test bookings — today</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#F5F9FE' }}>
                  {['Booking', 'Test', 'Patient', 'Type', 'Status', ''].map(h => <th key={h} style={{ textAlign:'left', padding:'10px 16px', fontSize:11, fontWeight:600, color:'#4B5970', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {[
                    { id: 'LB-9821', t: 'CBC', p: 'Sana Y.', ty: 'Home', s: 'Collected', sc: '#1071F1' },
                    { id: 'LB-9820', t: 'Lipid Profile', p: 'Bilal A.', ty: 'Walk-in', s: 'Reported', sc: '#0E9F6E' },
                    { id: 'LB-9819', t: 'HbA1c', p: 'Hira M.', ty: 'Home', s: 'In transit', sc: '#C28220' },
                    { id: 'LB-9818', t: 'Thyroid Panel', p: 'Kamran R.', ty: 'Walk-in', s: 'Processing', sc: '#5B4ABD' },
                    { id: 'LB-9817', t: 'Vitamin D', p: 'Naila S.', ty: 'Home', s: 'Booked', sc: '#4B5970' },
                  ].map(b => (
                    <tr key={b.id} style={{ borderTop: '1px solid var(--ge-border-soft)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: '#0B1729' }}>{b.id}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#0B1729', fontWeight: 500 }}>{b.t}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#4B5970' }}>{b.p}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className={'ge-chip ' + (b.ty === 'Home' ? 'ge-chip-blue' : 'ge-chip-soft')} style={{ fontSize: 10.5 }}>{b.ty}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className="ge-chip" style={{ background: b.sc + '15', color: b.sc, fontSize: 10.5 }}>● {b.s}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {b.s === 'Reported' ? <span style={{ fontSize: 11, color: '#4B5970' }}>—</span> : <button className="ge-btn ge-btn-primary" style={{ padding: '4px 10px', fontSize: 11, background: '#0F9F95' }}>Update</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Upload report */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 12 }}>Upload report</div>
                <div style={{ padding: 18, border: '1.5px dashed var(--ge-border)', borderRadius: 12, textAlign: 'center', background: '#F5F9FE' }}>
                  <Icon.Doc size={26} color="#0F9F95"/>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0B1729', marginTop: 10 }}>Drop PDF or click to upload</div>
                  <div style={{ fontSize: 11, color: '#4B5970', marginTop: 4 }}>Auto-attached to patient record</div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <select style={selectS} defaultValue="LB-9819">
                    <option>LB-9819 · Hira M. · HbA1c</option>
                    <option>LB-9818 · Kamran R. · Thyroid Panel</option>
                  </select>
                </div>
                <button className="ge-btn ge-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10, background: '#0F9F95', padding: '10px' }}>
                  Upload & notify patient
                </button>
              </div>

              {/* Top tests */}
              <div className="ge-card" style={{ padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 12 }}>Top tests this week</div>
                {[
                  { n: 'CBC', c: 124, p: 80 },
                  { n: 'Lipid Profile', c: 89, p: 58 },
                  { n: 'HbA1c', c: 74, p: 48 },
                  { n: 'Vitamin D', c: 52, p: 34 },
                ].map((t, i) => (
                  <div key={t.n} style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#0B1729' }}>{t.n}</span>
                      <span style={{ color: '#4B5970' }}>{t.c}</span>
                    </div>
                    <div style={{ height: 4, background: '#F5F9FE', borderRadius: 99 }}>
                      <div style={{ width: `${t.p}%`, height: '100%', background: '#0F9F95', borderRadius: 99 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NURSE DASHBOARD ────────────────────────────────────────────
function NurseDashboard() {
  const items = [
    { section: 'Visits' },
    { id: 'home', icon: 'Home', label: 'Today' },
    { id: 'asg', icon: 'Calendar', label: 'Assignments', badge: 4 },
    { id: 'pat', icon: 'Users', label: 'Patients' },
    { id: 'earn', icon: 'Wallet', label: 'Earnings' },
  ];
  return (
    <div className="ge-app-shell">
      <Sidebar items={items} active="home" accent="#D03B3A"
        user={{ name: 'Nurse Rabia', role: 'Senior · Lahore', avatar: GB_DATA.PORTRAITS.f4 }}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Today's visits" subtitle="4 assignments · 2 completed · Next visit in 45 min" search="Search patients…"
          actions={<button className="ge-btn" style={{ padding: '8px 14px', fontSize: 12.5, background: '#0E9F6E', color: '#fff' }}><Icon.CheckCircle size={13}/> Check in</button>}/>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
            <Metric label="Today's visits" value="4" icon="Calendar" accent="#D03B3A"/>
            <Metric label="Completed" value="2" icon="CheckCircle" accent="#0E9F6E"/>
            <Metric label="Hours logged" value="6h 22m" icon="Clock" accent="#1071F1"/>
            <Metric label="This week earnings" value="Rs. 18,400" delta="+8%" deltaDir="up" icon="Wallet" accent="#5B4ABD"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
            <div className="ge-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Today's assignments</span>
                <span style={{ flex: 1 }}/>
              </div>
              {[
                { p: 'Mr. Anwar (78)', a: 'Wound dressing', t: '9:00 AM', d: '45m', s: 'done', addr: 'Gulberg III, Lahore' },
                { p: 'Mrs. Saleha (62)', a: 'IV antibiotics', t: '11:30 AM', d: '1h', s: 'done', addr: 'DHA Phase 5' },
                { p: 'Mr. Akbar (74)', a: 'Post-op care', t: '2:30 PM', d: '1h 30m', s: 'progress', addr: 'Model Town' },
                { p: 'Ms. Hira (28)', a: 'Vitals & insulin', t: '4:30 PM', d: '30m', s: 'upcoming', addr: 'Faisal Town' },
              ].map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderTop: i ? '1px solid var(--ge-border-soft)' : 'none' }}>
                  <div style={{ width: 50, textAlign: 'center' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0B1729' }}>{v.t}</div>
                    <div style={{ fontSize: 10, color: '#4B5970', marginTop: 2 }}>{v.d}</div>
                  </div>
                  <Avatar name={v.p} size={36}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0B1729' }}>{v.p}</div>
                    <div style={{ fontSize: 11, color: '#4B5970' }}>{v.a} · <Icon.Pin size={10} style={{ verticalAlign: -1 }}/> {v.addr}</div>
                  </div>
                  <span className={'ge-chip ' + (v.s === 'done' ? 'ge-chip-success' : v.s === 'progress' ? 'ge-chip-warn' : 'ge-chip-soft')} style={{ fontSize: 10.5 }}>
                    {v.s === 'done' ? '● Done' : v.s === 'progress' ? '● In progress' : '● Upcoming'}
                  </span>
                  {v.s === 'upcoming' && <button className="ge-btn ge-btn-primary" style={{ padding: '5px 12px', fontSize: 11 }}><Icon.Map size={11}/> Navigate</button>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Location/Map */}
              <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #E6F0FE 0%, #A5CDFC 100%)', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 320 240" preserveAspectRatio="none">
                    <path d="M0 100 Q 80 70, 160 110 T 320 100" stroke="#fff" strokeWidth="2" fill="none" opacity=".6"/>
                    <path d="M0 160 Q 100 130, 180 170 T 320 150" stroke="#fff" strokeWidth="2" fill="none" opacity=".4"/>
                    <path d="M40 200 L 90 130 L 140 180 L 200 110 L 260 160" stroke="#1071F1" strokeWidth="2.5" strokeDasharray="6 4" fill="none"/>
                    {/* Visited */}
                    <circle cx="40" cy="200" r="6" fill="#0E9F6E"/><text x="50" y="204" fontSize="10" fill="#0A2540">Anwar</text>
                    <circle cx="90" cy="130" r="6" fill="#0E9F6E"/><text x="100" y="134" fontSize="10" fill="#0A2540">Saleha</text>
                    {/* Current */}
                    <circle cx="140" cy="180" r="9" fill="#C28220" stroke="#fff" strokeWidth="2"/><text x="152" y="184" fontSize="10" fill="#0A2540" fontWeight="600">Akbar (now)</text>
                    {/* Next */}
                    <circle cx="200" cy="110" r="6" fill="#1071F1"/><text x="210" y="114" fontSize="10" fill="#0A2540">Hira</text>
                  </svg>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 12, color: '#4B5970' }}>Route progress · 2 of 4</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1729', marginTop: 2 }}>13.4 km traveled today</div>
                </div>
              </div>
              {/* Check-in card */}
              <div className="ge-card" style={{ padding: 18, background: 'linear-gradient(135deg, #0A2540 0%, #D03B3A 130%)', color: '#fff', border: 'none' }}>
                <div style={{ fontSize: 12, opacity: .8 }}>Currently visiting</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>Mr. Akbar — Post-op care</div>
                <div style={{ fontSize: 11.5, marginTop: 4, opacity: .8 }}>Started 2:30 PM · 22 min elapsed</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="ge-btn" style={{ background: '#fff', color: '#D03B3A', padding: '8px 14px', fontSize: 12 }}>
                    <Icon.CheckCircle size={13}/> Complete visit
                  </button>
                  <button className="ge-btn" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', padding: '8px 14px', fontSize: 12, border: '1px solid rgba(255,255,255,.25)' }}>
                    <Icon.Edit size={13}/> Add note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FINANCE DASHBOARD ──────────────────────────────────────────
function FinanceDashboard() {
  const items = [
    { section: 'Finance' },
    { id: 'home', icon: 'Home', label: 'Overview' },
    { id: 'rev', icon: 'TrendUp', label: 'Revenue' },
    { id: 'wd', icon: 'Wallet', label: 'Withdrawals', badge: 14 },
    { id: 'tx', icon: 'CreditCard', label: 'Transactions' },
    { id: 'rep', icon: 'Doc', label: 'Reports' },
  ];
  return (
    <div className="ge-app-shell">
      <Sidebar items={items} active="home" accent="#0A2540"
        user={{ name: 'Maira Khan', role: 'Finance Lead' }}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Finance overview" subtitle="May 1 – May 3 · 14 withdrawal requests pending" search="Search transactions, providers…"
          actions={<button className="ge-btn ge-btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5 }}><Icon.Doc size={13}/> Export report</button>}/>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
            <Metric label="Gross revenue (mo.)" value="Rs. 4.21 Cr" delta="+18%" deltaDir="up" icon="TrendUp" accent="#0E9F6E" sparkline="M0,28 L20,24 L40,22 L60,18 L80,16 L100,14 L120,11 L140,9 L160,8 L180,6 L200,4"/>
            <Metric label="Platform commission" value="Rs. 42.4 L" delta="+14%" deltaDir="up" icon="Wallet" accent="#1071F1" sparkline="M0,30 L20,27 L40,24 L60,21 L80,19 L100,16 L120,14 L140,12 L160,10 L180,8 L200,6"/>
            <Metric label="Provider earnings" value="Rs. 3.79 Cr" delta="+19%" deltaDir="up" icon="Users" accent="#5B4ABD"/>
            <Metric label="Pending withdrawals" value="Rs. 24.8 L" delta="14 requests" icon="CreditCard" accent="#C28220"/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            {/* Revenue split chart */}
            <div className="ge-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', marginBottom: 14 }}>Revenue by service</div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                {/* Donut */}
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#F5F9FE" strokeWidth="20"/>
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#1071F1" strokeWidth="20" strokeDasharray="140 345" strokeDashoffset="0" transform="rotate(-90 70 70)"/>
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#0F9F95" strokeWidth="20" strokeDasharray="90 345" strokeDashoffset="-140" transform="rotate(-90 70 70)"/>
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#5B4ABD" strokeWidth="20" strokeDasharray="70 345" strokeDashoffset="-230" transform="rotate(-90 70 70)"/>
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#D03B3A" strokeWidth="20" strokeDasharray="45 345" strokeDashoffset="-300" transform="rotate(-90 70 70)"/>
                  <text x="70" y="68" textAnchor="middle" fontSize="20" fontWeight="600" fill="#0A2540">4.21</text>
                  <text x="70" y="84" textAnchor="middle" fontSize="9" fill="#4B5970">Cr (PKR)</text>
                </svg>
                <div style={{ flex: 1 }}>
                  {[
                    { l: 'Consultations', v: 'Rs. 1.71 Cr', p: 41, c: '#1071F1' },
                    { l: 'Lab tests', v: 'Rs. 1.10 Cr', p: 26, c: '#0F9F95' },
                    { l: 'Pharmacy', v: 'Rs. 0.86 Cr', p: 20, c: '#5B4ABD' },
                    { l: 'Home care', v: 'Rs. 0.54 Cr', p: 13, c: '#D03B3A' },
                  ].map(r => (
                    <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: r.c }}/>
                      <span style={{ fontSize: 11.5, color: '#0B1729', flex: 1 }}>{r.l}</span>
                      <span style={{ fontSize: 11.5, color: '#4B5970', fontVariantNumeric: 'tabular-nums' }}>{r.v}</span>
                      <span style={{ fontSize: 11, color: '#7B8AA1', width: 30, textAlign: 'right' }}>{r.p}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Withdrawals */}
            <div className="ge-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Withdrawal requests</span>
                <span className="ge-chip ge-chip-warn" style={{ fontSize: 10 }}>14 pending</span>
              </div>
              {[
                { p: 'Dr. Ayesha Khan', t: 'Doctor', a: 84500 },
                { p: 'Chughtai Lab GB', t: 'Lab', a: 124800 },
                { p: 'Wahab Pharmacy', t: 'Pharmacy', a: 56400 },
                { p: 'Nurse Rabia', t: 'Home care', a: 18400 },
              ].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? '1px dashed var(--ge-border-soft)' : 'none' }}>
                  <Avatar name={w.p} size={32}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#0B1729' }}>{w.p}</div>
                    <div style={{ fontSize: 10.5, color: '#4B5970' }}>{w.t}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1729', fontVariantNumeric: 'tabular-nums' }}>Rs. {w.a.toLocaleString()}</span>
                  <button className="ge-btn ge-btn-primary" style={{ padding: '5px 10px', fontSize: 11 }}>Approve</button>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions table */}
          <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ge-border-soft)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>All transactions</span>
              <span style={{ flex: 1 }}/>
              <Pillbox value="all" onChange={()=>{}} options={[{v:'all',l:'All'},{v:'in',l:'Incoming'},{v:'out',l:'Payouts'},{v:'ref',l:'Refunds'}]}/>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#F5F9FE' }}>
                {['Txn ID', 'Service', 'Provider', 'Patient', 'Gross', 'Commission', 'Net to provider', 'Status', 'Date'].map(h => <th key={h} style={{ textAlign:'left', padding:'10px 16px', fontSize:11, fontWeight:600, color:'#4B5970', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  { id: 'TX-008412', s: 'Consult', p: 'Dr. Ayesha K.', u: 'Sana Y.', g: 2500, c: 250, n: 2250, st: 'success', d: 'May 3, 2:14 PM' },
                  { id: 'TX-008411', s: 'Pharmacy', p: 'Wahab Pharmacy', u: 'Bilal A.', g: 1840, c: 184, n: 1656, st: 'success', d: 'May 3, 2:09 PM' },
                  { id: 'TX-008410', s: 'Lab', p: 'Chughtai Lab', u: 'Saima B.', g: 3200, c: 320, n: 2880, st: 'pending', d: 'May 3, 2:06 PM' },
                  { id: 'TX-008409', s: 'Consult', p: 'Dr. Bilal A.', u: 'Faisal K.', g: 3500, c: 350, n: 3150, st: 'success', d: 'May 3, 2:00 PM' },
                  { id: 'TX-008408', s: 'Refund', p: 'Dr. Imran H.', u: 'Hira M.', g: -2000, c: 0, n: -2000, st: 'refund', d: 'May 3, 1:52 PM' },
                  { id: 'TX-008407', s: 'Home care', p: 'Nurse Rabia', u: 'Mr. Anwar', g: 4500, c: 675, n: 3825, st: 'success', d: 'May 3, 1:14 PM' },
                ].map(t => (
                  <tr key={t.id} style={{ borderTop: '1px solid var(--ge-border-soft)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#4B5970' }}>{t.id}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11.5, color: '#0B1729' }}>{t.s}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11.5, color: '#0B1729' }}>{t.p}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11.5, color: '#4B5970' }}>{t.u}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: t.g < 0 ? '#D03B3A' : '#0B1729', fontWeight: 500 }}>Rs. {Math.abs(t.g).toLocaleString()}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11.5, color: '#4B5970', fontVariantNumeric: 'tabular-nums' }}>Rs. {t.c}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: t.n < 0 ? '#D03B3A' : '#0B1729', fontWeight: 600 }}>Rs. {Math.abs(t.n).toLocaleString()}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className={'ge-chip ' + (t.st === 'success' ? 'ge-chip-success' : t.st === 'pending' ? 'ge-chip-warn' : 'ge-chip-danger')} style={{ fontSize: 10 }}>{t.st}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 11, color: '#4B5970' }}>{t.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DoctorDashboard = DoctorDashboard;
window.AdminDashboard = AdminDashboard;
window.PharmacyDashboard = PharmacyDashboard;
window.LabDashboard = LabDashboard;
window.NurseDashboard = NurseDashboard;
window.FinanceDashboard = FinanceDashboard;
