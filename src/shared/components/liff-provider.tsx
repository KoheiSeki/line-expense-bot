import liff from '@line/liff';
import { createContext, useContext, useEffect, useState } from 'react'
import type { LiffContext } from '../types/liff-provider.types';

const LiffContext = createContext<LiffContext>({liff: null, isReady: false});

type LiffProviderProps = {
    children: React.ReactNode;
}

export const LiffProvider = ({children}: LiffProviderProps) => {
    const [isReady, setIsReady] = useState<boolean>(false);

    useEffect(() => {
      liff.init({liffId: process.env.NEXT_PUBLIC_LIFF_ID!}).then(() => setIsReady(true));
    }, []);
    
  return (
    <LiffContext.Provider value={{liff: isReady ? liff: null, isReady}}>
      {children}
    </LiffContext.Provider>
  )
}

export const useLiff = () => useContext(LiffContext);

