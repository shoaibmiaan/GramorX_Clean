import type { GetServerSideProps, NextPage } from 'next';

const ProfileSubscriptionRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/subscription',
      permanent: false,
    },
  };
};

export default ProfileSubscriptionRedirectPage;
