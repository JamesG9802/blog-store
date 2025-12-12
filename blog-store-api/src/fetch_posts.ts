import { GitHubContent } from "./lib/github";
import { parse_post, Post } from "./lib/post";

const DATA_FOLDER: string = "data";
const BLOG_POST_FOLDER: string = `${DATA_FOLDER}/blog_posts`;

/**
 * Get all blog posts from the repository.
 * @param repository_owner the repository owner.
 * @param repository_name the repository name.
 * @returns a promise containing an array of posts.
 */
export async function get_all_blog_posts(repository_owner: string, repository_name: string): Promise<Post[]> {
  const API_URL: string = `https://api.github.com/repos/${repository_owner}/${repository_name}/contents/${BLOG_POST_FOLDER}`;
  const res = await fetch(API_URL);

  const files: GitHubContent[] = await res.json();

  const posts: (Post | undefined)[] = await Promise.all(
    files.map(async (folder: GitHubContent) => {

      if (folder.type != "dir") {
        return undefined;
      }

      const folder_res = await fetch(folder.url);
      if (!folder_res.ok) {
        return undefined;
      }

      const media_files: GitHubContent[] = await folder_res.json();

      const article_file = media_files.find(
        (file) => file.type === "file" && file.name.toLowerCase() === "article.md"
      );

      if (!article_file || !article_file.download_url) {
        return undefined;
      }

      const article_res = await fetch(article_file.download_url);
      if (!article_res.ok) {
        return undefined;
      }

      const article_content = await article_res.text();

      //  Look for "article.MD"
      //  Look for every other file.

      const file_map: Map<string, string> = new Map<string, string>();
      for (const media of media_files) {
        if (media.name !== "article.md" && media.type === "file" && media.download_url) {
          const media_path: string = media.path.substring(folder.path.length);
          file_map.set(media_path, media.download_url);
        }
      }

      try {
        const post: Post = parse_post(article_content, file_map);
        return post;
      }
      catch (err: unknown) {
        console.error(err);
      }
    })
  );
  return posts.filter((post) => post != undefined);
}