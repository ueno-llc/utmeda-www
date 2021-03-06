import * as React from 'react';
import { injectIntl } from 'gatsby-plugin-intl';

import { Helmet } from 'components/helmet/Helmet';
import { StepsContainer } from 'components/steps/StepsContainer';

interface IProps {
  intl: any;
}

function one({ intl }: IProps) {
  const socialTitle = intl.formatMessage({ id: 'steps.one.socialTitle' });
  const text = intl.formatMessage({ id: 'steps.one.text' });
  const socialPoster: string = require('assets/posters/share/1.jpg');

  return (
    <>
      <Helmet title={socialTitle} description={text} image={socialPoster} />
      <StepsContainer initialStep={1} />
    </>
  );
}

export default injectIntl(one);
