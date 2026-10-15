import "server-only";
import { Octokit } from "@octokit/rest";

export interface OrgMemberStats {
  login: string;
  name?: string;
  avatar_url: string;
  html_url: string;
  contributions: {
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
  };
}

export interface OrgRepoSummary {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  html_url: string;
}

/**
 * Organisation statistics for an admin. Sign in does not ask for organisation access, so this sees what the organisation shows publicly:
 * its public repositories and its public members.
 */
export class OrgGitHubService {
  private octokit: Octokit;
  private org: string;

  constructor(token: string, org: string) {
    this.octokit = new Octokit({ auth: token });
    this.org = org;
  }

  async getOrgRepos(): Promise<OrgRepoSummary[]> {
    const repos: OrgRepoSummary[] = [];
    const per_page = 100;
    let page = 1;

    while (true) {
      const { data } = await this.octokit.repos.listForOrg({
        org: this.org,
        type: "public",
        per_page,
        page,
        sort: "updated",
      });

      for (const r of data) {
        repos.push({
          name: r.name,
          full_name: r.full_name,
          description: r.description || null,
          language: r.language || null,
          stargazers_count: r.stargazers_count || 0,
          forks_count: r.forks_count || 0,
          open_issues_count: r.open_issues_count || 0,
          pushed_at: r.pushed_at || new Date().toISOString(),
          html_url: r.html_url,
        });
      }

      if (data.length < per_page) break;
      page += 1;
    }
    return repos;
  }

  async getOrgMembers(): Promise<Array<{ login: string; avatar_url: string; html_url: string }>> {
    const members: Array<{ login: string; avatar_url: string; html_url: string }> = [];
    const per_page = 100;
    let page = 1;

    while (true) {
      const { data } = await this.octokit.orgs.listMembers({
        org: this.org,
        per_page,
        page,
      });

      for (const m of data) {
        members.push({
          login: m.login,
          avatar_url: m.avatar_url,
          html_url: m.html_url,
        });
      }

      if (data.length < per_page) break;
      page += 1;
    }
    return members;
  }

  async getMemberStats(login: string, repoNames?: string[]): Promise<OrgMemberStats> {
    const repos = repoNames || (await this.getOrgRepos()).map((r) => r.name);

    let commits = 0;
    let pullRequests = 0;
    let issues = 0;
    const reviews = 0;

    try {
      const query = `
        query($qPr: String!, $qIssue: String!) {
          prs: search(type: ISSUE, query: $qPr, first: 1) { issueCount }
          issues: search(type: ISSUE, query: $qIssue, first: 1) { issueCount }
        }
      `;
      const variables = {
        qPr: `org:${this.org} author:${login} is:pr`,
        qIssue: `org:${this.org} author:${login} is:issue`,
      };
      const { data } = await this.octokit.request("POST /graphql", { query, variables });
      const root = data as unknown as {
        data?: { prs?: { issueCount?: number }; issues?: { issueCount?: number } };
        prs?: { issueCount?: number };
        issues?: { issueCount?: number };
      };
      const prsCount = typeof root.data?.prs?.issueCount === "number" ? root.data.prs.issueCount : (root.prs?.issueCount ?? 0);
      const issueCount = typeof root.data?.issues?.issueCount === "number" ? root.data.issues.issueCount : (root.issues?.issueCount ?? 0);
      pullRequests = prsCount || 0;
      issues = issueCount || 0;
    } catch (error) {
      console.warn(`Search failed for ${login}:`, error);
    }

    // Commits: iterate repos with lightweight pagination and author filter
    const limitedRepos = repos.slice(0, 10); // Reduced to avoid rate limits
    for (const repo of limitedRepos) {
      try {
        let count = 0;
        let page = 1;
        const per_page = 50;

        while (page <= 3) {
          // Reduced pages to avoid rate limits
          const { data } = await this.octokit.repos.listCommits({
            owner: this.org,
            repo,
            author: login,
            per_page,
            page,
          });
          count += data.length;
          if (data.length < per_page) break;
          page += 1;
        }
        commits += count;
      } catch (error) {
        // repo may be archived/private/non-standard; skip
        console.warn(`Commits failed for ${login} in ${repo}:`, error);
      }
    }

    // Basic profile for name/avatar
    let name: string | undefined = undefined;
    let avatar_url = `https://github.com/${login}.png`;
    let html_url = `https://github.com/${login}`;

    try {
      const { data } = await this.octokit.users.getByUsername({ username: login });
      name = data.name || undefined;
      avatar_url = data.avatar_url;
      html_url = data.html_url;
    } catch (error) {
      console.warn(`Profile fetch failed for ${login}:`, error);
    }

    return {
      login,
      name,
      avatar_url,
      html_url,
      contributions: {
        commits,
        pullRequests,
        issues,
        reviews,
      },
    };
  }

  async getAllMemberStats(): Promise<OrgMemberStats[]> {
    const members = await this.getOrgMembers();
    const repos = (await this.getOrgRepos()).map((r) => r.name);

    // Concurrency control
    const concurrency = 2; // Reduced to avoid rate limits
    const results: OrgMemberStats[] = [];
    let idx = 0;

    const worker = async () => {
      while (idx < members.length) {
        const current = idx++;
        const m = members[current];
        try {
          const stats = await this.getMemberStats(m.login, repos);
          results.push(stats);
        } catch (error) {
          console.warn(`Stats failed for ${m.login}:`, error);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }).map(() => worker()));
    return results;
  }
}
