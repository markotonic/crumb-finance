/** @jsxImportSource @emotion/react */
'use client';
import tw from 'twin.macro';

export const CDot = tw.div`h-1.5 w-1.5 bg-black opacity-50`;
export const CDots = () => {
  return (
    <div tw="flex items-center gap-3">
      <CDot />
      <CDot />
      <CDot />
    </div>
  );
};
