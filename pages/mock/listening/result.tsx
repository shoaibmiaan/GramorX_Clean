import type { GetServerSideProps, NextPage } from "next";

import { getServerClient } from "@/lib/supabaseServer";

const ListeningResultRedirect: NextPage = () => null;

export default ListeningResultRedirect;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return {
      redirect: {
        destination: "/login?role=student",
        permanent: false,
      },
    };
  }

  const { data: attemptRows } = await supabase
    .from("listening_attempts")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const attempt = attemptRows?.[0] ?? null;

  return {
    redirect: {
      destination: attempt?.id
        ? `/mock/listening/result/${attempt.id}`
        : "/mock/listening/history",
      permanent: false,
    },
  };
};
