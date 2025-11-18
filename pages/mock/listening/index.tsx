import type { GetServerSideProps, NextPage } from 'next';

import ModuleIndexView from '@/features/mock/components/ModuleIndexView';
import type { ModuleIndexPageProps } from '@/features/mock/pageBuilders';
import { buildModuleIndexProps } from '@/features/mock/pageBuilders';

const ListeningModulePage: NextPage<ModuleIndexPageProps> = (props) => <ModuleIndexView {...props} />;

export const getServerSideProps: GetServerSideProps<ModuleIndexPageProps> = (ctx) =>
  buildModuleIndexProps(ctx, 'listening');

export default ListeningModulePage;
