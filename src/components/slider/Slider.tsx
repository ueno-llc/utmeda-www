import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useSprings, animated, interpolate } from 'react-spring';
import { useGesture } from 'react-use-gesture';
import { clamp } from 'lodash';
import { FullGestureState, Coordinates as Coords } from 'react-use-gesture/dist/types';

import { ScrollIndicator } from 'components/scroll-indicator/ScrollIndicator';
import { useKeyDown } from 'hooks/use-keydown';
import { useOrientation } from 'hooks/use-orientation';
import { useViewportWidth } from 'hooks/use-viewport-width';
import { isFacebookApp } from 'utils/isFacebook';
import { useSlideWidth } from 'hooks/use-slide-width';

import s from './Slider.scss';

interface IProps {
  children: (item: any, i: number, active: boolean, spring: any) => React.ReactNode;
  items: any[];
  width: number;
  immediate?: boolean;
  active: number | null;
  visible: number;
}

const transform = (x: any, width: number, active: boolean) => {
  const fb = isFacebookApp();

  return interpolate(
    [
      x.interpolate((_x: any) => `translate3d(${_x}px,0,${active ? 0 : fb ? 0 : -200}px)`),
      x
        .interpolate({
          range: [-width, 0, width],
          output: [-5.0, 0, 5.0],
        })
        .interpolate((_x: any) => `rotate3d(0,1,0,${fb ? 0 : _x}deg)`),
      x
        .interpolate({
          range: [-width, 0, width],
          output: [1.0, active || fb ? 1.0 : 1.1, 1.0],
        })
        .interpolate((_x: any) => `scale3d(${_x},${_x},1)`),
    ],
    (translate, rotate, scale) => `${translate} ${rotate} ${scale}`,
  );
};

export default function Slider({ items, active, visible = 4, children }: IProps) {
  const [hasActive, setHasActive] = useState(false);
  const orientation = useOrientation();
  const viewportWidth = useViewportWidth();
  const width = useSlideWidth();
  const fb = isFacebookApp();
  const sliderRef = useRef<HTMLDivElement>(null);

  const [springs, set] = useSprings(items.length, (i: number) => ({
    x: i * width,
    width,
    opacity: i === 0 ? 1 : 0,
  }));

  const keys = useKeyDown();
  const offset = useRef(0);

  useEffect(() => {
    runSprings(offset.current);
  }, [width, viewportWidth, orientation]);

  const runSprings = useCallback(
    (y) => {
      set((i: number) => {
        const isFirst = i === 0;
        const firstItemWidth = viewportWidth * 0.75;
        const diff = width - firstItemWidth;
        const immediate = hasActive && active !== i + 1;

        let x;

        if (!fb && active === i) {
          x = 0;
        } else if (i === 0) {
          x = -y;
        } else if (i === 1) {
          x = -y + firstItemWidth;
        } else {
          x = -y - diff + width * i;
        }

        return {
          opacity: 1,
          x,
          width: active === i ? viewportWidth : isFirst ? firstItemWidth : width,
          immediate,
          config: {
            tension: active === i ? 300 * i : 100 * i + 50,
            friction: 30 + i * 40,
          },
        };
      });
    },
    [width, active, hasActive, visible, set, viewportWidth, orientation, items.length],
  );

  type GestureSelector = (h: FullGestureState<Coords>) => [number, number];

  const handleGesture = useCallback(
    (selector: GestureSelector, boost: [number, number?] = [1, -1]) => (h: FullGestureState<Coords>) => {
      if (active !== null || fb) {
        return;
      }

      const [currentX, previousX] = selector(h);
      const [boostCurrent, boostPrev = boostCurrent] = boost;
      const firstItemWidth = viewportWidth * 0.75;
      const diff = width - firstItemWidth;

      offset!.current = clamp(
        offset!.current + currentX * boostCurrent + previousX * boostPrev,
        0,
        width * (items.length - 1) - diff,
      );

      runSprings(offset!.current);

      return offset!.current;
    },
    [viewportWidth, width, runSprings],
  );

  const useY = fb && orientation === 'portrait';

  const bind = useGesture({
    onDrag: handleGesture(({ xy: [cx, cy], previous: [px, py] }) => [useY ? cy : cx, useY ? py : px], [
      -5,
      5,
    ]),
    onWheel: handleGesture(({ xy: [, cy], previous: [, py] }) => [cy, py]),
  });

  useEffect(() => {
    if (active) {
      if (fb) {
        const firstItemWidth = viewportWidth * 0.75;
        const diff = width - firstItemWidth;
        
        sliderRef.current!.scrollTo({
          behavior: 'smooth',
          left: -diff + width * active,
        });
      } else  {
        
        offset.current = width * active;
      }
    } else {
      if (fb) {
        offset.current = 0;
      }

      setHasActive(false);
    }

    runSprings(offset.current);
  }, [active, runSprings]);

  useEffect(() => {
    if (active) {
      return;
    }

    if (keys.includes(37)) {
      offset.current = Math.max(0, offset.current - width);
      runSprings(offset.current);
    } else if (keys.includes(39) || keys.includes(32)) {
      offset.current = Math.min((items.length - 1) * width, offset.current + width);
      runSprings(offset.current);
    }
  }, [keys, active, runSprings]);

  return (
    <div {...bind()} ref={sliderRef} className={s(s.slider, { active: active !== null })}>
      {springs.map((spring, i) => (
        <animated.div
          key={i}
          className={s(s.slider__item, { [s.slider__itemActive]: i === active })}
          style={{
            opacity: spring.opacity,
            width: spring.width,
            transform: transform(spring.x, width, active === i),
          }}
          children={children(items[i], i, active === i, spring.x)}
        />
      ))}

      {!fb && <ScrollIndicator springs={springs} />}
    </div>
  );
}
