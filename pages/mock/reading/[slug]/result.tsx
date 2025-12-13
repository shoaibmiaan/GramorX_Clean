import type { GetServerSideProps, NextPage } from 'next';

const ReadingResultRedirect: NextPage = () => null;

export default ReadingResultRedirect;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const attemptId = ctx.query.attemptId || ctx.query.attempt;

  if (typeof attemptId === 'string' && attemptId.length > 0) {
    return {
      redirect: {
        destination: `/mock/reading/result/${encodeURIComponent(attemptId)}`,
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: '/mock/reading/history',
      permanent: false,
    },
  };
};
