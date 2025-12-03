import type { GetServerSideProps, NextPage } from 'next';

const LegacyStreakRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/progress/streak',
      permanent: false,
    },
  };
};

export default LegacyStreakRedirectPage;
