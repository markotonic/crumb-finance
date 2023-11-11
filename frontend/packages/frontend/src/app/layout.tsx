/** @jsxImportSource @emotion/react */
'use client';

import tw, { css, styled } from 'twin.macro';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { ConnectButton, useWalletKit } from '@mysten/wallet-kit';
import 'react-toastify/dist/ReactToastify.css';

import { getExplorerUrl, priceUsdToDecimal } from '@crumb-finance/sdk';

import GlobalStyles from '@/styles/GlobalStyles';
import Icon from '@/components/Icon';
import Providers from './providers';
import { CDot, CDots } from '@/components/Shape';
import { SUI_COIN_TYPE, SUI_ICON_URL, SUI_NETWORK } from '@/util/constants';
import { useRpc } from '@/context/RpcContext';
import { IS_DEV } from '@/config';
import { useUpdatePriceMutation } from '@/mutations/crumb';
import useAssetsList from '@/hooks/useAssetsList';
import CoinIcon from '@/components/CoinIcon';

const DropdownContainer = tw.div`
  relative p-3 py-1.5
  flex items-center gap-2
  text-ellipsis text-sm
  bg-beige hover:bg-black/5
`;
const DropdownContent = styled.div(
  tw`absolute top-full`,
  tw`opacity-0 overflow-hidden max-h-0`,
  tw`border border-black`,
  tw`group-hover:(max-h-[140px] shadow-lg opacity-100)`,
  tw`shadow-none duration-150 ease-out divide-y divide-black`,
  css`
    transition-property: color, background-color, border-color,
      text-decoration-color, fill, stroke, opacity, box-shadow, transform,
      filter, backdrop-filter, max-height;
  `
);
const DropdownItem = styled.button<{ variant?: 'primary' | 'warning' }>(
  ({ variant = 'primary' }) => [
    variant === 'primary'
      ? tw`bg-beige hover:bg-black/5`
      : tw`bg-red-600 hover:bg-red-500 text-white`,
  ],
  tw`py-3 h-full w-full flex items-center justify-center transition font-mono font-bold`
);

function CrumbLogo() {
  return (
    <DropdownContainer className="group" tw="w-24 sm:border-r border-black">
      <DropdownContent tw="right-[-1px] left-0 border-l-0">
        <a href="#" target="_blank" rel="noreferrer">
          <DropdownItem>Github</DropdownItem>
        </a>
      </DropdownContent>
      <p tw="font-mono font-bold px-1">
        <Icon.Cookie tw="inline mb-1 mr-1.5 opacity-80" />
        Crumb
      </p>
    </DropdownContainer>
  );
}

function SuiPriceIndicator() {
  const { data: assets } = useAssetsList();
  const sui = assets?.find((a) => a.coinType === SUI_COIN_TYPE);

  if (sui) {
    return (
      <DropdownContainer className="group" tw="w-48 sm:border-l border-black">
        <DropdownContent tw="left-[-1px] right-0 border-r-0">
          <DropdownItem>View on CoinGecko</DropdownItem>
        </DropdownContent>

        <div tw="font-mono font-bold px-1 flex items-center gap-2">
          <CoinIcon tw="h-5 w-5" coinType={SUI_COIN_TYPE} />
          SUI ${priceUsdToDecimal(sui.asset.price_usd).toFixed(3)}
        </div>
      </DropdownContainer>
    );
  }
}

function WalletConnectIndicator() {
  const { currentAccount, disconnect } = useWalletKit();
  const updatePrice = useUpdatePriceMutation({
    onSuccess: () => {
      toast.success('Prices updated');
    },
  });

  return (
    <DropdownContainer className="group" tw="w-48 sm:border-l border-black">
      {/* make left border line up */}
      <DropdownContent tw="left-[-1px] right-0 border-r-0">
        <a
          href={getExplorerUrl(
            currentAccount?.address || '',
            'address',
            SUI_NETWORK
          )}
          target="_blank"
          rel="noreferrer"
        >
          <DropdownItem>View Account</DropdownItem>
        </a>

        {IS_DEV && (
          <DropdownItem onClick={() => updatePrice.mutate()}>
            Dev: Update prices
          </DropdownItem>
        )}

        <DropdownItem variant="warning" onClick={disconnect}>
          Disconnect
        </DropdownItem>
      </DropdownContent>

      <div>
        <span tw="block rounded-full w-5 h-5 bg-gradient-to-tr from-cyan-500 to-lime-400 border border-black"></span>
      </div>
      <p tw="cursor-default font-mono font-bold overflow-hidden text-ellipsis mt-0.5">
        {currentAccount?.address || 'Connecting...'}
      </p>
    </DropdownContainer>
  );
}

function ConnectWalletDialog() {
  return (
    <div tw="flex flex-col p-6 items-stretch shadow-hard bg-beige sm:max-w-sm rounded-xl rounded-b-none border border-b-0 sm:(border-b rounded-b-xl) border-black">
      <div tw="flex items-center justify-center gap-6">
        <Icon.Cookie tw="h-8 w-8" />
        <CDots />
        <img tw="h-9 w-9 rounded-full object-cover" src={SUI_ICON_URL} />
      </div>
      <h1 tw="mt-6 text-center text-xl px-6">
        To use Crumb, you need to connect a SUI wallet.
      </h1>

      <div tw="grow flex flex-col items-stretch justify-end gap-6 my-12">
        <div tw="flex items-start gap-3">
          <div tw="pt-2.5">
            <CDot />
          </div>
          <div>
            <p tw="text-base font-bold">You control your crypto</p>
            <p tw="mt-1.5 text-sm font-medium opacity-80">
              Using a non-custodial wallet enables you to control your crypto
              without having to trust third parties.
            </p>
          </div>
        </div>
        <div tw="flex items-start gap-3">
          <div tw="pt-2.5">
            <CDot />
          </div>
          <div>
            <p tw="text-base font-bold">Transact quickly and cheaply</p>
            <p tw="mt-1.5 text-sm font-medium opacity-80">
              Fast transactions and true scalability, powered by SUI.
            </p>
          </div>
        </div>
      </div>

      <ConnectButton />
      <p tw="text-center text-sm font-medium mt-3 opacity-80 hover:opacity-100">
        First time using SUI?{' '}
        <a tw="inline underline" href={'#'} target="_blank" rel="noreferrer">
          Learn more
        </a>
      </p>
    </div>
  );
}

const RpcStatusIndicator: React.FC = () => {
  const rpc = useRpc();
  const [rpcTiming, setRpcTiming] = useState<number>();
  const rpcTimingText = rpcTiming ? `${rpcTiming}ms` : `--`;

  const [status, setStatus] = useState<
    'Operational' | 'Connecting' | 'Degraded'
  >('Connecting');

  useEffect(() => {
    function updateAndTimeRpc() {
      const start = Date.now();
      const timeout = new Promise((_, reject) => setTimeout(reject, 10_000));
      Promise.race([rpc.getRpcApiVersion(), timeout])
        .then(() => {
          if (status !== 'Operational') {
            setStatus('Operational');
          }
        })
        .catch(() => {
          setRpcTiming(undefined);
          setStatus('Degraded');
        })
        .finally(() => setRpcTiming(Date.now() - start));
    }

    updateAndTimeRpc();

    const id = setInterval(updateAndTimeRpc, 5_000);

    return () => clearInterval(id);
  }, []);

  return (
    <div tw="flex items-center text-sm font-medium text-black">
      <a
        target="_blank"
        rel="noreferrer"
        href="https://status.sui.io/"
        tw="flex items-center gap-x-1.5"
      >
        {status === 'Connecting' ? (
          <span tw="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
        ) : status === 'Operational' ? (
          <span tw="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        ) : (
          <span tw="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>
        )}
        <span>{status}</span>
      </a>
      <span tw="hidden md:inline ml-1 opacity-60">
        &middot; {SUI_NETWORK} ({rpcTimingText})
      </span>
    </div>
  );
};

const RequireWallet: React.FC<{
  children: React.FC<{ connected: boolean }>;
}> = ({ children }) => {
  const { currentAccount } = useWalletKit();
  const [isBlocked, setIsBlocked] = useState(true);
  const [hackDelay, setHackDelay] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setHackDelay(true);
    }, 250);
  }, []);

  useEffect(() => {
    if (!currentAccount) {
      setIsBlocked(true);
    }
  }, [currentAccount]);

  return (
    <>
      {isBlocked && (
        <div
          tw="z-50 absolute inset-0 transition duration-500 flex items-end sm:items-center justify-center"
          css={[
            currentAccount ? tw`scale-150 blur-sm opacity-0` : tw`bg-black/5`,
          ]}
          onTransitionEnd={() => {
            setIsBlocked(false);
          }}
        >
          {!hackDelay && (
            <div tw="flex flex-col items-center gap-6">
              <Icon.Cookie tw="h-12 w-12 animate-bounce" />
              <p tw="font-mono font-bold text-xl">Crumb Finance</p>
            </div>
          )}
          {hackDelay && !currentAccount && <ConnectWalletDialog />}
        </div>
      )}
      {children({ connected: !!currentAccount })}
    </>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin=""
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Lexend:wght@700&family=Inter:wght@400;500;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body tw="relative">
          <GlobalStyles />

          <ToastContainer position="bottom-right" />

          <RequireWallet>
            {({ connected: visible }) => {
              return (
                <>
                  <main
                    tw="h-screen flex flex-col items-stretch overflow-hidden transition duration-300 ease-out"
                    css={visible ? tw`blur-none` : tw`blur-lg opacity-80`}
                  >
                    <header tw="flex items-stretch justify-between border-b border-black">
                      <CrumbLogo />
                      {/* <SuiPriceIndicator /> */}
                      <WalletConnectIndicator />
                    </header>
                    <div
                      tw="grow flex flex-col items-stretch overflow-scroll transition duration-300 ease-out px-6"
                      css={!visible && tw`blur-lg opacity-80 scale-90`}
                    >
                      {children}
                    </div>
                    <footer tw="flex items-center justify-between py-2 px-4 border-t border-black bg-black/10">
                      {/* <span tw="font-mono font-bold text-sm">status here</span> */}
                      <RpcStatusIndicator />
                      <div tw="flex items-center gap-3 font-medium">
                        {/* <span>
                          <img
                            tw="inline h-5 mb-0.5"
                            src="https://assets-global.website-files.com/6425f546844727ce5fb9e5ab/6439ab96e20cad137a4c80d0_TopNavLogo.svg"
                            alt="Sui Logo"
                          />
                        </span> */}
                        <Icon.Github />
                        <Icon.Docs />
                      </div>
                    </footer>
                  </main>
                </>
              );
            }}
          </RequireWallet>
        </body>
      </html>
    </Providers>
  );
}
