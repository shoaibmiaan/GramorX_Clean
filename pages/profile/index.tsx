import type { GetServerSideProps, NextPage } from 'next';

const ProfileRedirectPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/profile',
      permanent: false,
    },
  };
};

export default ProfileRedirectPage;
