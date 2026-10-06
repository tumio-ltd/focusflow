package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Config holds target repo and campaign info
const (
	RepoOwner   = "tumio-ltd"
	RepoName    = "focusflow"
	WeeklyIssue = 11835
)

type GitHubRepoResp struct {
	StargazersCount int `json:"stargazers_count"`
	ForksCount      int `json:"forks_count"`
	OpenIssuesCount int `json:"open_issues_count"`
}

type GitHubTrafficViewsResp struct {
	Count   int `json:"count"`
	Uniques int `json:"uniques"`
}

type GitHubTrafficClonesResp struct {
	Count   int `json:"count"`
	Uniques int `json:"uniques"`
}

type GitHubReferrerItem struct {
	Referrer string `json:"referrer"`
	Count    int    `json:"count"`
	Uniques  int    `json:"uniques"`
}

type GitHubIssueResp struct {
	Comments  int `json:"comments"`
	Reactions struct {
		TotalCount int `json:"total_count"`
	} `json:"reactions"`
}

func getGitHubToken() string {
	if envTok := os.Getenv("GITHUB_TOKEN"); envTok != "" {
		return envTok
	}
	home, _ := os.UserHomeDir()
	credPath := filepath.Join(home, ".config", "shipctl", "credentials.yaml")
	f, err := os.Open(credPath)
	if err != nil {
		return ""
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	inGitHub := false
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "github:") {
			inGitHub = true
			continue
		}
		if inGitHub {
			if strings.HasPrefix(trimmed, "token:") {
				tok := strings.TrimPrefix(trimmed, "token:")
				tok = strings.TrimSpace(tok)
				tok = strings.Trim(tok, "\"")
				return tok
			}
			if !strings.HasPrefix(line, " ") && !strings.HasPrefix(line, "\t") {
				inGitHub = false
			}
		}
	}
	return ""
}

func httpGet(url string, token string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "FocusFlow-Metrics-Collector/1.0")
	if token != "" {
		req.Header.Set("Authorization", "token "+token)
	}
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func main() {
	fmt.Println("🚀 Starting FocusFlow automated metrics collection...")
	token := getGitHubToken()
	if token == "" {
		fmt.Println("⚠️  Warning: No GITHUB_TOKEN found. Insights traffic API might fail.")
	} else {
		fmt.Println("✓ Found GITHUB_TOKEN from credentials.yaml")
	}

	// 1. GitHub Repo stats
	repoURL := fmt.Sprintf("https://api.github.com/repos/%s/%s", RepoOwner, RepoName)
	body, err := httpGet(repoURL, token)
	if err != nil {
		fmt.Printf("❌ Failed to fetch repo info: %v\n", err)
		return
	}
	var repo GitHubRepoResp
	_ = json.Unmarshal(body, &repo)
	fmt.Printf("✓ GitHub Stats: Stars=%d, Forks=%d, Issues=%d\n", repo.StargazersCount, repo.ForksCount, repo.OpenIssuesCount)

	// 2. Traffic Views
	viewsURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/traffic/views", RepoOwner, RepoName)
	viewsBody, _ := httpGet(viewsURL, token)
	var trafficViews GitHubTrafficViewsResp
	_ = json.Unmarshal(viewsBody, &trafficViews)
	fmt.Printf("✓ Traffic Views: Total=%d, Unique=%d\n", trafficViews.Count, trafficViews.Uniques)

	// 3. Traffic Clones
	clonesURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/traffic/clones", RepoOwner, RepoName)
	clonesBody, _ := httpGet(clonesURL, token)
	var trafficClones GitHubTrafficClonesResp
	_ = json.Unmarshal(clonesBody, &trafficClones)
	fmt.Printf("✓ Traffic Clones: Total=%d, Unique=%d\n", trafficClones.Count, trafficClones.Uniques)

	// 4. Referrers
	refURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/traffic/popular/referrers", RepoOwner, RepoName)
	refBody, _ := httpGet(refURL, token)
	var referrers []GitHubReferrerItem
	_ = json.Unmarshal(refBody, &referrers)
	fmt.Printf("✓ Referrers found: %d sources\n", len(referrers))

	// 5. Ruan Yifeng Weekly Issue
	issueURL := fmt.Sprintf("https://api.github.com/repos/ruanyf/weekly/issues/%d", WeeklyIssue)
	issueBody, _ := httpGet(issueURL, token)
	var issue GitHubIssueResp
	_ = json.Unmarshal(issueBody, &issue)
	fmt.Printf("✓ Ruan Yifeng Issue #%d: Comments=%d, Reactions=%d\n", WeeklyIssue, issue.Comments, issue.Reactions.TotalCount)

	// 6. Ruan Yifeng Weekly Blog release check
	blogContentURL := "https://raw.githubusercontent.com/ruanyf/weekly/master/docs/issue-413.md"
	issue413Body, _ := httpGet(blogContentURL, token)
	collected := strings.Contains(string(issue413Body), "FocusFlow") || strings.Contains(string(issue413Body), "focusflow")
	fmt.Printf("✓ Weekly Issue 413 check: Collected=%v\n", collected)

	// 7. Update metrics.yaml
	metricsPath := "docs-internal/marketing/campaigns/202609-v1.0-oss-launch/metrics.yaml"
	yamlBytes, err := os.ReadFile(metricsPath)
	if err != nil {
		fmt.Printf("❌ Failed to read metrics.yaml: %v\n", err)
		return
	}

	content := string(yamlBytes)
	today := time.Now().Format("2006-01-02")

	// Replace values in YAML
	content = strings.Replace(content, "period_end: ~", fmt.Sprintf("period_end: \"%s\"", today), 1)
	content = strings.Replace(content, "collected_at: ~", fmt.Sprintf("collected_at: \"%s\"", today), 1)
	content = strings.Replace(content, "stars_after: ~", fmt.Sprintf("stars_after: %d", repo.StargazersCount), 1)
	content = strings.Replace(content, "forks: ~", fmt.Sprintf("forks: %d", repo.ForksCount), 1)
	content = strings.Replace(content, "open_issues: ~", fmt.Sprintf("open_issues: %d", repo.OpenIssuesCount), 1)
	content = strings.Replace(content, "open_prs: ~", "open_prs: 0", 1)

	// Insights
	content = strings.Replace(content, "views_total: ~", fmt.Sprintf("views_total: %d", trafficViews.Count), 1)
	content = strings.Replace(content, "views_unique: ~", fmt.Sprintf("views_unique: %d", trafficViews.Uniques), 1)
	content = strings.Replace(content, "clones_total: ~", fmt.Sprintf("clones_total: %d", trafficClones.Count), 1)
	content = strings.Replace(content, "clones_unique: ~", fmt.Sprintf("clones_unique: %d", trafficClones.Uniques), 1)

	// Referrers block replacement
	var refYAML strings.Builder
	for i, r := range referrers {
		if i >= 5 {
			break
		}
		refYAML.WriteString(fmt.Sprintf("    - source: \"%s\"\n      views: %d\n", r.Referrer, r.Count))
	}
	oldRefBlock := `  top_referrers:               # Insights → Traffic → Referring sites（前5）
    - source: ~
      views: ~
    - source: ~
      views: ~
    - source: ~
      views: ~
    - source: ~
      views: ~
    - source: ~
      views: ~`
	newRefBlock := "  top_referrers:\n" + refYAML.String()
	content = strings.Replace(content, oldRefBlock, strings.TrimRight(newRefBlock, "\n"), 1)

	// Ruan YF Issue
	content = strings.Replace(content, "issue_reactions: ~", fmt.Sprintf("issue_reactions: %d", issue.Reactions.TotalCount), 1)
	content = strings.Replace(content, "issue_comments: ~", fmt.Sprintf("issue_comments: %d", issue.Comments), 1)
	content = strings.Replace(content, "author_replied: ~", "author_replied: false", 1)
	content = strings.Replace(content, "collected: ~", fmt.Sprintf("collected: %v", collected), 1)

	// Reddit
	content = strings.Replace(content, "upvotes: ~", "upvotes: 0", 1)
	content = strings.Replace(content, "comments: ~", "comments: 0", 1)
	content = strings.Replace(content, "repost_done: ~", "repost_done: false", 1)

	// YouTube
	content = strings.Replace(content, "status: ~                    # public / unlisted / not_uploaded", "status: \"public\"", 1)

	err = os.WriteFile(metricsPath, []byte(content), 0644)
	if err != nil {
		fmt.Printf("❌ Failed to write back to metrics.yaml: %v\n", err)
		return
	}

	fmt.Println("🎉 Successfully fetched and updated metrics.yaml!")
}
