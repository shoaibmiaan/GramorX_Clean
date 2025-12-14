import React, { createContext, useContext } from 'react';

const StreakContext = createContext<number | null>(null);

type Props = {
  initial?: number | null;
  children: React.ReactNode;
};

export const StreakProvider: React.FC<Props> = ({ initial, children }) => (
  <StreakContext.Provider value={typeof initial === 'number' ? initial : null}>
    {children}
  </StreakContext.Provider>
);

export const useStreakFromContext = () => useContext(StreakContext);
