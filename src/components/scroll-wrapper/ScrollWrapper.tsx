import React, { cloneElement, useRef, useEffect, useState, Children } from 'react';
import { TweenLite, Power3 } from 'gsap';

import { useKeyDown } from 'hooks/use-keydown';
import 'utils/gsap/ScrollToPlugin';

import s from './ScrollWrapper.scss';

interface IProps {
  children: React.ReactNode;
  className?: string;
  snap?: boolean;
}

export const ScrollWrapper = ({ children, className, snap }: IProps) => {
  const container = useRef<HTMLOListElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const keys = useKeyDown();
  const slidesCount = Children.count(children);

  const handleNext = () => {
    const index =
    activeSlide === slidesCount - 1 ? 0 : activeSlide + 1;

    setActiveSlide(index);
  };

  const handlePrev = () => {
    const index = activeSlide === 0
      ? slidesCount - 1
      : activeSlide - 1;

    setActiveSlide(index);
  };

  // animate scroll position
  const animate = () => {
    if (!container.current) {
      return;
    }

    const width = container.current.scrollWidth;

    // TweenLite.to(container.current!, 0.5, {
    //   scrollTo: { (width / slidesCount) * activeSlide },
    //   ease: Power3.easeInOut,
    // });

    container.current!.scrollLeft = (width / slidesCount) * activeSlide;
  };

  useEffect(() => {
    if (!snap) {
      return;
    }

    // on arrow right press
    if (keys.includes(39)) {
      handleNext();
    }
    // on arrow left press
    if (keys.includes(37)) {
      handlePrev();
    }
    // on space
    if (keys.includes(32)) {
      handleNext();
    }
  }, [keys]);

  useEffect(() => {
    if (!snap) {
      return;
    }

    animate();
  }, [activeSlide, snap]);

  return (
    <div className={s(s.scrollWrapper, snap)}>
      <ol className={s.scrollWrapper__inner} ref={container}>
        {Children.map(children, (child) => (
          <li className={s(s.scrollWrapper__item, className)}>
            {cloneElement(child as React.ReactElement<any>, { setActive: setActiveSlide })}
          </li>
        ))}
      </ol>
    </div>
  );
};

ScrollWrapper.defaultProps = {
  snap: true,
};
