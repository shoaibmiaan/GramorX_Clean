import type { GetServerSideProps, NextPage } from 'next';

const ProfileBillingHistoryRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/billing/history',
      permanent: false,
    },
  };
};

export default ProfileBillingHistoryRedirectPage;
