import React, { useContext, useEffect, useRef, useReducer } from 'react';
import { injectIntl } from 'gatsby-plugin-intl';
import { useSpring, animated as a } from 'react-spring';
import Play from 'assets/svg/play.svg';
import Mouse from 'assets/svg/mouse.svg';
import { useResize } from 'hooks/use-resize';
import { useOrientation } from 'hooks/use-orientation';
import { Container } from 'components/container/Container';
import { AppContext } from 'components/app-layout/AppLayout';
import { Share } from 'components/share/Share';
import { Video, IVideoRef } from 'components/video/Video';
import { Circle } from 'components/cursor/Circle';
import { IBubble } from 'utils/interfaces';

import { Content } from './Content';
import { reducer, init } from './stepsItemReducer';
import { PostVideo } from './PostVideo';

import s from './StepsItem.scss';
import { Texture } from 'three';

interface IProps {
  intl: any;
  count: string;
  link: string;
  text: string;
  title: string;
  media: string;
  index: number;
  spring: any;
  active: boolean;
  video: string;
  videoDesktop: string;
  displacementMap: Texture;
  next?: {
    num: number;
    title: string;
  };
  light: boolean;
  onClick(): void;
  onClose(): void;
  bubbles?: IBubble[];
}

// we need to detect whether autoplay is disabled or not
const isPlayable = (ref: IVideoRef | null): Promise<boolean> => {
  return new Promise((resolve) => {
    if (ref === null) {
      return resolve(false);
    }

    const time = ref!.currentTime;

    ref!
      .play()
      .then(() => {
        ref.pause();
        ref.setTime(time);
        resolve(true);
      })
      .catch((err) => {
        console.log(err);
        resolve(false);
      });
  });
};

export const StepsItem = injectIntl(
  ({
    count,
    text,
    title,
    media,
    intl,
    active,
    next,
    onClick,
    onClose,
    video,
    videoDesktop,
    displacementMap,
    bubbles,
    index,
  }: IProps) => {
    const [state, dispatch] = useReducer(reducer, null, init);
    const { mouseEnter, mouseLeave } = useContext(AppContext);
    const orientation = useOrientation();
    const [contentProps, setContentProps] = useSpring(() => ({ opacity: 1, pointerEvents: 'all' }));
    const [shareProps, setShareProps] = useSpring(() => ({ opacity: 0, pointerEvents: 'all' }));
    const [mediaProps, setMediaProps] = useSpring(() => ({ opacity: 1 }));
    const isMobile = useResize();
    const ref = useRef<IVideoRef>(null);

    const videoSrc = isMobile ? video : videoDesktop;

    const handleMouseEnter = () => {
      mouseEnter({
        text: intl.formatMessage({
          id: active ? (state.videoPreloaded ? 'step_click' : 'one_moment') : 'step_watch',
        }),
        icon: active ? 'mouse' : 'play',
      });
    };

    const handleMouseLeave = () => mouseLeave();

    const setLight = (light: boolean) => dispatch({ type: 'light', light });

    const handlePointerDown = () => setLight(true);

    const handlePointerUp = () => setLight(false);

    const handleCanPlay = () =>
      dispatch({
        type: 'video-load-complete',
      });

    const handleGlReady = () =>
      dispatch({
        type: 'gl-load-complete',
      });

    const handleClick = (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (!active) {
        onClick();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.which === 32) {
        setLight(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.which === 32) {
        setLight(false);
      } else if (e.which === 27) {
        onClose();
      }
    };

    const handleMouseUp = () => {
      if (!active && !state.mouseMove && state.mouseDown) {
        handleClick();
      }

      dispatch({
        type: 'mouseup',
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      dispatch({
        type: 'mousedown',
        x: e.screenX,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (state.mouseDown) {
        dispatch({
          type: 'mousemove',
          x: e.screenX,
        });
      }
    };

    const handleVideoEnd = () => {
      dispatch({
        type: 'end',
      });
    };

    const playVideo = () => {
      if (!ref.current) {
        return;
      }

      ref.current.play().catch((e) => {
        dispatch({
          type: 'fix-autoplay',
        });
      });

      // reconfigure the cursor text
      handleMouseEnter();

      setShareProps({
        opacity: 1,
        delay: 400,
        pointerEvents: 'all',
      });

      setContentProps({
        opacity: 0,
        delay: 200,
        pointerEvents: 'none',
      });
    };

    const handleVisibilityChange = () => {
      dispatch({
        type: 'visibility',
        value: document.visibilityState,
      });
    };

    useEffect(() => {
      const { playState } = state;

      if (playState === 'inactive') {
        setShareProps({
          opacity: 0,
          immediate: true,
          pointerEvents: 'all',
        });

        setContentProps({
          opacity: 1,
          delay: 0,
          pointerEvents: 'all',
        });

        setMediaProps({ opacity: 1, immediate: true });
      } else if (playState === 'playing') {
        isPlayable(ref.current).then((result) => {
          if (!result) {
            dispatch({
              type: 'fix-autoplay',
            });
          } else {
            setMediaProps({
              opacity: 0,
              delay: 1200,
              onRest: playVideo,
            });
          }
        });
      } else if (playState === 'paused') {
        ref.current!.pause();
      } else if (playState === 'replaying') {
        ref.current!.setTime(0);
        dispatch({
          type: 'play',
        });
      }
    }, [state.playState]);

    // pause the video when the orientation changes
    useEffect(() => {
      if (!ref.current) {
        return;
      }

      if (orientation === 'portrait') {
        ref.current.pause();
      } else if (ref.current.paused && state.playState === 'playing') {
        ref.current.play().catch(() => {
          /* empty */
        });
      }
    }, [state.playState, orientation]);

    const handlePlayPress = () => {
      ref.current!.play();
      ref.current!.pause();
      dispatch({
        type: 'play',
      });
    };

    const timeoutRef = useRef<any>();

    useEffect(() => {
      if (!active) {
        clearTimeout(timeoutRef.current);
        dispatch({
          type: 'reset',
        });
      } else {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        dispatch({
          type: 'activate',
        });

        // this is a hack, because transitionend can't be relied upon in this setup
        timeoutRef.current = setTimeout(
          () =>
            dispatch({
              type: 'init-load',
            }),
          1000,
        );

        return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    }, [active]);

    return (
      <div className={s(s.stepsItem, { active, playing: state.playState === 'playing' })}>
        <Container>
          <div
            className={s.stepsItem__wrapper}
            onMouseUp={handleMouseUp}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            <Content count={count} text={title} style={contentProps} />
            <Share title={title} num={index} style={shareProps} />

            <a.div
              style={mediaProps}
              className={s.stepsItem__media}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <img src={media} alt="" />
            </a.div>

            {active && ['inactive', 'transitioning'].includes(state.playState) === false && (
              <Video
                index={index}
                light={state.light}
                bubbles={bubbles}
                onPointerUp={handlePointerUp}
                onPointerDown={handlePointerDown}
                ref={ref}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                src={videoSrc}
                onGlReady={handleGlReady}
                onCanPlay={handleCanPlay}
                onVideoEnd={handleVideoEnd}
                displacementMap={displacementMap}
              />
            )}

            <button
              className={s(s.stepsItem__cursor, { visible: isMobile && !state.showPlayButton })}
              onTouchStart={handlePointerDown}
              onTouchEnd={handlePointerUp}
            >
              <div className={s.stepsItem__cursorCircle}>
                <Circle
                  text={intl.formatMessage({
                    id: state.playState === 'playing' ? 'step_click' : 'one_moment',
                  })}
                />
              </div>

              <Mouse className={s.stepsItem__cursorMouse} />
            </button>

            <button
              className={s(s.stepsItem__cursor, {
                visible: state.showPlayButton && state.playState !== 'playing',
              })}
              onClick={handlePlayPress}
            >
              <div className={s.stepsItem__cursorCircle}>
                <Circle text={intl.formatMessage({ id: 'step_watch' })} />
              </div>

              <Play className={s.stepsItem__cursorPlay} />
            </button>

            <PostVideo
              visible={active && state.playState === 'ended'}
              nextNum={next && next.num}
              nextTitle={next && next.title}
              text={text}
            />
          </div>
        </Container>
      </div>
    );
  },
);
