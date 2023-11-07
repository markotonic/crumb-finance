'use client';
import React, { ButtonHTMLAttributes } from 'react';
import tw, { TwStyle, styled } from 'twin.macro';
import Loading from './Loading';

export type ButtonVariant = 'primary' | 'secondary'; // | 'empty' | 'error'

// these colors don't seem to be used anywhere else so they're inlined
export const buttonColors: Record<ButtonVariant, TwStyle> = {
  primary: tw`bg-green-500 border border-black text-black hover:(bg-green-400 shadow) transition`,
  secondary: tw`bg-white border border-black text-black hover:(bg-neutral-50 shadow) transition`,
  // empty: tw`text-textSecondary hover:(dark:text-white bg-primaryBlue/10 dark:bg-bulk-700-hover) transition`,
  // secondary: tw`border border-black bg-white dark:(border-none bg-bulk-700 text-white) hover:(bg-primaryBlue/10 dark:bg-bulk-700-hover) transition`,
  // error: tw`border border-black dark:border-none bg-red-700 dark:(bg-red-700/80) text-white hover:bg-red-700/90 transition`,
};

export function buttonStyles(variant: ButtonVariant): TwStyle[] {
  return [buttonColors[variant], tw`font-medium p-3 rounded-lg`];
}

const Button = styled.button<{ variant?: ButtonVariant }>(
  ({ variant = 'primary', disabled }) => {
    if (disabled) {
      return tw`bg-gray-200 cursor-not-allowed border border-black p-3 rounded-lg font-medium`;
    }
    return buttonStyles(variant);
  }
);

export const LoadableButton: React.FC<
  {
    loading?: boolean;
    variant?: ButtonVariant;
  } & ButtonHTMLAttributes<HTMLButtonElement>
> = ({ loading, children, ...props }) => {
  return (
    <Button tw="flex items-center justify-center gap-2" {...props}>
      {loading ? (
        <React.Fragment>
          Please wait
          <Loading.Spinner size="xxs" />
        </React.Fragment>
      ) : (
        children
      )}
    </Button>
  );
};

export default Button;
