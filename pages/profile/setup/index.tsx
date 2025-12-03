// Deprecated profile setup redirect. When accessed, redirect to the new
// account referrals page. This preserves backward compatibility for
// old links to /profile/setup.
import type { GetServerSideProps, NextPage } from 'next';

const ProfileAccountReferralsPage: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/account/referrals',
      permanent: false,
    },
  };
};

export default ProfileAccountReferralsPage;
