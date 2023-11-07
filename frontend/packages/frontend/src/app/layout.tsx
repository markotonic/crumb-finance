/** @jsxImportSource @emotion/react */
'use client';

import tw, { css } from 'twin.macro';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { ConnectButton, useWalletKit } from '@mysten/wallet-kit';
import 'react-toastify/dist/ReactToastify.css';

import GlobalStyles from '@/styles/GlobalStyles';
import Providers from './providers';
import Icon from '@/components/Icon';
import { CDot, CDots } from '@/components/Shape';
import { useRpc } from '@/context/RpcContext';
import { SUI_NETWORK } from '@/util/constants';
import { getExplorerUrl } from '@/util/sui';

const WalletConnectIndicator: React.FC = (props) => {
  const { currentAccount, disconnect } = useWalletKit();

  return (
    <div
      className="group"
      tw="relative p-3 py-1.5 bg-beige sm:border-l border-black w-48 text-ellipsis flex items-center gap-2 text-sm"
    >
      {/* left hack to make left border line up */}
      <div
        tw="absolute top-full left-[-1px] right-0 opacity-0 overflow-hidden max-h-0 border border-r-0 border-black group-hover:(max-h-[140px] shadow-lg opacity-100) shadow-none duration-150 ease-out divide-y divide-black"
        css={css`
          /* transition: max-height 0.2s; */
          transition-property:
            color,
            background-color,
            border-color,
            text-decoration-color,
            fill,
            stroke,
            opacity,
            box-shadow,
            transform,
            filter,
            backdrop-filter max-height;
        `}
      >
        <a
          href={getExplorerUrl(currentAccount?.address || '', 'address')}
          target="_blank"
          rel="noreferrer"
        >
          <button tw="py-3 h-full w-full flex items-center justify-center hover:bg-black/5 transition font-mono font-bold bg-beige">
            <span>View Account</span>
          </button>
        </a>
        <button
          tw="py-3 h-full w-full flex items-center justify-center bg-red-600 hover:bg-red-500 text-white transition font-mono font-bold"
          onClick={disconnect}
        >
          <span>Disconnect</span>
        </button>
      </div>
      <div>
        <span tw="block rounded-full w-5 h-5 bg-gradient-to-tr from-cyan-500 to-lime-400 border border-black"></span>
      </div>

      <p tw="cursor-default font-mono font-bold overflow-hidden text-ellipsis mt-0.5">
        {currentAccount?.address || 'Connecting...'}
      </p>
    </div>
  );
};

function ConnectWalletDialog() {
  return (
    <div tw="flex flex-col p-6 items-stretch shadow-hard bg-beige sm:max-w-sm rounded-xl rounded-b-none border border-b-0 sm:(border-b rounded-b-xl) border-black">
      <div tw="flex items-center justify-center gap-6">
        <Icon.Cookie tw="h-8 w-8" />
        <CDots />
        <Icon.Cookie tw="h-8 w-8" />
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
                      <div tw="flex items-center px-4 sm:border-r border-black">
                        <p tw="font-mono font-bold">
                          <Icon.Cookie tw="inline mb-1 mr-1.5 opacity-80" />
                          Crumb
                        </p>
                      </div>
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
