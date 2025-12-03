import type { GetServerSideProps, NextPage } from 'next';

const LegacyReferralsRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/referrals',
      permanent: false,
    },
  };
};

export default LegacyReferralsRedirectPage;
