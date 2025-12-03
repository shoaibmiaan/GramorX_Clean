import type { GetServerSideProps, NextPage } from 'next';

const LegacyProfileBillingRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/billing',
      permanent: false,
    },
  };
};

export default LegacyProfileBillingRedirectPage;
