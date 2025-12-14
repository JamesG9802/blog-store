import matter from "gray-matter";

/**
 * Blogs are made up of posts.
 */
export interface Post {
  /**
   * The name of the post, visible to the user.
   */
  title: string;

  /**
   * The unique URL leading to the post. 
   */
  slug: string;

  /**
   * The date of publication.
   */
  date: Date;

  /**
   * The summary of the post.
   */
  summary: string;

  /**
   * The tags of the post.
   */
  tags: string[];

  /**
   * The actual markdown content that will be rendered by the client.
   */
  content: string;

  /**
   * The number of estimated seconds to read the article.
   */
  reading_duration: number;
}

/**
 * Parses raw text content into a post.
 * @param text the raw text content.
 * @param file_map a dictionary remapping local file_paths to the global file path.
 */
export function parse_post(text: string, file_map: Map<string, string>): Post {
  const { data, content } = matter(text);

  if (!data.title || !data.date) {
    throw new Error("Post is missing required frontmatter fields: title or date.")
  }
  if (isNaN(Date.parse(data.date))) {
    throw new Error(`Invalid date format: ${data.date}`);
  }

  const tags = Array.isArray(data.tags) ? data.tags : [];
  const summary = data.summary ?? "";

  const updated_content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
    const url = file_map.get(path);
    if (!url) {
      console.warn(`Warning: No file_map entry for ${path}`);
      return match; // fallback to original
    }
    return `![${alt}](${url})`;
  });

  /**
   * Cleans up a slug to be URL-conformant. 
   */
  function clean_slug(str: string): string {
    return str
      .toLowerCase().normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")   // remove accents
      .replace(/[^a-z0-9]+/g, "-")       // replace non-alphanumerics with -
      .replace(/^-+|-+$/g, "");
  }

  return {
    title: data.title,
    date: new Date(Date.parse(data.date)),
    tags,
    summary,
    slug: (data.slug && clean_slug(data.slug)) || clean_slug(data.title),
    content: updated_content,
    reading_duration: Math.floor(updated_content.split(" ").length * 200 / 60)
  };
}