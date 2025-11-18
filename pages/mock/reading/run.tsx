import type { GetServerSideProps, NextPage } from 'next';

import ModuleRunView from '@/features/mock/components/ModuleRunView';
import type { ModuleRunPageProps } from '@/features/mock/pageBuilders';
import { buildModuleRunProps } from '@/features/mock/pageBuilders';

const ReadingRunPage: NextPage<ModuleRunPageProps> = (props) => <ModuleRunView {...props} />;

export const getServerSideProps: GetServerSideProps<ModuleRunPageProps> = (ctx) =>
  buildModuleRunProps(ctx, 'reading');

export default ReadingRunPage;
