// Centralized marketing imagery (Unsplash — free license, allowlisted in
// next.config remotePatterns). Base URLs are capped in width + auto-format so
// the Vercel image optimizer downloads a reasonable source, then resizes/serves
// webp/avif per device — friendly to low-end Android + slow networks.

const u = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const MARKETING_IMG = {
  heroDoctor: u("photo-1559839734-2b71ea197ec2", 1400), // friendly doctor
  careAtHome: u("photo-1594824476967-48c8b964273f", 1100), // nurse / home care
  // Patient portrait avatars for testimonials (small, face-cropped)
  patient: {
    karim: u("photo-1506794778202-cad84cf45f1d", 96) + "&crop=faces",
    fatima: u("photo-1544005313-94ddf0286df2", 96) + "&crop=faces",
    imran: u("photo-1607346256330-dee7af15f7c5", 96) + "&crop=faces",
    sana: u("photo-1547425260-76bcadfb4f2c", 96) + "&crop=faces",
  },
} as const;
