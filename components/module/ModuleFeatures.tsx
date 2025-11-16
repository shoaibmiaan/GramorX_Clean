// components/module/ModuleFeatures.tsx
import React from 'react';

interface Feature {
  title: string;
  description: string;
}

interface ModuleFeaturesProps {
  features: Feature[];
}

const ModuleFeatures: React.FC<ModuleFeaturesProps> = ({ features }) => {
  return (
    <section className="pb-16">
      <div className="container">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="p-4 bg-card/70 rounded-ds-2xl border border-border/60 shadow-sm">
              <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModuleFeatures;
