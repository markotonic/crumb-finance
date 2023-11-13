import { CRUMB_PACKAGE_ID } from '@/config';
import { SUI_NETWORK } from '@/util/constants';
import { CrumbClient } from '@crumb-finance/sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { createContext, useContext } from 'react';

const RpcClientContext = createContext<
  { rpc: SuiClient; crumb: CrumbClient } | undefined
>(undefined);

export function useRpc() {
  const ctx = useContext(RpcClientContext);
  if (!ctx) {
    throw new Error('useRpcClient must be within RpcClientContext');
  }
  return ctx.rpc;
}

export function useCrumb() {
  const ctx = useContext(RpcClientContext);
  if (!ctx) {
    throw new Error('useCrumb must be within RpcClientContext');
  }
  return ctx.crumb;
}

export default function RpcClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const rpc = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK as never) });
  const crumb = new CrumbClient(rpc, CRUMB_PACKAGE_ID);

  return (
    <RpcClientContext.Provider value={{ rpc, crumb }}>
      {children}
    </RpcClientContext.Provider>
  );
}
