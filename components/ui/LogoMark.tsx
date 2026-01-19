import Image from 'next/image';

type Props = {
  size?: number;
  variant?: 'isologo' | 'icon';
};

export default function LogoMark({ size = 28, variant = 'isologo' }: Props) {
  const src =
    variant === 'icon'
      ? 'https://devseniorvatuta.github.io/assets/Azell_icon-verde-beRbM609.png'
      : 'https://papaya-dieffenbachia-9f2990.netlify.app/Images/Azell_isologo-verde-8.png';

  const width = variant === 'icon' ? size : Math.round(size * 4.1);

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ height: size, width }}>
        <Image
          src={src}
          alt="Azell"
          fill
          priority
          sizes="(max-width: 640px) 160px, 200px"
          style={{ objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
