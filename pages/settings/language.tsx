import type { GetServerSideProps, NextPage } from 'next';

const LegacyLanguageRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/preferences/language',
      permanent: false,
    },
  };
};

export default LegacyLanguageRedirectPage;
