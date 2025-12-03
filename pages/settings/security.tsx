import type { GetServerSideProps, NextPage } from 'next';

const LegacySecurityRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/security',
      permanent: false,
    },
  };
};

export default LegacySecurityRedirectPage;
