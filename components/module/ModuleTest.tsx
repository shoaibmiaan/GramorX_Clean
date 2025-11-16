// components/module/ModuleTest.tsx
import React from 'react';
import { Button } from '@/components/design-system/Button';
import Link from 'next/link';

interface ModuleTestProps {
  testLink: string;
}

const ModuleTest: React.FC<ModuleTestProps> = ({ testLink }) => {
  return (
    <section className="pb-16">
      <div className="container text-center">
        <h2 className="font-slab text-h2 mb-4">Ready to take the test?</h2>
        <Button asChild variant="primary" size="lg" className="rounded-ds-2xl px-6">
          <Link href={testLink}>Start Test</Link>
        </Button>
      </div>
    </section>
  );
};

export default ModuleTest;
