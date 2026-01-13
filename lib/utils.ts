/**
 * Get the correct asset path for GitHub Pages deployment
 * Automatically adds basePath in production
 */
export function getAssetPath(path: string): string {
    const basePath = process.env.NODE_ENV === 'production' ? '/mezzanine-web' : '';
    return `${basePath}${path}`;
}
