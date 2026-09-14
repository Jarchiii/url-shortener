export type Ad = {
  id: string;
  imageUrl: string;
  link: string;
  width: number;
  height: number;
};

export async function fetchAd(width: number, height: number): Promise<Ad> {
  const res = await fetch(`/ads?width=${width}&height=${height}`);
  if (!res.ok) throw new Error(`ads fetch failed with status ${res.status}`);
  return (await res.json()) as Ad;
}
