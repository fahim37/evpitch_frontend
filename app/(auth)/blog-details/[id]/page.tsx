import { BlogDetailsClient } from "@/app/(website)/blogs/[id]/_components/BlogDetailsClient ";

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogDetailsClient slugOrId={id} />;
}
