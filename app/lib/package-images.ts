export interface PackageImage {
  url: string
  title: string
  description: string
}

export function packageImageUrl(image: PackageImage | string | null | undefined): string {
  if (!image) return ''
  return typeof image === 'string' ? image : image.url
}

export function normalizePackageImages(raw: unknown): PackageImage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return { url: item, title: '', description: '' }
      }
      if (item && typeof item === 'object' && typeof (item as PackageImage).url === 'string') {
        const img = item as Partial<PackageImage>
        return {
          url: img.url!,
          title: typeof img.title === 'string' ? img.title : '',
          description: typeof img.description === 'string' ? img.description : '',
        }
      }
      return null
    })
    .filter((item): item is PackageImage => item !== null)
}
