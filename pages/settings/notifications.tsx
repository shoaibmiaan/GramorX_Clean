import type { GetServerSideProps, NextPage } from 'next';

const LegacyNotificationsRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/preferences/notifications',
      permanent: false,
    },
  };
};

export default LegacyNotificationsRedirectPage;
