import type { GetServerSideProps, NextPage } from 'next';

const LegacyBillingSettingsRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/billing/settings',
      permanent: false,
    },
  };
};

export default LegacyBillingSettingsRedirectPage;
