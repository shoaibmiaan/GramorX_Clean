import type { GetServerSideProps, NextPage } from 'next';

import ModuleSubmittedView from '@/features/mock/components/ModuleSubmittedView';
import type { ModuleSubmittedPageProps } from '@/features/mock/pageBuilders';
import { buildModuleSubmittedProps } from '@/features/mock/pageBuilders';

const ReadingSubmittedPage: NextPage<ModuleSubmittedPageProps> = (props) => <ModuleSubmittedView {...props} />;

export const getServerSideProps: GetServerSideProps<ModuleSubmittedPageProps> = (ctx) =>
  buildModuleSubmittedProps(ctx, 'reading');

export default ReadingSubmittedPage;
