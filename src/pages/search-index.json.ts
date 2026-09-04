import { formatDate, postHref, readingLabel, getAllMensagens, visiblePosts } from "@/lib/posts";

/**
 * Static search index consumed by the header command palette. It holds post
 * metadata only, never the article body, so it stays small enough to fetch on
 * the first search.
 */
export async function GET() {
  const posts = visiblePosts(await getAllMensagens());
  const index = posts.map((post) => ({
    title: post.data.title,
    excerpt: post.data.excerpt,
    href: postHref(post),
    author: post.data.author.name,
    category: post.data.category,
    date: formatDate(post.data.date),
    reading: readingLabel(post),
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
