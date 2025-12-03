import type { GetServerSideProps, NextPage } from 'next';

const LegacyRedeemRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/redeem',
      permanent: false,
    },
  };
};

export default LegacyRedeemRedirectPage;
