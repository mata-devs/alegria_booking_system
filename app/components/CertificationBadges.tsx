interface Props {
  certifications: { name: string; logo: string }[]
}

export default function CertificationBadges({ certifications }: Props) {
  const [first, second] = certifications
  const mobileOverflow = certifications.length - 1
  const desktopOverflow = certifications.length - 2
  return (
    <div className="flex flex-wrap gap-1.5">
      {first && (
        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold bg-[#d9efe6] text-[#003a2d]">
          {first.name}
        </span>
      )}
      {second && (
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#d9efe6] text-[#003a2d]">
          {second.name}
        </span>
      )}
      {mobileOverflow > 0 && (
        <span className="inline-flex sm:hidden items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#d9efe6] text-[#003a2d]">
          +{mobileOverflow}
        </span>
      )}
      {desktopOverflow > 0 && (
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#d9efe6] text-[#003a2d]">
          +{desktopOverflow}
        </span>
      )}
    </div>
  )
}
