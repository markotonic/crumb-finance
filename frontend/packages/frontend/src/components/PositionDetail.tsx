import tw, { css } from 'twin.macro';
import React, { useState } from 'react';
import { Position } from '@crumb-finance/sdk';

interface PositionDetailProps {
  position: Position;
}

const PositionDetail: React.FC<PositionDetailProps> = ({
  position,
  ...props
}) => {
  return <div {...props} />;
};

export default PositionDetail;
