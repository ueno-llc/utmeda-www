import React, { useContext } from 'react';

import { AppContext } from 'components/app-layout/AppLayout';

import { Content } from './Content';
import s from './PostVideo.scss';

interface IProps {
  visible: boolean;
  text: string;
  nextTitle?: string;
  nextNum?: number;
}

export const PostVideo = ({ visible, text, nextTitle, nextNum }: IProps) => {
  const context = useContext(AppContext) as any;

  const handleNextClick = () => {
    context.setActiveStep(nextNum);
  };

  const eat = (e) => {
    if (visible) {
      e.stopPropagation();
    }
  };

  return (
    <div className={s(s.postVideo, { visible })} onMouseDown={eat} onMouseUp={eat}>
      <p className={s.postVideo__text}>{text}</p>

      {nextNum && nextTitle && (
        <div className={s.postVideo__next}>
          <Content count={(nextNum + '').padStart(2, '0')} text={nextTitle} onClick={handleNextClick} />
        </div>
      )}
    </div>
  );
};
