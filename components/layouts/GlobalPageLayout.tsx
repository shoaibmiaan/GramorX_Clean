// components/layout/GlobalPageLayout.tsx
import * as React from "react";
import { Container } from "@/components/design-system/Container";
import { EnterpriseBreadcrumbs } from "@/components/navigation/EnterpriseBreadcrumbs";

type Props = {
  children: React.ReactNode;
  showBreadcrumbs?: boolean;
};

export const GlobalPageLayout: React.FC<Props> = ({
  children,
  showBreadcrumbs = true,
}) => {
  return (
    <div className="w-full">
      {showBreadcrumbs && (
        <Container className="py-4">
          <EnterpriseBreadcrumbs className="bg-transparent px-0" />
        </Container>
      )}

      {/* main content */}
      {children}
    </div>
  );
};
