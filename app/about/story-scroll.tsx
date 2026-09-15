'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(' ');
}

export interface FlowSectionProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  'aria-label'?: string;
}

export function FlowSection({
  className,
  style,
  children,
  'aria-label': ariaLabel,
}: FlowSectionProps) {
  return (
    <section
      data-flow-section
      aria-label={ariaLabel}
      className={cx('story-flow-section', className)}
    >
      <div
        data-flow-inner
        className="story-flow-inner"
        style={{ transformOrigin: 'bottom left', ...style }}
      >
        {children}
      </div>
    </section>
  );
}

export interface FlowArtProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function FlowArt({
  children,
  className,
  'aria-label': ariaLabel = 'u.a.u story scroll',
}: FlowArtProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const lastScrollYRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  useGSAP(
    () => {
      if (!containerRef.current || reducedMotion) return;

      const sections = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>('[data-flow-section]'),
      );
      const sectionStarts = sections.map(
        (section) => section.getBoundingClientRect().top + window.scrollY,
      );

      sections.forEach((section, index) => {
        gsap.set(section, { zIndex: index + 1 });

        const inner = section.querySelector<HTMLElement>('[data-flow-inner]');
        if (!inner) return;

        if (index > 0) {
          gsap.set(inner, { rotation: 30, transformOrigin: 'bottom left' });
          gsap.to(inner, {
            rotation: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'top 25%',
              scrub: true,
            },
          });
        }

        if (index < sections.length - 1) {
          ScrollTrigger.create({
            trigger: section,
            start: 'bottom bottom',
            end: 'bottom top',
            pin: true,
            pinSpacing: false,
          });
        }
      });

      // A wheel gesture advances exactly one card. This prevents a fast
      // trackpad or mouse wheel from jumping over the story in one motion.
      const headerHeight = () => document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
      const snapScrolls = sectionStarts.map((start) => Math.max(0, start - headerHeight()));
      const nearestIndex = () => snapScrolls.reduce((closest, position, index) => (
        Math.abs(position - window.scrollY) < Math.abs(snapScrolls[closest] - window.scrollY) ? index : closest
      ), 0);
      const moveOneCard = (direction: 1 | -1) => {
        if (wheelLockedRef.current) return false;

        // The active index is intentionally authoritative. If a native scroll
        // jumps a long distance in one frame, we still advance only one card.
        const currentIndex = activeIndexRef.current;
        const nextIndex = Math.max(0, Math.min(sections.length - 1, currentIndex + direction));

        if (nextIndex === currentIndex) return false;
        activeIndexRef.current = nextIndex;
        wheelLockedRef.current = true;
        window.scrollTo({ top: snapScrolls[nextIndex], behavior: 'smooth' });
        window.setTimeout(() => {
          lastScrollYRef.current = snapScrolls[nextIndex];
          wheelLockedRef.current = false;
        }, 760);
        return true;
      };
      const onWheel = (event: WheelEvent) => {
        if (reducedMotion || event.ctrlKey || Math.abs(event.deltaY) < 10) return;
        if (moveOneCard(event.deltaY > 0 ? 1 : -1)) event.preventDefault();
      };
      const onScroll = () => {
        if (reducedMotion || wheelLockedRef.current) return;

        const currentY = window.scrollY;
        const deltaY = currentY - lastScrollYRef.current;
        lastScrollYRef.current = currentY;
        if (Math.abs(deltaY) < 4) return;

        const lastSnap = snapScrolls[snapScrolls.length - 1];

        // Let the footer remain naturally scrollable, but return to the last
        // card first when the user scrolls back up from below the story.
        if (activeIndexRef.current === snapScrolls.length - 1 && currentY > lastSnap + 160 && deltaY < 0) {
          wheelLockedRef.current = true;
          window.scrollTo({ top: lastSnap, behavior: 'smooth' });
          window.setTimeout(() => {
            lastScrollYRef.current = lastSnap;
            wheelLockedRef.current = false;
          }, 760);
          return;
        }

        moveOneCard(deltaY > 0 ? 1 : -1);
      };

      activeIndexRef.current = nearestIndex();
      lastScrollYRef.current = window.scrollY;
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('scroll', onScroll, { passive: true });

      ScrollTrigger.refresh();

      return () => {
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onScroll);
      };
    },
    {
      scope: containerRef,
      dependencies: [React.Children.count(children), reducedMotion],
    },
  );

  return (
    <div
      ref={containerRef}
      aria-label={ariaLabel}
      className={cx('story-flow', className)}
    >
      {children}
    </div>
  );
}
