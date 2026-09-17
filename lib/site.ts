// Empty until there is a domain and a public repo; every consumer renders without them. Origin takes no trailing slash.
export const SITE_URL: string = '';
export const REPO_URL: string = '';

export const LICENSE_URL = REPO_URL === '' ? '' : `${REPO_URL}/blob/main/LICENSE`;
export const LESSONS_URL = REPO_URL === '' ? '' : `${REPO_URL}/tree/main/content/lessons`;
