export type Ad = {
  id: string;
  imageUrl: string;
  link: string;
  width: number;
  height: number;
};

export type AdsProvider = (params: { width: number; height: number }) => Promise<Ad>;

export const createAdsProvider = (apiUrl: string, token: string): AdsProvider => {
  return async ({ width, height }) => {
    const url = new URL(apiUrl);
    url.searchParams.set('width', String(width));
    url.searchParams.set('height', String(height));
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`ads API responded ${response.status}`);
    }
    return (await response.json()) as Ad;
  };
};
