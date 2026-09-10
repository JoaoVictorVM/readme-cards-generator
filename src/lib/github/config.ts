import { siteConfig } from "@/lib/site-config";

export const GITHUB_API_BASE_URL = "https://api.github.com";

export const GITHUB_REQUEST_TIMEOUT_MS = 5000;

export const GITHUB_ACCEPT_HEADER = "application/vnd.github+json";

export const GITHUB_API_VERSION = "2022-11-28";

export const GITHUB_USER_AGENT = `badge-generate/1.0 (+${siteConfig.repositoryUrl})`;

export const GITHUB_SUCCESS_STATUS = 200;

export const GITHUB_REF_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export const GITHUB_MAX_RESPONSE_BYTES = 1024 * 1024;
