'use client';

import { useState, useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import ajabNewsLogo from '../public/ajab-news-fly.png';
import ajabNewsText from '../public/ajab-news-text.png';
import PrevIcon from '../public/left-arrow.svg';
import NextIcon from '../public/right-arrow.svg';

import '../styles/ModalStyle.css';

export interface NewsPopupSlide {
  slideId: string;
  newsId: string;
  category: 'single' | 'multiple';
  title: string;
  secondTitle?: string;
  content?: string;
  images: string[];
}

interface ContentSliderModalProps {
  items: NewsPopupSlide[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function ContentSliderModal({
  items,
  isOpen,
  onClose,
  initialIndex = 0,
}: ContentSliderModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isSmall, setIsSmall] = useState(false);
  const [expandedSlides, setExpandedSlides] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      setIsSmall(window.innerWidth < 1580);
    };

    handleResize(); // run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const swiperRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeItem = items[activeIndex];

  const openDetails = (newsId: string) => {
    onClose();
    router.push(`/ajab-news?news_id=${encodeURIComponent(newsId)}`);
  };

  const toggleExpanded = (slideId: string) => {
    setExpandedSlides((prev) => ({
      ...prev,
      [slideId]: !prev[slideId],
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center news-pop-up-modal overflow-y-auto  backdrop-blur">
      <div
        className={`relative w-full max-w-[900px]
      ${isSmall ? 'h-[640px]' : 'h-[830px]'}
      flex items-center justify-center mx-auto mt-[60px] mb-10
      bg-[url('../public/pop-up-bg.webp')] bg-contain bg-center bg-no-repeat
    `}
      >
        {/* Scrollable inner content */}
        <div className="relative flex flex-col items-center justify-start max-w-[620px] w-full bg-transparent rounded-2xl py-4 mx-auto  max-h-[720px]">
          {/* Header */}
          <div className="flex items-center justify-between w-full pt-3 px-2 pb-3 bg-white rounded-t-2xl sticky top-0 z-10">
            <div className="news-logo">
              <Image src={ajabNewsLogo} alt="Ajab News" />
            </div>
            <div className="news-text">
              <Image src={ajabNewsText} alt="Ajab News" />
            </div>
            <button
              onClick={onClose}
              className="text-pink-400  mr-1 text-xl font-bold cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Swiper wrapper */}
          <div className="relative w-full flex justify-center bg-white modal-slider-wrap">
            {/* Prev Button */}
            <button
              ref={prevRef}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer z-20"
            >
              <Image src={PrevIcon} alt="Prev" width={16} height={16} />
            </button>

            {/* Next Button */}
            <button
              ref={nextRef}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer z-20"
            >
              <Image src={NextIcon} alt="Next" width={16} height={16} />
            </button>

            {/* Swiper */}
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper) => {
                // @ts-ignore
                swiper.params.navigation.prevEl = prevRef.current;
                // @ts-ignore
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                setTimeout(() => {
                  if (swiperRef.current?.navigation) {
                    swiperRef.current.navigation.init();
                    swiperRef.current.navigation.update();
                  }
                });
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              initialSlide={initialIndex}
              className="w-full flex justify-center bg-white"
            >
              {items.map((item) => (
                <SwiperSlide key={item.slideId} className="flex justify-center">
                  <div className="max-w-[430px] w-full mx-auto modal-container pt-0 px-3 pb-2">
                    <div className="news-item-content">
                      {/* Figma order: image first, then title + secondary, then content, then CTA */}
                      {!!item.images.length && (
                        <div className="w-full mb-3 modal-image-wrap">
                          <img
                            src={item.images[0]}
                            alt={item.title || 'Ajab news'}
                            className="w-full h-[210px] object-cover rounded"
                          />
                        </div>
                      )}

                      <div className="news-title-row">
                        <h3 className="card-heading mb-0 news-text-block">{item.title || 'Untitled'}</h3>
                        {!!item.secondTitle && (
                          <span className="news-by-line">{item.secondTitle}</span>
                        )}
                      </div>

                      {!!item.content && (
                        <>
                          <p
                            className={`card-text mt-2 mb-2 news-content news-text-block ${expandedSlides[item.slideId] ? 'expanded' : 'collapsed'}`}
                          >
                            {item.content}
                          </p>
                          {item.content.length > 160 && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.slideId)}
                              className="text-sm font-medium pink hover:text-pink-700 transition-colors mb-2 cursor-pointer"
                            >
                              {expandedSlides[item.slideId] ? 'See less' : 'See more'}
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => openDetails(item.newsId)}
                        className="news-explore-cta cursor-pointer"
                      >
                        EXPLORE
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {!items.length && (
            <div className="w-full bg-white px-4 py-8 text-center text-[#6d6e71]">No popup news available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
