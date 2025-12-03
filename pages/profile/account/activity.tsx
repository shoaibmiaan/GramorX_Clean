import type { GetServerSideProps, NextPage } from 'next';

const LegacyActivityRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/activity',
      permanent: false,
    },
  };
};

export default LegacyActivityRedirectPage;
