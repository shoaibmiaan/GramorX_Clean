import type { GetServerSideProps, NextPage } from 'next';

import ModuleOverviewView from '@/features/mock/components/ModuleOverviewView';
import type { ModuleOverviewPageProps } from '@/features/mock/pageBuilders';
import { buildModuleOverviewProps } from '@/features/mock/pageBuilders';

const ListeningOverviewPage: NextPage<ModuleOverviewPageProps> = (props) => <ModuleOverviewView {...props} />;

export const getServerSideProps: GetServerSideProps<ModuleOverviewPageProps> = (ctx) =>
  buildModuleOverviewProps(ctx, 'listening');

export default ListeningOverviewPage;
