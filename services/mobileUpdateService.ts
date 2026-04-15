
import { MobileUpdateInfo } from "../types";

// Helper to remove 'v' prefix if present (e.g., v1.0.0 -> 1.0.0)
const cleanVersion = (version: string) => version.replace(/^v/, '');

const compareVersions = (v1: string, v2: string): number => {
    const v1Clean = cleanVersion(v1);
    const v2Clean = cleanVersion(v2);
    
    const v1Parts = v1Clean.split('.').map(Number);
    const v2Parts = v2Clean.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const val1 = v1Parts[i] || 0;
        const val2 = v2Parts[i] || 0;
        if (val1 > val2) return 1;
        if (val1 < val2) return -1;
    }
    return 0;
};

// Extracts owner and repo from a standard GitHub URL
const getRepoInfo = (url: string) => {
    try {
        const urlObj = new URL(url);
        // Supports: https://github.com/Owner/Repo
        if (urlObj.hostname === 'github.com') {
            const parts = urlObj.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
                return {
                    owner: parts[0],
                    repo: parts[1]
                };
            }
        }
    } catch (e) {
        console.error("Error parsing GitHub URL", e);
    }
    return null;
};

export const checkForMobileUpdate = async (updateUrl: string, currentVersion: string): Promise<MobileUpdateInfo | null> => {
    if (!updateUrl) return null;

    try {
        const repoInfo = getRepoInfo(updateUrl);
        let latestVersion = "";
        let downloadUrl = "";
        let notes = "";

        if (repoInfo) {
            const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/releases/latest`;
            console.log(`Checking GitHub Releases API: ${apiUrl}`);
            const response = await fetch(apiUrl, { 
                headers: { 'Accept': 'application/vnd.github.v3+json' },
                cache: 'no-cache' 
            });

            if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
            const data = await response.json();

            if (!data.tag_name) throw new Error("No tag_name found in release data");
            
            latestVersion = data.tag_name;
            const apkAsset = data.assets?.find((asset: any) => asset.name.endsWith('.apk'));
            downloadUrl = apkAsset ? apkAsset.browser_download_url : data.html_url;
            notes = data.body || "Nueva versión disponible en GitHub."
        } else {
            // Custom JSON Server Endpoint
            console.log(`Checking custom JSON endpoint: ${updateUrl}`);
            const timestamp = new Date().getTime();
            const cacheBustedUrl = updateUrl + (updateUrl.includes('?') ? '&' : '?') + 't=' + timestamp;
            const response = await fetch(cacheBustedUrl, { cache: 'no-store' });

            if (!response.ok) throw new Error(`API Custom Error: ${response.status}`);
            const data = await response.json();

            if (!data.version || !data.url) throw new Error("Formato JSON de server inválido");
            latestVersion = data.version;
            downloadUrl = data.url;
            notes = data.notes || "Nueva versión del sistema disponible.";
        }

        const isNewer = compareVersions(latestVersion, currentVersion) > 0;

        if (isNewer) {
            return {
                version: cleanVersion(latestVersion),
                url: downloadUrl,
                notes: notes
            };
        }

        return null; // Up to date

    } catch (error) {
        console.error("Update check failed:", error);
        throw error;
    }
};
