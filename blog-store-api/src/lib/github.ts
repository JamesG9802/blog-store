/**
 * The content returned by GitHub's REST API.
 */
export type GitHubContent = {
  /**
   * The name of the file.
   */
  name: string,

  /**
   * The path of the file (relative to the repository).
   */
  path: string,

  /**
   * The SHA hash.
   */
  sha: string,

  /**
   * The size of the file in bytes.
   */
  size: string,

  /**
   * The url to the file's content API endpoint.
   */
  url: string,

  /**
   * The url to the file's actual location. 
   */
  html_url: string,

  git_url: string,

  /**
   * The download link to the actual file content.
   */
  download_url: string | null,

  /**
   * Whether the file is "dir" (directory) or a file.
   */
  type: string,
  _links: {
    self: string,
    git: string,
    html: string
  }
}