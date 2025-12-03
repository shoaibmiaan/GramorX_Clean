import type { GetServerSideProps, NextPage } from 'next';

const LegacyProfileAccountRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account',
      permanent: false,
    },
  };
};

export default LegacyProfileAccountRedirectPage;
