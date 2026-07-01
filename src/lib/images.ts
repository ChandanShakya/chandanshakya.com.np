const portfolioImages = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/portfolio/*.webp',
  { eager: true }
);

const profileImage = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/profile.webp',
  { eager: true }
);

export function getPortfolioImage(filename: string): ImageMetadata | null {
  if (!filename) return null;
  const mod = portfolioImages[`../assets/portfolio/${filename}`];
  if (!mod) throw new Error(`Image not found: ${filename}`);
  return mod.default;
}

export function getProfileImage(): ImageMetadata {
  return profileImage['../assets/profile.webp'].default;
}
