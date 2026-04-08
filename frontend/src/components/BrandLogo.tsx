import Image from 'next/image'

interface BrandLogoProps {
  className?: string
  markClassName?: string
  imageClassName?: string
  titleClassName?: string
  subtitleClassName?: string
  title?: string
  subtitle?: string
  showText?: boolean
}

export function BrandLogo({
  className = '',
  markClassName = 'w-12 h-12 bg-transparent',
  imageClassName = 'object-contain p-0',
  titleClassName = 'text-xl font-display font-bold uppercase tracking-wider leading-none',
  subtitleClassName = 'text-xs font-mono uppercase tracking-widest leading-none mt-0.5',
  title = 'iOS Kit',
  subtitle = 'AI Studio',
  showText = true,
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <div className={`relative overflow-hidden ${markClassName}`.trim()}>
        <Image
          src="/branding/logo.webp"
          alt="iOS Kit logo"
          fill
          sizes="80px"
          className={imageClassName}
        />
      </div>
      {showText && (
        <div>
          <h1 className={titleClassName}>{title}</h1>
          {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
        </div>
      )}
    </div>
  )
}
