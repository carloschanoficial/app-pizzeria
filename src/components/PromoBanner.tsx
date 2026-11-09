import { useEffect, useState } from 'react';
import { Tag, ImageIcon } from 'lucide-react';
import type { PromoBanner as PromoBannerType } from '@/types';

interface PromoBannerProps {
  banners: PromoBannerType[];
}

const DEFAULT_BANNERS: PromoBannerType[] = [
  {
    id: 'default-1',
    title: 'Combos Familiares',
    subtitle: '2 pizzas grandes + bebida desde $299',
    image_url: null,
    bg_gradient: 'from-orange-500 to-red-500',
    sort_order: 1,
    is_active: true,
  },
];

export function PromoBanner({ banners }: PromoBannerProps) {
  const activeBanners = banners.length > 0 ? banners : DEFAULT_BANNERS;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  return (
    <div className="overflow-hidden rounded-2xl">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {activeBanners.map((banner, i) => (
          <div key={banner.id || i} className="w-full flex-shrink-0">
            <div
              className={`relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r ${banner.bg_gradient} p-4`}
            >
              {banner.image_url ? (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Tag className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{banner.title}</p>
                {banner.subtitle && (
                  <p className="truncate text-xs text-white/90">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {activeBanners.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {activeBanners.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-red-600' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
