import tw, { styled } from 'twin.macro';

type InputProps = {
  tabular?: boolean;
  variant?: 'dark';
  error?: boolean;
};

export const inputStyles = ({ variant, error }: InputProps) => [
  //   variant === 'dark' ? tw`bg-bulk-850` : tw`bg-bulk-800`,
  tw`border border-black bg-beige focus:bg-white placeholder:(text-black/50) text-base lg:text-sm font-medium transition`,
  tw`w-full p-4 overflow-hidden rounded-lg`,
  tw`appearance-none outline-none transition`,
  tw`disabled:(text-black/40 cursor-not-allowed)`,
  //   error && tw`border-secondaryRed focus:border-secondaryRed`,
];

// TODO: error and validation message
const InputBase = styled.input<InputProps>(inputStyles);

const InputLabel = tw.label`text-sm font-medium`;

const Input = Object.assign(InputBase, { Label: InputLabel });

export default Input;
