// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Doctor Profile + Booking Flow
// ═════════════════════════════════════════════════════════════════
const { useState: useSP } = React;

function DoctorProfile({ onBook }) {
  const d = GB_DATA.DOCTORS[0]; // Dr. Ayesha
  const [tab, setTab] = useSP('video');
  const [selectedDay, setSelectedDay] = useSP(0);
  const [selectedSlot, setSelectedSlot] = useSP('4:30 PM');

  const days = [
    { label: 'Today',     date: 'May 03', slots: ['2:00 PM', '2:30 PM', '4:30 PM', '5:00 PM', '6:00 PM', '7:30 PM'] },
    { label: 'Tomorrow',  date: 'May 04', slots: ['10:00 AM', '11:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'] },
    { label: 'Mon',       date: 'May 05', slots: ['9:00 AM', '10:30 AM', '12:00 PM', '4:00 PM'] },
    { label: 'Tue',       date: 'May 06', slots: ['9:30 AM', '11:00 AM', '2:30 PM', '4:30 PM', '6:00 PM'] },
    { label: 'Wed',       date: 'May 07', slots: ['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM'] },
  ];

  return (
    <div style={{ background: '#F5F9FE', minHeight: '100%' }}>
      <PublicNav/>

      {/* Breadcrumb */}
      <div style={{ padding: '20px 56px 0', fontSize: 12, color: '#4B5970' }}>
        Home <Icon.ChevronRight size={11} style={{ verticalAlign: -1 }}/> Find Doctors <Icon.ChevronRight size={11} style={{ verticalAlign: -1 }}/> Cardiology <Icon.ChevronRight size={11} style={{ verticalAlign: -1 }}/> <span style={{ color: '#0B1729', fontWeight: 500 }}>{d.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, padding: '20px 56px 80px', alignItems: 'flex-start' }}>
        {/* MAIN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero card */}
          <div className="ge-card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(153,204,255,.4) 0%, transparent 70%)' }}/>
            <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Avatar src={d.photo} name={d.name} size={120}/>
                <span style={{ position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 99, background: '#0E9F6E', border: '3px solid #fff' }}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 className="ge-display" style={{ fontSize: 28, margin: 0, color: '#0A2540' }}>{d.name}</h1>
                  <VerifiedBadge/>
                </div>
                <div style={{ fontSize: 14, color: '#0B5BB8', fontWeight: 500, marginTop: 4 }}>{d.specialty}</div>
                <div style={{ fontSize: 13, color: '#4B5970', marginTop: 4 }}>{d.qualifications}</div>
                <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12, color: '#4B5970' }}>
                  <span><Icon.Briefcase size={12} style={{ verticalAlign: -1 }}/> {d.experience} yrs experience</span>
                  <span><Icon.Pin size={12} style={{ verticalAlign: -1 }}/> {d.clinic}, {d.city}</span>
                  <span><Icon.Globe size={12} style={{ verticalAlign: -1 }}/> English, Urdu, Shina</span>
                </div>
                {/* Stat strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 18, padding: 14, background: '#F5F9FE', borderRadius: 12, border: '1px solid var(--ge-border-soft)' }}>
                  {[
                    { v: d.rating + '★', l: `${d.reviews} reviews`, c: '#D89614' },
                    { v: `${d.satisfaction}%`, l: 'Satisfied patients', c: '#0E9F6E' },
                    { v: `~${d.waitTime} min`, l: 'Avg wait time', c: '#1071F1' },
                    { v: '2.4K+', l: 'Patients treated', c: '#5B4ABD' },
                  ].map((s, i) => (
                    <div key={i} style={{ borderLeft: i ? '1px solid var(--ge-border)' : 'none', paddingLeft: i ? 16 : 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#0B1729' }}>{s.v}</div>
                      <div style={{ fontSize: 11, color: '#4B5970', marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="ge-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--ge-border-soft)' }}>
              {[
                { id: 'video', icon: 'Video', label: 'Video Consultation', fee: 2500 },
                { id: 'clinic', icon: 'Building', label: 'Clinic Visit', fee: 3000 },
                { id: 'about', icon: 'User', label: 'About' },
                { id: 'reviews', icon: 'Star', label: 'Reviews' },
              ].map(t => {
                const Icn = Icon[t.icon];
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    padding: '16px 22px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 13, fontWeight: active ? 600 : 500, fontFamily: 'inherit',
                    color: active ? '#1071F1' : '#4B5970',
                    borderBottom: active ? '2px solid #1071F1' : '2px solid transparent',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}>
                    <Icn size={14}/> {t.label}
                    {t.fee && <span style={{ fontSize: 11, color: '#7B8AA1', fontWeight: 500 }}>· Rs. {t.fee}</span>}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: 24 }}>
              {(tab === 'video' || tab === 'clinic') && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0B1729' }}>Available slots</span>
                    <span className="ge-chip ge-chip-success">● Live availability</span>
                    <span style={{ flex: 1 }}/>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4B5970', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon.ArrowLeft size={12}/>
                    </button>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#1071F1', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon.Arrow size={12}/>
                    </button>
                  </div>
                  {/* Day picker */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
                    {days.map((day, i) => (
                      <button key={i} onClick={() => setSelectedDay(i)} style={{
                        padding: '12px 10px', borderRadius: 12, cursor: 'pointer',
                        border: '1px solid', fontFamily: 'inherit', textAlign: 'center',
                        borderColor: selectedDay === i ? '#1071F1' : 'var(--ge-border)',
                        background: selectedDay === i ? '#E6F0FE' : '#fff',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: selectedDay === i ? '#1071F1' : '#4B5970' }}>{day.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1729', marginTop: 4 }}>{day.date}</div>
                        <div style={{ fontSize: 10, color: '#0E9F6E', marginTop: 2, fontWeight: 500 }}>{day.slots.length} slots</div>
                      </button>
                    ))}
                  </div>
                  {/* Slot grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {days[selectedDay].slots.map(slot => {
                      const sel = selectedSlot === slot;
                      return (
                        <button key={slot} onClick={() => setSelectedSlot(slot)} style={{
                          padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                          border: '1px solid', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
                          borderColor: sel ? '#1071F1' : 'var(--ge-border)',
                          background: sel ? '#1071F1' : '#fff',
                          color: sel ? '#fff' : '#0B1729',
                        }}>{slot}</button>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', margin: '0 0 8px' }}>About Dr. Ayesha</h3>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: '#4B5970', margin: 0 }}>
                      Dr. Ayesha Khan is a senior interventional cardiologist with over 14 years of clinical experience across tertiary care hospitals in Pakistan and the United Kingdom. She specializes in coronary angiography, pacemaker implantation, and preventive cardiology for women's heart health.
                    </p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', margin: '0 0 10px' }}>Education & Training</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { y: '2010', t: 'MBBS — King Edward Medical University, Lahore' },
                        { y: '2015', t: 'FCPS Cardiology — College of Physicians & Surgeons Pakistan' },
                        { y: '2018', t: 'Fellowship in Interventional Cardiology — Royal Brompton, UK' },
                      ].map((e, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12.5 }}>
                          <span style={{ color: '#1071F1', fontWeight: 600, width: 50 }}>{e.y}</span>
                          <span style={{ color: '#0B1729' }}>{e.t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', margin: '0 0 10px' }}>Areas of expertise</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['Coronary angiography', 'Pacemaker implantation', 'Heart failure management', 'Preventive cardiology', 'Cardiac MRI', 'Lipid disorders', 'Hypertension'].map(s => (
                        <span key={s} className="ge-chip ge-chip-soft">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'reviews' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 20, background: '#F5F9FE', borderRadius: 12, marginBottom: 20 }}>
                    <div style={{ textAlign: 'center', paddingRight: 24, borderRight: '1px solid var(--ge-border)' }}>
                      <div style={{ fontSize: 36, fontWeight: 600, color: '#0A2540' }}>{d.rating}</div>
                      <Stars value={d.rating} size={14}/>
                      <div style={{ fontSize: 11, color: '#4B5970', marginTop: 4 }}>{d.reviews} reviews</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {[5, 4, 3, 2, 1].map(r => (
                        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                          <span style={{ width: 10, color: '#4B5970' }}>{r}★</span>
                          <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${[88, 9, 2, 0.5, 0.5][5-r]}%`, height: '100%', background: '#1071F1' }}/>
                          </div>
                          <span style={{ width: 30, textAlign: 'right', color: '#4B5970' }}>{[88, 9, 2, 0.5, 0.5][5-r]}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {GB_DATA.REVIEWS.map((r, i) => (
                      <div key={r.id} style={{ paddingBottom: 16, borderBottom: i < 2 ? '1px solid var(--ge-border-soft)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar src={[GB_DATA.PORTRAITS.pat1, GB_DATA.PORTRAITS.pat2, GB_DATA.PORTRAITS.pat3][i]} name={r.name} size={36}/>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: '#4B5970' }}>{r.city} · {r.when}</div>
                          </div>
                          <Stars value={r.rating} size={12}/>
                        </div>
                        <p style={{ fontSize: 13, color: '#0B1729', margin: '10px 0 0', lineHeight: 1.55 }}>{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map / Clinic info */}
          <div className="ge-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Icon.Pin size={16} color="#1071F1"/>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0B1729' }}>Clinic location</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>{d.clinic}</div>
                <div style={{ fontSize: 12, color: '#4B5970', marginTop: 4, lineHeight: 1.5 }}>Sector H-8/4, Pitras Bukhari Road, Islamabad. Available Mon–Sat. Free parking & wheelchair access.</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="ge-btn ge-btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }}><Icon.Map size={12}/> Directions</button>
                  <button className="ge-btn ge-btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }}><Icon.Phone size={12}/> Call clinic</button>
                </div>
              </div>
              <div style={{ height: 110, borderRadius: 12, background: 'linear-gradient(135deg, #E6F0FE 0%, #A5CDFC 100%)', position: 'relative', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 220 110" preserveAspectRatio="none">
                  <path d="M0 50 Q 60 30, 110 60 T 220 50" stroke="#fff" strokeWidth="2" fill="none" opacity=".6"/>
                  <path d="M0 80 Q 80 50, 140 90 T 220 75" stroke="#fff" strokeWidth="2" fill="none" opacity=".4"/>
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 99, background: '#1071F1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(11,132,254,.5)' }} className="ge-pulse">
                    <Icon.Pin size={16} color="#fff"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY BOOKING CARD */}
        <aside style={{ position: 'sticky', top: 90 }}>
          <div className="ge-card" style={{ padding: 20, boxShadow: 'var(--ge-shadow-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: '#0E9F6E' }} className="ge-pulse"/>
              <span style={{ fontSize: 12, color: '#0E9F6E', fontWeight: 600 }}>Available {tab === 'video' ? 'now' : 'today'}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>Book your appointment</div>
            <div style={{ fontSize: 12, color: '#4B5970', marginTop: 4 }}>Secure your slot in 60 seconds</div>

            <div style={{ marginTop: 16, padding: 14, background: '#F5F9FE', borderRadius: 12, border: '1px solid var(--ge-border-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4B5970', marginBottom: 6 }}>
                <span>Consultation type</span>
                <span style={{ color: '#0B1729', fontWeight: 600 }}>{tab === 'clinic' ? 'Clinic Visit' : 'Video Call'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4B5970', marginBottom: 6 }}>
                <span>Selected slot</span>
                <span style={{ color: '#0B1729', fontWeight: 600 }}>{days[selectedDay].label}, {selectedSlot}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4B5970' }}>
                <span>Duration</span>
                <span style={{ color: '#0B1729', fontWeight: 600 }}>20 minutes</span>
              </div>
              <div style={{ height: 1, background: 'var(--ge-border)', margin: '12px 0' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#4B5970' }}>Total fee</span>
                <span style={{ fontSize: 22, fontWeight: 600, color: '#0A2540' }}>Rs. {tab === 'clinic' ? '3,000' : '2,500'}</span>
              </div>
            </div>

            <button className="ge-btn ge-btn-primary" onClick={onBook} style={{ width: '100%', marginTop: 14, padding: '14px', fontSize: 14, justifyContent: 'center' }}>
              Confirm Booking <Icon.Arrow size={14}/>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 11, color: '#4B5970' }}>
              <Icon.Lock size={11}/> Secure payment · Refundable up to 1hr before
            </div>
          </div>

          {/* Trust card */}
          <div className="ge-card" style={{ padding: 16, marginTop: 14, background: 'linear-gradient(135deg, #F5F9FE 0%, #E6F0FE 100%)' }}>
            <Icon.Shield size={20} color="#1071F1"/>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginTop: 8 }}>Verified by PMDC</div>
            <div style={{ fontSize: 11.5, color: '#4B5970', marginTop: 4, lineHeight: 1.5 }}>License #PMC-12849-IS verified on Apr 12, 2026. Profile reviewed by our medical board.</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── BOOKING FLOW ───────────────────────────────────────────────
function BookingFlow() {
  const [step, setStep] = useSP(0);
  const d = GB_DATA.DOCTORS[0];
  const steps = ['Type', 'Schedule', 'Symptoms', 'Confirm'];
  const [type, setType] = useSP('video');
  const [slot, setSlot] = useSP('4:30 PM');
  const [day, setDay] = useSP('Today');
  const [symptom, setSymptom] = useSP('Chest tightness, occasional dizziness for past 5 days. Currently on Atenolol 50mg.');

  const next = () => setStep(s => Math.min(4, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  return (
    <div style={{ background: '#F5F9FE', minHeight: '100%' }}>
      <PublicNav/>
      <div style={{ padding: '36px 56px 80px', maxWidth: 880, margin: '0 auto' }}>
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 99,
                  background: i < step ? '#0E9F6E' : i === step ? '#1071F1' : '#fff',
                  color: i <= step ? '#fff' : '#7B8AA1',
                  border: i === step ? 'none' : i < step ? 'none' : '1px solid var(--ge-border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                }}>{i < step ? <Icon.Check size={13} strokeWidth="3"/> : i + 1}</div>
                <span style={{ fontSize: 12.5, color: i <= step ? '#0B1729' : '#7B8AA1', fontWeight: i === step ? 600 : 500 }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#0E9F6E' : '#E2E8F0', borderRadius: 99 }}/>}
            </React.Fragment>
          ))}
        </div>

        <div className="ge-card" style={{ padding: 28 }}>
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', margin: '0 0 6px', letterSpacing: '-0.02em' }}>How would you like to consult?</h2>
              <p style={{ fontSize: 13, color: '#4B5970', margin: '0 0 24px' }}>Choose the consultation format that works best for you.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { id: 'video', icon: 'Video', label: 'Video Consultation', desc: 'From the comfort of home, in 20-minute slots.', fee: 2500, badge: 'Most popular' },
                  { id: 'clinic', icon: 'Building', label: 'Clinic Visit', desc: 'In-person at Shifa International, Islamabad.', fee: 3000 },
                ].map(o => {
                  const Icn = Icon[o.icon];
                  const sel = type === o.id;
                  return (
                    <button key={o.id} onClick={() => setType(o.id)} style={{
                      padding: 22, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                      border: '2px solid', fontFamily: 'inherit',
                      borderColor: sel ? '#1071F1' : 'var(--ge-border)',
                      background: sel ? '#F5F9FE' : '#fff',
                      position: 'relative',
                    }}>
                      {o.badge && <span style={{ position: 'absolute', top: 12, right: 12 }} className="ge-chip ge-chip-success">{o.badge}</span>}
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: sel ? '#1071F1' : '#E6F0FE', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <Icn size={20} color={sel ? '#fff' : '#1071F1'}/>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#0B1729' }}>{o.label}</div>
                      <div style={{ fontSize: 12.5, color: '#4B5970', marginTop: 4, lineHeight: 1.5 }}>{o.desc}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1071F1', marginTop: 14 }}>Rs. {o.fee.toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Pick a date and time</h2>
              <p style={{ fontSize: 13, color: '#4B5970', margin: '0 0 24px' }}>Live availability for {d.name} · Updated just now</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
                {[{l:'Today',d:'May 03',c:6},{l:'Tomorrow',d:'May 04',c:5},{l:'Mon',d:'May 05',c:4},{l:'Tue',d:'May 06',c:5},{l:'Wed',d:'May 07',c:4}].map(dy => (
                  <button key={dy.d} onClick={() => setDay(dy.l)} style={{
                    padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    border: '1px solid', fontFamily: 'inherit',
                    borderColor: day === dy.l ? '#1071F1' : 'var(--ge-border)',
                    background: day === dy.l ? '#E6F0FE' : '#fff',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: day === dy.l ? '#1071F1' : '#4B5970' }}>{dy.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0B1729', marginTop: 4 }}>{dy.d}</div>
                    <div style={{ fontSize: 10, color: '#0E9F6E', marginTop: 2, fontWeight: 500 }}>{dy.c} slots</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', marginBottom: 10 }}>Available time slots</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                {['2:00 PM','2:30 PM','4:30 PM','5:00 PM','6:00 PM','7:30 PM','8:00 PM','9:00 PM'].map(s => {
                  const sel = slot === s;
                  return (
                    <button key={s} onClick={() => setSlot(s)} style={{
                      padding: '10px', borderRadius: 8, cursor: 'pointer',
                      border: '1px solid', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                      borderColor: sel ? '#1071F1' : 'var(--ge-border)',
                      background: sel ? '#1071F1' : '#fff',
                      color: sel ? '#fff' : '#0B1729',
                    }}>{s}</button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Tell the doctor what's going on</h2>
              <p style={{ fontSize: 13, color: '#4B5970', margin: '0 0 24px' }}>Share symptoms and any current medications. This helps the doctor prepare.</p>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', display: 'block', marginBottom: 6 }}>Symptoms / reason for visit</label>
                <textarea value={symptom} onChange={(e) => setSymptom(e.target.value)} rows={4} style={{
                  width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--ge-border)',
                  fontFamily: 'inherit', fontSize: 13, color: '#0B1729', background: '#F5F9FE',
                  outline: 'none', resize: 'vertical',
                }}/>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', display: 'block', marginBottom: 8 }}>Quick selectors (tap to add)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['Chest pain', 'Shortness of breath', 'High BP', 'Palpitations', 'Cholesterol', 'Diabetes', 'Headache', 'Fatigue'].map(s => (
                    <button key={s} className="ge-chip ge-chip-soft" style={{ cursor: 'pointer', border: '1px solid var(--ge-border)' }}>+ {s}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, border: '1px dashed var(--ge-border)', borderRadius: 10, background: '#F5F9FE' }}>
                <Icon.Doc size={16} color="#1071F1"/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0B1729' }}>Attach reports or prescriptions</div>
                  <div style={{ fontSize: 11, color: '#4B5970', marginTop: 2 }}>PDF, JPG, PNG · Max 10MB</div>
                </div>
                <button className="ge-btn ge-btn-ghost" style={{ padding: '7px 12px', fontSize: 11.5 }}>Browse files</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: '#0A2540', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Confirm and pay</h2>
              <p style={{ fontSize: 13, color: '#4B5970', margin: '0 0 24px' }}>Review your booking details below.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div className="ge-card" style={{ padding: 16, background: '#F5F9FE' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Avatar src={d.photo} name={d.name} size={48}/>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: '#4B5970' }}>{d.specialty}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                    {[['Type', type === 'video' ? 'Video Consultation' : 'Clinic Visit'], ['Date', day + ', May 03'], ['Time', slot + ' (20 min)'], ['Patient', 'Sana Yousaf (You)']].map(([k,v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#4B5970' }}>{k}</span><span style={{ color: '#0B1729', fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540', marginBottom: 10 }}>Payment method</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { id: 'card', icon: 'CreditCard', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, UnionPay' },
                      { id: 'jc',   icon: 'Wallet', label: 'JazzCash', sub: 'Mobile wallet' },
                      { id: 'es',   icon: 'Wallet', label: 'EasyPaisa', sub: 'Mobile wallet' },
                    ].map((p, i) => {
                      const Icn = Icon[p.icon];
                      return (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, border: '1px solid', borderColor: i === 0 ? '#1071F1' : 'var(--ge-border)', background: i === 0 ? '#F5F9FE' : '#fff', cursor: 'pointer' }}>
                          <input type="radio" defaultChecked={i === 0} name="pay" style={{ accentColor: '#1071F1' }}/>
                          <Icn size={16} color="#1071F1"/>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0B1729' }}>{p.label}</div>
                            <div style={{ fontSize: 10.5, color: '#4B5970' }}>{p.sub}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 16, padding: 14, background: '#0A2540', color: '#fff', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, opacity: .8 }}>
                      <span>Consultation fee</span><span>Rs. {type === 'clinic' ? '3,000' : '2,500'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, opacity: .8 }}>
                      <span>Platform fee</span><span>Rs. 0</span>
                    </div>
                    <div style={{ height: 1, background: 'rgba(255,255,255,.15)', margin: '8px 0' }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600 }}>
                      <span>Total</span><span>Rs. {type === 'clinic' ? '3,000' : '2,500'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 84, height: 84, borderRadius: 99, background: 'linear-gradient(135deg, #0E9F6E 0%, #0E9F6E 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px -8px rgba(21,163,110,.5)' }} className="ge-pulse">
                <Icon.Check size={40} color="#fff" strokeWidth="3"/>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 600, color: '#0A2540', margin: '20px 0 6px', letterSpacing: '-0.02em' }}>Booking confirmed!</h2>
              <p style={{ fontSize: 14, color: '#4B5970', margin: '0 0 24px' }}>A confirmation has been sent to your WhatsApp and email.</p>
              <div className="ge-card" style={{ padding: 18, maxWidth: 440, margin: '0 auto', textAlign: 'left', background: '#F5F9FE' }}>
                <div style={{ fontSize: 11, color: '#4B5970', textTransform: 'uppercase', letterSpacing: '.1em' }}>Booking ID</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>GE-2026-005847</div>
                <div style={{ height: 1, background: 'var(--ge-border)', margin: '12px 0' }}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={d.photo} name={d.name} size={40}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: '#4B5970' }}>{day}, May 03 · {slot} · Video Call</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
                <button className="ge-btn ge-btn-ghost"><Icon.Calendar size={14}/> Add to calendar</button>
                <button className="ge-btn ge-btn-primary"><Icon.Video size={14}/> Go to dashboard</button>
              </div>
            </div>
          )}
        </div>

        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
            <button onClick={back} disabled={step === 0} className="ge-btn ge-btn-ghost" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
              <Icon.ArrowLeft size={13}/> Back
            </button>
            <button onClick={next} className="ge-btn ge-btn-primary" style={{ padding: '12px 22px' }}>
              {step === 3 ? 'Pay & Confirm' : 'Continue'} <Icon.Arrow size={14}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

window.DoctorProfile = DoctorProfile;
window.BookingFlow = BookingFlow;
