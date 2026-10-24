// ═════════════════════════════════════════════════════════════════
// Gb Elaaj — Shared mock data (doctors, specialties, cities, etc.)
// ═════════════════════════════════════════════════════════════════

const CITIES = ['Gilgit', 'Skardu', 'Hunza', 'Islamabad', 'Lahore', 'Karachi', 'Peshawar', 'Rawalpindi'];

const SPECIALTIES = [
  { id: 'cardio',  name: 'Cardiology',     icon: 'Heart',        urdu: 'دل',     count: 248 },
  { id: 'gyn',     name: 'Gynecology',     icon: 'User',         urdu: 'زنانہ', count: 412 },
  { id: 'derm',    name: 'Dermatology',    icon: 'Spark',        urdu: 'جلد',   count: 189 },
  { id: 'paeds',   name: 'Pediatrics',     icon: 'Users',        urdu: 'بچے',   count: 327 },
  { id: 'gen',     name: 'General Physician', icon: 'Stethoscope', urdu: 'عام', count: 814 },
  { id: 'ortho',   name: 'Orthopedic',     icon: 'Activity',     urdu: 'ہڈی',  count: 156 },
  { id: 'ent',     name: 'ENT Specialist', icon: 'Headset',      urdu: 'ناک کان', count: 134 },
  { id: 'psych',   name: 'Psychiatry',     icon: 'AI',           urdu: 'نفسیات', count: 98  },
  { id: 'dent',    name: 'Dentistry',      icon: 'Plus2',        urdu: 'دانت',  count: 276 },
  { id: 'eye',     name: 'Eye Specialist', icon: 'Eye',          urdu: 'آنکھ', count: 165 },
];

// Unsplash placeholder portraits — small, real-looking generics
const PORTRAITS = {
  m1: 'https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=240&h=240&fit=crop&crop=faces&q=80',
  m2: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=240&h=240&fit=crop&crop=faces&q=80',
  m3: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=240&h=240&fit=crop&crop=faces&q=80',
  m4: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=240&h=240&fit=crop&crop=faces&q=80',
  f1: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=240&h=240&fit=crop&crop=faces&q=80',
  f2: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=240&h=240&fit=crop&crop=faces&q=80',
  f3: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=240&h=240&fit=crop&crop=faces&q=80',
  f4: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=240&h=240&fit=crop&crop=faces&q=80',
  pat1:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=faces&q=80',
  pat2:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&crop=faces&q=80',
  pat3:'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=160&h=160&fit=crop&crop=faces&q=80',
};

const DOCTORS = [
  {
    id: 'd1', name: 'Dr. Ayesha Khan', specialty: 'Cardiology', specId: 'cardio',
    qualifications: 'MBBS, FCPS (Cardiology)', experience: 14,
    fee: 2500, city: 'Islamabad', clinic: 'Shifa International',
    rating: 4.9, reviews: 412, satisfaction: 98, waitTime: 12,
    gender: 'female', verified: true, available: 'today',
    types: ['video', 'clinic'], photo: PORTRAITS.f1,
    nextSlot: '4:30 PM today', bio: 'Senior interventional cardiologist with 14 years of clinical experience across tertiary care hospitals.',
  },
  {
    id: 'd2', name: 'Dr. Imran Hussain', specialty: 'General Physician', specId: 'gen',
    qualifications: 'MBBS, MD (Internal Medicine)', experience: 9,
    fee: 1500, city: 'Gilgit', clinic: 'Gilgit Medical Centre',
    rating: 4.8, reviews: 308, satisfaction: 96, waitTime: 8,
    gender: 'male', verified: true, available: 'today',
    types: ['video', 'clinic'], photo: PORTRAITS.m1,
    nextSlot: '6:00 PM today',
  },
  {
    id: 'd3', name: 'Dr. Saima Baig', specialty: 'Gynecology', specId: 'gyn',
    qualifications: 'MBBS, FCPS (Gynae & Obs)', experience: 18,
    fee: 3000, city: 'Lahore', clinic: 'Hameed Latif Hospital',
    rating: 4.9, reviews: 624, satisfaction: 99, waitTime: 15,
    gender: 'female', verified: true, available: 'tomorrow',
    types: ['clinic'], photo: PORTRAITS.f2,
    nextSlot: 'Tomorrow 10:30 AM',
  },
  {
    id: 'd4', name: 'Dr. Faisal Karim', specialty: 'Dermatology', specId: 'derm',
    qualifications: 'MBBS, FCPS (Dermatology)', experience: 11,
    fee: 2200, city: 'Skardu', clinic: 'Skardu Skin & Care Clinic',
    rating: 4.7, reviews: 187, satisfaction: 95, waitTime: 10,
    gender: 'male', verified: true, available: 'today',
    types: ['video'], photo: PORTRAITS.m2,
    nextSlot: '7:15 PM today',
  },
  {
    id: 'd5', name: 'Dr. Mehwish Ali', specialty: 'Pediatrics', specId: 'paeds',
    qualifications: 'MBBS, DCH, FCPS', experience: 12,
    fee: 1800, city: 'Karachi', clinic: 'Liaquat National',
    rating: 4.9, reviews: 521, satisfaction: 98, waitTime: 11,
    gender: 'female', verified: true, available: 'today',
    types: ['video', 'clinic'], photo: PORTRAITS.f3,
    nextSlot: '5:00 PM today',
  },
  {
    id: 'd6', name: 'Dr. Tariq Mehmood', specialty: 'Orthopedic', specId: 'ortho',
    qualifications: 'MBBS, FRCS (Ortho)', experience: 21,
    fee: 3500, city: 'Islamabad', clinic: 'CMH Rawalpindi',
    rating: 4.8, reviews: 289, satisfaction: 96, waitTime: 18,
    gender: 'male', verified: true, available: 'tomorrow',
    types: ['clinic'], photo: PORTRAITS.m3,
    nextSlot: 'Tomorrow 11:00 AM',
  },
  {
    id: 'd7', name: 'Dr. Hina Shah', specialty: 'Dermatology', specId: 'derm',
    qualifications: 'MBBS, MD (Dermatology)', experience: 8,
    fee: 2000, city: 'Hunza', clinic: 'Hunza Wellness',
    rating: 4.7, reviews: 142, satisfaction: 95, waitTime: 9,
    gender: 'female', verified: true, available: 'today',
    types: ['video', 'clinic'], photo: PORTRAITS.f4,
    nextSlot: '4:00 PM today',
  },
  {
    id: 'd8', name: 'Dr. Bilal Anwar', specialty: 'Cardiology', specId: 'cardio',
    qualifications: 'MBBS, MRCP (UK)', experience: 15,
    fee: 3200, city: 'Lahore', clinic: 'Punjab Institute of Cardiology',
    rating: 4.8, reviews: 367, satisfaction: 97, waitTime: 14,
    gender: 'male', verified: true, available: 'today',
    types: ['video', 'clinic'], photo: PORTRAITS.m4,
    nextSlot: '8:30 PM today',
  },
];

const REVIEWS = [
  { id: 'r1', name: 'Sana Yousaf', city: 'Gilgit', rating: 5, when: '2 days ago',
    text: 'Booked a video consultation in 5 minutes. The doctor was punctual and the prescription arrived through their pharmacy by next morning. Genuinely changed how I manage my mother\'s care.' },
  { id: 'r2', name: 'Kamran Riaz', city: 'Skardu', rating: 5, when: '1 week ago',
    text: 'Living far from major cities, finding a verified specialist used to take days. With Gb Elaaj I had my CBC done at home and a cardiologist reviewed it the same evening.' },
  { id: 'r3', name: 'Hira Mansoor', city: 'Islamabad', rating: 5, when: '3 days ago',
    text: 'The booking flow is so clean. I love that my entire family\'s prescriptions and lab reports live in one place — I never lose anything anymore.' },
];

window.GB_DATA = { CITIES, SPECIALTIES, DOCTORS, REVIEWS, PORTRAITS };
