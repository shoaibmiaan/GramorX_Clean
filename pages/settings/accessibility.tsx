import type { GetServerSideProps, NextPage } from 'next';

const LegacyAccessibilityRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/preferences/accessibility',
      permanent: false,
    },
  };
};

export default LegacyAccessibilityRedirectPage;
