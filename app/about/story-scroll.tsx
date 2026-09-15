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

      ScrollTrigger.refresh();
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
