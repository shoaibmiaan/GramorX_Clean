import type { GetServerSideProps, NextPage } from 'next';

const LegacySettingsRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/preferences',
      permanent: false,
    },
  };
};

export default LegacySettingsRedirectPage;
