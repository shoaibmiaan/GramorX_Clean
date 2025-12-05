// pages/listening/[slug]/review.tsx
import type { GetServerSideProps } from 'next';

const ListeningLegacyReviewRedirect = () => null;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { slug } = ctx.params ?? {};

  return {
    redirect: {
      destination: `/mock/listening/${slug}/results`,
      permanent: false,
    },
  };
};

export default ListeningLegacyReviewRedirect;
