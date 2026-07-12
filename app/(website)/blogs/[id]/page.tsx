import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BlogDetailsClient } from './_components/BlogDetailsClient';

interface BlogPayload {
  data?: {
    _id?: string;
    slug?: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fallback: Metadata = { alternates: { canonical: `/blogs/${id}` } };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/blogs/${id}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return fallback;

    const payload = (await res.json()) as BlogPayload;
    const blog = payload?.data;
    if (!blog?.title) return fallback;

    const canonicalPath = `/blogs/${blog.slug || id}`;
    const description = stripHtml(blog.description || '').slice(0, 160);

    return {
      title: blog.title,
      description: description || undefined,
      alternates: { canonical: canonicalPath },
      openGraph: {
        title: blog.title,
        description: description || undefined,
        url: canonicalPath,
        type: 'article',
        images: blog.image ? [blog.image] : undefined,
      },
    };
  } catch {
    return fallback;
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    notFound(); // Handle missing ID
  }

  return (
    <div>
      <BlogDetailsClient slugOrId={id} />
    </div>
  );
}
