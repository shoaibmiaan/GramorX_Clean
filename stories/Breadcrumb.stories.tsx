import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from '../components/navigation/Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const BasicTrail: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Library', href: '/library' },
      { label: 'IELTS Speaking' },
    ],
  },
};

export const DeepHierarchy: Story = {
  args: {
    items: [
      { label: 'Institutions', href: '/institutions' },
      { label: 'Orbit Academy', href: '/institutions/orbit' },
      { label: 'Reports', href: '/institutions/orbit/reports' },
      { label: 'Weekly trends' },
    ],
  },
};

export const WithLongLabels: Story = {
  args: {
    className: 'max-w-xl',
    items: [
      { label: 'Content', href: '/content' },
      { label: 'Studio', href: '/content/studio' },
      { label: 'Writing: Band 7 cohesive device practice set' },
    ],
  },
};
