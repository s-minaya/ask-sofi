import logo1080 from '../../../assets/brand/logo-1080.webp'
import logo336 from '../../../assets/brand/logo-336.webp'
import logo540 from '../../../assets/brand/logo-540.webp'

type LogoProps = {
  // Texto alternativo; vacío cuando el control que lo contiene ya tiene nombre.
  alt: string
  // Ancho con el que se pinta, para que el navegador elija la variante justa.
  sizes: string
  className?: string
}

// Logo exportado a WebP en 336, 540 y 1080 px a partir del PNG original.
export function Logo({ alt, sizes, className }: LogoProps) {
  return (
    <img
      className={className}
      src={logo540}
      srcSet={`${logo336} 336w, ${logo540} 540w, ${logo1080} 1080w`}
      sizes={sizes}
      width={540}
      height={180}
      alt={alt}
      decoding="async"
    />
  )
}
