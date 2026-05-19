import { redirect } from "next/navigation";

export default async function LegacyUserRedirect({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  redirect(`/${locale}/user/${username}`);
}
