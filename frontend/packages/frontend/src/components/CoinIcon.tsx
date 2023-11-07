/** @jsxImportSource @emotion/react */
import 'twin.macro';

import useCoinMetadata from '@/hooks/useCoinMetadata';

const CoinIcon: React.FC<{ coinType: string }> = ({ coinType, ...props }) => {
  const { data: meta } = useCoinMetadata(coinType);

  return (
    <span
      tw="relative h-9 w-9 rounded-full border border-black bg-white group-hover:bg-cyan-50 transition"
      {...props}
    >
      {!!meta?.iconUrl && (
        <img
          tw="absolute inset-0 object-cover rounded-full"
          src={meta.iconUrl}
        />
      )}
    </span>
  );
};

export default CoinIcon;
