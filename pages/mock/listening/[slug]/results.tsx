import type { GetServerSideProps, NextPage } from 'next';

const ListeningResultsRedirect: NextPage = () => null;

export default ListeningResultsRedirect;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const attemptId = ctx.query.attemptId || ctx.query.attempt;

  if (typeof attemptId === 'string' && attemptId.length > 0) {
    return {
      redirect: {
        destination: `/mock/listening/result/${encodeURIComponent(attemptId)}`,
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: '/mock/listening/history',
      permanent: false,
    },
  };
};
