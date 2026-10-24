// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Design System Reference
// ═════════════════════════════════════════════════════════════════

function DesignSystem() {
  const swatches = [
    { n: 'Deep Navy', h: '#0A2540', l: 'Brand · primary text' },
    { n: 'Trust Blue', h: '#1071F1', l: 'Primary action' },
    { n: 'Sky Blue', h: '#A5CDFC', l: 'Accent · light' },
    { n: 'Mint Health', h: '#0E9F6E', l: 'Success · health' },
    { n: 'Amber', h: '#C28220', l: 'Warning' },
    { n: 'Coral', h: '#D03B3A', l: 'Danger · vitals' },
    { n: 'Lavender', h: '#5B4ABD', l: 'Pharmacy · AI' },
    { n: 'Teal', h: '#0F9F95', l: 'Labs' },
  ];
  const neutrals = [
    { n: 'Ink', h: '#0B1729' },
    { n: 'Slate', h: '#4B5970' },
    { n: 'Mist', h: '#7B8AA1' },
    { n: 'Border', h: '#E2E8F0' },
    { n: 'Border-soft', h: '#EEF2F7' },
    { n: 'Snow', h: '#F5F9FE' },
    { n: 'White', h: '#FFFFFF' },
  ];

  return (
    <div style={{ background: '#fff', padding: 48, minHeight: '100%', fontFamily: 'var(--ge-font-sans)' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <GbLogo size={26}/>
          <span style={{ fontSize: 13, color: '#4B5970' }}>Design System v1.0 · Gilgit-Baltistan healthcare platform</span>
        </div>
        <h1 className="ge-display" style={{ fontSize: 42, color: '#0A2540', margin: 0, letterSpacing: '-0.025em' }}>The Gb Elaaj Design System</h1>
        <p style={{ fontSize: 15, color: '#4B5970', maxWidth: 720, marginTop: 8 }}>
          A trust-first, fintech-grade healthcare experience. Built around clarity, calm, and confidence — the qualities that matter when the stakes are personal. Bilingual-ready (English + Urdu), designed for low-bandwidth and accessible across rural connections.
        </p>
      </div>

      {/* Brand */}
      <Section title="Brand" desc="Logomark + voice. The mountains in the mark reference the Karakoram — 'health that reaches the heights.'">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ padding: 28, background: '#fff', border: '1px solid var(--ge-border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GbLogo size={36}/>
          </div>
          <div style={{ padding: 28, background: '#0A2540', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GbLogo size={36} dark/>
          </div>
          <div style={{ padding: 28, background: 'linear-gradient(135deg, #0A2540 0%, #1071F1 100%)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GbLogo size={36} dark/>
          </div>
        </div>
      </Section>

      {/* Type */}
      <Section title="Typography" desc="Plus Jakarta Sans for display, Inter for body, JetBrains Mono for transactional data.">
        <div style={{ background: '#F5F9FE', borderRadius: 16, padding: 28 }}>
          <div className="ge-display" style={{ fontSize: 56, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.025em', lineHeight: 1.05 }}>Health that travels with you.</div>
          <div style={{ fontSize: 11, color: '#4B5970', marginTop: 4, fontFamily: 'var(--ge-font-mono)' }}>Display / 56px / 600 / -0.025em</div>
          <div style={{ height: 24 }}/>
          <div style={{ fontSize: 32, fontWeight: 600, color: '#0A2540', letterSpacing: '-0.02em' }}>Section heading</div>
          <div style={{ fontSize: 11, color: '#4B5970', marginTop: 4, fontFamily: 'var(--ge-font-mono)' }}>H1 / 32px / 600</div>
          <div style={{ height: 18 }}/>
          <div style={{ fontSize: 16, color: '#0B1729', maxWidth: 540, lineHeight: 1.6 }}>Body copy stays calm and direct — sentences are short, tone is reassuring, never alarmist. We never use medical jargon without translation.</div>
          <div style={{ fontSize: 11, color: '#4B5970', marginTop: 4, fontFamily: 'var(--ge-font-mono)' }}>Body / 16px / 400 / 1.6 line height</div>
          <div style={{ height: 18 }}/>
          <div style={{ fontSize: 14, fontFamily: 'var(--ge-font-mono)', color: '#1071F1' }}>TX-008412 · Rs. 2,500 · 14 May 2026</div>
          <div style={{ fontSize: 11, color: '#4B5970', marginTop: 4, fontFamily: 'var(--ge-font-mono)' }}>Mono / for IDs, amounts, dates</div>
        </div>
      </Section>

      {/* Color */}
      <Section title="Color" desc="A trust-first palette. Navy & Trust Blue carry the brand. Mint = health/success. Amber/Coral signal urgency. Soft tints for surfaces.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {swatches.map(s => (
            <div key={s.n} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--ge-border-soft)' }}>
              <div style={{ background: s.h, height: 80 }}/>
              <div style={{ padding: '10px 12px', background: '#fff' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0B1729' }}>{s.n}</div>
                <div style={{ fontSize: 10.5, color: '#4B5970', fontFamily: 'var(--ge-font-mono)' }}>{s.h}</div>
                <div style={{ fontSize: 10.5, color: '#7B8AA1', marginTop: 2 }}>{s.l}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {neutrals.map(s => (
            <div key={s.n} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--ge-border-soft)' }}>
              <div style={{ background: s.h, height: 50, borderBottom: s.h === '#FFFFFF' ? '1px solid var(--ge-border)' : 'none' }}/>
              <div style={{ padding: '6px 8px', background: '#fff' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#0B1729' }}>{s.n}</div>
                <div style={{ fontSize: 9.5, color: '#4B5970', fontFamily: 'var(--ge-font-mono)' }}>{s.h}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Spacing & radii */}
      <Section title="Spacing, Radii & Elevation" desc="A 4-pt rhythm. Three radii (8/12/16) and three shadow tiers.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ padding: 18, background: '#F5F9FE', borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: '#4B5970', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Spacing scale</div>
            {[4, 8, 12, 16, 20, 24, 32, 48].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                <div style={{ width: s, height: 16, background: '#1071F1', borderRadius: 3 }}/>
                <span style={{ fontSize: 11, color: '#4B5970', fontFamily: 'var(--ge-font-mono)' }}>{s}px</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 18, background: '#F5F9FE', borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: '#4B5970', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Radii</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[{ r: 8, l: 'sm' }, { r: 12, l: 'md' }, { r: 16, l: 'lg' }, { r: 99, l: 'pill' }].map(r => (
                <div key={r.l} style={{ textAlign: 'center' }}>
                  <div style={{ width: 50, height: 50, background: '#1071F1', borderRadius: r.r }}/>
                  <div style={{ fontSize: 10, color: '#4B5970', marginTop: 4, fontFamily: 'var(--ge-font-mono)' }}>{r.l} · {r.r === 99 ? '999' : r.r}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: 18, background: '#F5F9FE', borderRadius: 12 }}>
            <div style={{ fontSize: 11, color: '#4B5970', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>Elevation</div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[
                { l: 'xs', s: '0 1px 2px rgba(15,42,79,.06)' },
                { l: 'sm', s: '0 4px 12px -2px rgba(15,42,79,.08), 0 2px 4px -2px rgba(15,42,79,.06)' },
                { l: 'md', s: '0 12px 28px -8px rgba(15,42,79,.12), 0 4px 10px -4px rgba(15,42,79,.08)' },
              ].map(e => (
                <div key={e.l} style={{ textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, background: '#fff', borderRadius: 12, boxShadow: e.s }}/>
                  <div style={{ fontSize: 10, color: '#4B5970', marginTop: 6, fontFamily: 'var(--ge-font-mono)' }}>{e.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Components */}
      <Section title="Buttons" desc="Three intents. Always paired with an icon when the action is the primary CTA.">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="ge-btn ge-btn-primary"><Icon.Stethoscope size={14}/> Book consultation</button>
          <button className="ge-btn ge-btn-ghost"><Icon.Doc size={14}/> View records</button>
          <button className="ge-btn" style={{ background: '#0E9F6E', color: '#fff' }}><Icon.CheckCircle size={14}/> Confirm</button>
          <button className="ge-btn" style={{ background: '#D03B3A', color: '#fff' }}><Icon.X size={14}/> Cancel visit</button>
          <button className="ge-btn ge-btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }}>Small ghost</button>
        </div>
      </Section>

      <Section title="Form controls">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 700 }}>
          <input style={selectS} placeholder="Search doctors, labs…"/>
          <input style={selectS} placeholder="Gilgit, Skardu, Hunza…"/>
          <select style={selectS}><option>Cardiology</option><option>Pediatrics</option></select>
          <input style={selectS} placeholder="0312 1234567"/>
        </div>
      </Section>

      <Section title="Cards & data primitives">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
          <Metric label="Heart rate" value="78 bpm" delta="2%" deltaDir="down" icon="Heart" accent="#D03B3A" sparkline="M0,18 L20,15 L40,17 L60,12 L80,14 L100,11 L120,13 L140,9 L160,12 L180,8 L200,10"/>
          <Metric label="Steps" value="6,842" delta="12%" deltaDir="up" icon="TrendUp" accent="#0E9F6E"/>
          <Metric label="Pending Rx" value="3" icon="Pill" accent="#5B4ABD"/>
          <Metric label="This month" value="Rs. 312K" delta="18%" deltaDir="up" icon="Wallet" accent="#1071F1"/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {GB_DATA.DOCTORS.slice(0, 3).map(d => <DoctorCard key={d.id} doctor={d} variant="mini"/>)}
        </div>
      </Section>

      <Section title="Chips & status">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="ge-chip ge-chip-success">● Available now</span>
          <span className="ge-chip ge-chip-warn">● Pending</span>
          <span className="ge-chip ge-chip-danger">● Out of stock</span>
          <span className="ge-chip ge-chip-blue">● Verified</span>
          <span className="ge-chip ge-chip-purple">● AI suggested</span>
          <span className="ge-chip ge-chip-soft">Cardiology</span>
          <VerifiedBadge/>
        </div>
      </Section>

      <Section title="Voice & writing principles">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { t: 'Calm, never alarmist', d: '"Your latest reading is slightly above target." Not "ALERT: BP critical."' },
            { t: 'Plain language first, jargon second', d: '"Cholesterol panel (lipid profile)" — always lead with the concept the patient knows.' },
            { t: 'Bilingual where it matters', d: 'Greetings, errors, and confirmations available in Urdu. Numbers stay in Latin script.' },
          ].map(p => (
            <div key={p.t} style={{ padding: 18, background: '#F5F9FE', borderRadius: 12, borderLeft: '3px solid #1071F1' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 6 }}>{p.t}</div>
              <div style={{ fontSize: 12.5, color: '#4B5970', lineHeight: 1.55 }}>{p.d}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0A2540', margin: 0, letterSpacing: '-0.015em' }}>{title}</h2>
        {desc && <p style={{ fontSize: 13, color: '#4B5970', margin: '4px 0 0', maxWidth: 720 }}>{desc}</p>}
      </div>
      {children}
    </section>
  );
}

window.DesignSystem = DesignSystem;
