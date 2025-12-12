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
  date: string;

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

  const updatedContent = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
    const url = file_map.get(path);
    if (!url) {
      console.warn(`Warning: No file_map entry for ${path}`);
      return match; // fallback to original
    }
    return `![${alt}](${url})`;
  });

  return {
    title: data.title,
    date: data.date,
    tags,
    summary,
    slug: data.title.toLowerCase().replace(/\s+/g, "-"),
    content: updatedContent,
  };
}