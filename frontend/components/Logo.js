import Image from 'next/image';
import Link from 'next/link';

/**
 * Shared Logo component for Growzone and Desk.ai
 * 
 * @param {string} variant - "header" (landing page), "sidebar" (dashboard), or "minimal" (icon only)
 * @param {string} brand - "growzone" or "deskai" (default: depends on variant)
 * @param {number} size - Size in pixels (defaults based on variant)
 * @param {boolean} showText - Whether to show brand text next to logo
 * @param {string} linkTo - Where to link (defaults: "/" for header, "/dashboard" for sidebar, null for minimal)
 * @param {string} textColor - Color class for text (default: depends on variant)
 * @param {function} onClick - Optional click handler
 */
export default function Logo({ 
  variant = 'header',
  brand,
  size,
  showText = true,
  linkTo,
  textColor,
  onClick,
  className = ''
}) {
  // Default brand based on variant (header = growzone, sidebar = deskai)
  const defaultBrand = variant === 'sidebar' ? 'deskai' : 'growzone';
  const activeBrand = brand || defaultBrand;
  
  // Brand text and logo config
  const brandConfig = {
    growzone: {
      text: 'Growzone',
      logo: '/deskai-logo.png', // Using same logo for now
      alt: 'Growzone logo'
    },
    deskai: {
      text: 'Desk.ai',
      logo: '/deskai-logo.png',
      alt: 'Desk.ai logo'
    }
  };
  
  const config = brandConfig[activeBrand];
  // Default sizes based on variant
  const defaultSize = {
    header: 40,
    sidebar: 40,
    minimal: 32
  }[variant] || 40;

  const logoSize = size || defaultSize;

  // Default link destinations
  const defaultLink = {
    header: '/',
    sidebar: '/dashboard',
    minimal: null
  }[variant];

  const href = linkTo !== undefined ? linkTo : defaultLink;

  // Default text colors
  const defaultTextColor = {
    header: 'text-gray-900',
    sidebar: 'text-white',
    minimal: 'text-gray-900'
  }[variant];

  const textColorClass = textColor || defaultTextColor;

  // Responsive text behavior
  const shouldShowText = variant === 'minimal' ? false : showText;
  
  // Text size based on variant
  const textSizeClass = {
    header: 'text-2xl',
    sidebar: 'text-xl',
    minimal: 'text-lg'
  }[variant] || 'text-xl';

  const LogoContent = () => (
    <div 
      className={`flex items-center space-x-3 ${className}`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <Image
          src={config.logo}
          alt={config.alt}
          width={logoSize}
          height={logoSize}
          className="rounded-lg"
          priority={variant === 'header'}
        />
      </div>
      {shouldShowText && (
        <div className="flex items-center space-x-1.5">
          <span className={`${textSizeClass} font-bold ${textColorClass}`}>
            {config.text}
          </span>
          {variant === 'sidebar' && activeBrand === 'deskai' && (
            <span className="text-lg">✨</span>
          )}
        </div>
      )}
    </div>
  );

  // If there's a link, wrap in Link component
  if (href) {
    return (
      <Link href={href} className="inline-block">
        <LogoContent />
      </Link>
    );
  }

  // Otherwise just return the content
  return <LogoContent />;
}
