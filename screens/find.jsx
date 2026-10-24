// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Find Doctors Page (working filters + search)
// ═════════════════════════════════════════════════════════════════
const { useState: useSF, useMemo: useMF } = React;

function FindDoctorsPage() {
  const [query, setQuery] = useSF('');
  const [specialty, setSpecialty] = useSF('all');
  const [city, setCity] = useSF('all');
  const [gender, setGender] = useSF('any');
  const [feeMax, setFeeMax] = useSF(5000);
  const [availability, setAvailability] = useSF('any');
  const [minRating, setMinRating] = useSF(0);
  const [consultType, setConsultType] = useSF('any');
  const [sort, setSort] = useSF('relevance');

  const filtered = useMF(() => {
    let list = GB_DATA.DOCTORS.filter(d => {
      if (query && !d.name.toLowerCase().includes(query.toLowerCase()) && !d.specialty.toLowerCase().includes(query.toLowerCase())) return false;
      if (specialty !== 'all' && d.specId !== specialty) return false;
      if (city !== 'all' && d.city !== city) return false;
      if (gender !== 'any' && d.gender !== gender) return false;
      if (d.fee > feeMax) return false;
      if (availability !== 'any' && d.available !== availability) return false;
      if (d.rating < minRating) return false;
      if (consultType !== 'any' && !d.types.includes(consultType)) return false;
      return true;
    });
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === 'fee_low') list = [...list].sort((a, b) => a.fee - b.fee);
    if (sort === 'fee_high') list = [...list].sort((a, b) => b.fee - a.fee);
    if (sort === 'experience') list = [...list].sort((a, b) => b.experience - a.experience);
    return list;
  }, [query, specialty, city, gender, feeMax, availability, minRating, consultType, sort]);

  const reset = () => {
    setQuery(''); setSpecialty('all'); setCity('all'); setGender('any');
    setFeeMax(5000); setAvailability('any'); setMinRating(0); setConsultType('any');
  };

  return (
    <div style={{ background: '#F5F9FE', minHeight: '100%' }}>
      <PublicNav/>

      {/* Search header */}
      <div style={{ background: 'linear-gradient(180deg, #F7F9FC 0%, #F5F9FE 100%)', padding: '36px 56px 24px', borderBottom: '1px solid var(--ge-border-soft)' }}>
        <div style={{ fontSize: 12, color: '#4B5970', marginBottom: 6 }}>
          <span style={{ cursor: 'pointer' }}>Home</span> <Icon.ChevronRight size={11} style={{ verticalAlign: -1, color: '#7B8AA1' }}/> <span style={{ color: '#0B1729', fontWeight: 500 }}>Find Doctors</span>
        </div>
        <h1 className="ge-display" style={{ fontSize: 32, margin: '4px 0 4px', color: '#0A2540' }}>Find verified doctors</h1>
        <p style={{ fontSize: 14, color: '#4B5970', margin: 0 }}>{GB_DATA.DOCTORS.length} doctors available · Live availability updated every 60 seconds</p>

        {/* Search row */}
        <div className="ge-card-soft" style={{
          marginTop: 24, padding: 6, display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr auto', alignItems: 'center', gap: 4,
          borderRadius: 14, boxShadow: 'var(--ge-shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
            <Icon.Search size={16} color="#1071F1"/>
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search doctor name, specialty, or condition…"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13.5, fontFamily: 'inherit', color: '#0B1729', width: '100%' }}/>
          </div>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={selectS}>
            <option value="all">All specialties</option>
            {GB_DATA.SPECIALTIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} style={selectS}>
            <option value="all">All cities</option>
            {GB_DATA.CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="ge-btn ge-btn-primary" style={{ padding: '12px 22px', borderRadius: 10 }}>
            <Icon.Search size={14}/> Search
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, padding: '28px 56px 80px', alignItems: 'flex-start' }}>
        {/* SIDEBAR FILTERS */}
        <aside className="ge-card" style={{ padding: 22, position: 'sticky', top: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Icon.Sliders size={16} color="#1071F1"/>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0B1729' }}>Filters</span>
            <span style={{ flex: 1 }}/>
            <button onClick={reset} style={{ background: 'transparent', border: 'none', fontSize: 11.5, color: '#1071F1', cursor: 'pointer', fontWeight: 500 }}>Reset</button>
          </div>

          <FilterGroup label="Gender">
            <Pillbox value={gender} onChange={setGender} options={[{ v: 'any', l: 'Any' }, { v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }]}/>
          </FilterGroup>

          <FilterGroup label="Consultation type">
            <Pillbox value={consultType} onChange={setConsultType} options={[{ v: 'any', l: 'Any' }, { v: 'video', l: 'Video' }, { v: 'clinic', l: 'Clinic' }]}/>
          </FilterGroup>

          <FilterGroup label="Availability">
            <Pillbox value={availability} onChange={setAvailability} options={[{ v: 'any', l: 'Any' }, { v: 'today', l: 'Today' }, { v: 'tomorrow', l: 'Tomorrow' }]}/>
          </FilterGroup>

          <FilterGroup label={`Max fee · Rs. ${feeMax.toLocaleString()}`}>
            <input type="range" min="500" max="5000" step="100" value={feeMax} onChange={(e) => setFeeMax(+e.target.value)}
              style={{ width: '100%', accentColor: '#1071F1' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#7B8AA1', marginTop: 2 }}>
              <span>Rs. 500</span><span>Rs. 5,000</span>
            </div>
          </FilterGroup>

          <FilterGroup label="Minimum rating">
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 4, 4.5, 4.8].map(r => (
                <button key={r} onClick={() => setMinRating(r)} style={{
                  flex: 1, padding: '8px 6px', borderRadius: 8, fontSize: 11.5, fontWeight: 500,
                  border: '1px solid', cursor: 'pointer',
                  borderColor: minRating === r ? '#1071F1' : 'var(--ge-border)',
                  background: minRating === r ? '#E6F0FE' : '#fff',
                  color: minRating === r ? '#1071F1' : '#4B5970',
                }}>{r === 0 ? 'Any' : `${r}★+`}</button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Specialty">
            <div className="ge-scroll" style={{ maxHeight: 180, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[{ id: 'all', name: 'All specialties' }, ...GB_DATA.SPECIALTIES].map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: specialty === s.id ? '#E6F0FE' : 'transparent' }}>
                  <input type="radio" checked={specialty === s.id} onChange={() => setSpecialty(s.id)} style={{ accentColor: '#1071F1' }}/>
                  <span style={{ fontSize: 12, color: '#0B1729', flex: 1 }}>{s.name}</span>
                  {s.count && <span style={{ fontSize: 10.5, color: '#7B8AA1' }}>{s.count}</span>}
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="City" last>
            <div className="ge-scroll" style={{ maxHeight: 160, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[{ v: 'all', l: 'All cities' }, ...GB_DATA.CITIES.map(c => ({ v: c, l: c }))].map(c => (
                <label key={c.v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: city === c.v ? '#E6F0FE' : 'transparent' }}>
                  <input type="radio" checked={city === c.v} onChange={() => setCity(c.v)} style={{ accentColor: '#1071F1' }}/>
                  <span style={{ fontSize: 12, color: '#0B1729', flex: 1 }}>{c.l}</span>
                </label>
              ))}
            </div>
          </FilterGroup>
        </aside>

        {/* RESULTS */}
        <div>
          {/* Featured strip */}
          <div className="ge-card" style={{ padding: 18, marginBottom: 18, background: 'linear-gradient(135deg, #0A2540 0%, #0B5BB8 100%)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.Award size={20} color="#6EAFF8"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Featured · Top-rated specialists this week</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Hand-picked by our medical board · 99%+ satisfaction</div>
            </div>
            <div style={{ display: 'flex', gap: -6 }}>
              {[GB_DATA.PORTRAITS.f1, GB_DATA.PORTRAITS.m1, GB_DATA.PORTRAITS.f3, GB_DATA.PORTRAITS.m4].map((p, i) => (
                <img key={i} src={p} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #0B5BB8', marginLeft: i === 0 ? 0 : -10, objectFit: 'cover' }}/>
              ))}
            </div>
            <button className="ge-btn" style={{ background: '#fff', color: '#1071F1', padding: '8px 14px', fontSize: 12.5 }}>View featured</button>
          </div>

          {/* Sort + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1729' }}>
              {filtered.length} doctor{filtered.length === 1 ? '' : 's'}
            </span>
            <span style={{ fontSize: 12, color: '#4B5970' }}>matching your filters</span>
            <span style={{ flex: 1 }}/>
            <span style={{ fontSize: 12, color: '#4B5970' }}>Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectS}>
              <option value="relevance">Relevance</option>
              <option value="rating">Highest rated</option>
              <option value="fee_low">Fee: low to high</option>
              <option value="fee_high">Fee: high to low</option>
              <option value="experience">Most experienced</option>
            </select>
          </div>

          {/* Active chips */}
          {(specialty !== 'all' || city !== 'all' || gender !== 'any' || availability !== 'any' || consultType !== 'any' || minRating > 0) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {specialty !== 'all' && <ActiveChip label={GB_DATA.SPECIALTIES.find(s => s.id === specialty)?.name} onClear={() => setSpecialty('all')}/>}
              {city !== 'all' && <ActiveChip label={city} onClear={() => setCity('all')}/>}
              {gender !== 'any' && <ActiveChip label={gender} onClear={() => setGender('any')}/>}
              {availability !== 'any' && <ActiveChip label={`Available ${availability}`} onClear={() => setAvailability('any')}/>}
              {consultType !== 'any' && <ActiveChip label={consultType === 'video' ? 'Video consultation' : 'Clinic visit'} onClear={() => setConsultType('any')}/>}
              {minRating > 0 && <ActiveChip label={`${minRating}★ and above`} onClear={() => setMinRating(0)}/>}
            </div>
          )}

          {/* List */}
          {filtered.length === 0 ? (
            <EmptyState icon="Search" title="No doctors match these filters"
              body="Try widening your fee range, switching cities, or clearing filters." action={<button className="ge-btn ge-btn-primary" onClick={reset}>Reset filters</button>}/>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map(d => <DoctorCard key={d.id} doctor={d}/>)}
            </div>
          )}

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            <button className="ge-btn ge-btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5 }}><Icon.ArrowLeft size={13}/> Previous</button>
            {[1, 2, 3, '…', 24].map((p, i) => (
              <button key={i} style={{
                width: 34, height: 34, borderRadius: 8, border: '1px solid var(--ge-border)',
                background: p === 1 ? '#1071F1' : '#fff', color: p === 1 ? '#fff' : '#0B1729',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              }}>{p}</button>
            ))}
            <button className="ge-btn ge-btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5 }}>Next <Icon.Arrow size={13}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

const selectS = {
  border: '1px solid var(--ge-border)', borderRadius: 10, padding: '9px 12px',
  fontSize: 13, fontFamily: 'inherit', color: '#0B1729', background: '#fff',
  cursor: 'pointer', outline: 'none',
};

function FilterGroup({ label, children, last }) {
  return (
    <div style={{ paddingBottom: last ? 0 : 18, marginBottom: last ? 0 : 18, borderBottom: last ? 'none' : '1px solid var(--ge-border-soft)' }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0A2540', marginBottom: 10, letterSpacing: '-0.005em' }}>{label}</div>
      {children}
    </div>
  );
}

function Pillbox({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', background: '#F5F9FE', padding: 3, borderRadius: 99, gap: 2, border: '1px solid var(--ge-border-soft)' }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} style={{
          flex: 1, padding: '6px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
          fontSize: 11.5, fontWeight: 500, fontFamily: 'inherit',
          background: value === o.v ? '#fff' : 'transparent',
          color: value === o.v ? '#1071F1' : '#4B5970',
          boxShadow: value === o.v ? 'var(--ge-shadow-xs)' : 'none',
        }}>{o.l}</button>
      ))}
    </div>
  );
}

function ActiveChip({ label, onClear }) {
  return (
    <span className="ge-chip ge-chip-blue" style={{ padding: '5px 6px 5px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {label}
      <button onClick={onClear} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: '#1071F1', display: 'inline-flex' }}>
        <Icon.X size={11} strokeWidth="2.5"/>
      </button>
    </span>
  );
}

window.FindDoctorsPage = FindDoctorsPage;
