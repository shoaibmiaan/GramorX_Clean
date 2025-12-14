// components/layout/GlobalPageLayout.tsx
import * as React from "react";

type Props = {
  children: React.ReactNode;
};

export const GlobalPageLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="w-full">
      {/* main content */}
      {children}
    </div>
  );
};
