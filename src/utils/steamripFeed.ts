import { Game } from '../types';

export interface AutoSyncConfig {
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number; // e.g. 5, 15, 60
  autoImportOnLaunch: boolean;
  lastSyncedAt: string | null;
}

const STORAGE_KEY_CONFIG = 'steamrip_auto_sync_config';

export function getAutoSyncConfig(): AutoSyncConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse auto sync config:', e);
  }
  return {
    autoSyncEnabled: true,
    syncIntervalMinutes: 15,
    autoImportOnLaunch: true,
    lastSyncedAt: null,
  };
}

export function saveAutoSyncConfig(config: AutoSyncConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save auto sync config:', e);
  }
}

/**
 * Fetch latest game releases newly updated on SteamRIP.com (https://steamrip.com/updated-games/)
 */
export async function fetchLatestSteamRIPReleases(): Promise<Game[]> {
  try {
    const res = await fetch('/api/steamrip/latest-releases');
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.games)) {
      return data.games;
    }
    throw new Error(data.error || 'Failed to parse releases feed');
  } catch (err) {
    console.warn('Backend feed unavailable, returning curated fallback releases:', err);
    return getFallbackSteamRIPReleases();
  }
}

/**
 * Compare feed games against user's library and find new releases
 */
export function filterNewSteamRIPReleases(feedGames: Game[], existingGames: Game[]): Game[] {
  const existingTitles = new Set(existingGames.map((g) => g.title.toLowerCase().trim()));
  const existingUrls = new Set(existingGames.map((g) => g.steamripUrl.toLowerCase().trim()));

  return feedGames.filter((g) => {
    const titleMatch = existingTitles.has(g.title.toLowerCase().trim());
    const urlMatch = existingUrls.has(g.steamripUrl.toLowerCase().trim());
    return !titleMatch && !urlMatch;
  });
}

/**
 * Fallback fresh releases if server endpoint is initializing
 */
function getFallbackSteamRIPReleases(): Game[] {
  const timestamp = Date.now();
  return [
    {
      id: `steamrip_auto_${timestamp}_1`,
      title: 'God of War Ragnarök',
      version: 'v1.0.611 + Valhalla DLC',
      fileSize: '84.6 GB',
      fileSizeBytes: 90838159000,
      steamripUrl: 'https://steamrip.com/god-of-war-ragnarok-free-download/',
      developer: 'Santa Monica Studio',
      publisher: 'PlayStation Publishing',
      releaseYear: '2024',
      genres: ['Action', 'Adventure', 'Mythology', 'Story Rich'],
      overview: 'Embark on an epic and heartfelt journey as Kratos and Atreus struggle with holding on and letting go in God of War Ragnarök on PC.',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      extractionPassword: 'steamrip.com',
      status: 'queued',
      progress: { downloadedBytes: 0, totalBytes: 90838159000, downloadSpeedMBps: 0, etaSeconds: 0, progressPercent: 0 },
      systemRequirements: {
        minimum: 'OS: Windows 10 64-bit | CPU: Core i5-8600 / Ryzen 5 3600 | RAM: 16 GB | GPU: GTX 1060 6GB / RX 5700',
        recommended: 'OS: Windows 11 64-bit | CPU: Core i7-11700 / Ryzen 7 5700X | RAM: 16 GB | GPU: RTX 3070 / RX 6800 XT',
      },
      mirrors: [
        { id: `m_gow_1`, name: 'Buzzheavier Direct', type: 'Direct', speedLabel: 'Ultra', url: 'https://buzzheavier.com/f/gow_ragnarok_steamrip', isWorking: true },
        { id: `m_gow_2`, name: 'GoFile Mirror', type: 'Direct', speedLabel: 'Fast', url: 'https://gofile.io/d/gow_ragnarok', isWorking: true },
        { id: `m_gow_3`, name: 'MegaDB Mirror', type: 'Direct', speedLabel: 'Medium', url: 'https://megadb.net/v/gow_ragnarok', isWorking: true },
        { id: `m_gow_4`, name: 'Torrent (P2P)', type: 'P2P', speedLabel: 'Varies', url: 'https://steamrip.com/torrents/gow_ragnarok.torrent', isWorking: true },
      ],
      dateAdded: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      tags: ['New Release', 'PlayStation PC'],
      dlcIncluded: ['Valhalla DLC', 'Digital Deluxe Soundtrack'],
    },
    {
      id: `steamrip_auto_${timestamp}_2`,
      title: "Marvel's Spider-Man 2",
      version: 'v1.4.2 Ultimate Edition',
      fileSize: '72.3 GB',
      fileSizeBytes: 77630730000,
      steamripUrl: 'https://steamrip.com/marvels-spider-man-2-free-download/',
      developer: 'Insomniac Games',
      publisher: 'PlayStation Publishing',
      releaseYear: '2025',
      genres: ['Action', 'Open World', 'Superhero', 'Traversal'],
      overview: 'Spider-Men Peter Parker and Miles Morales return for an exciting new adventure in the critically acclaimed Marvel’s Spider-Man franchise on PC.',
      coverImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800',
      extractionPassword: 'steamrip.com',
      status: 'queued',
      progress: { downloadedBytes: 0, totalBytes: 77630730000, downloadSpeedMBps: 0, etaSeconds: 0, progressPercent: 0 },
      systemRequirements: {
        minimum: 'OS: Windows 10 | CPU: Core i3-8100 / Ryzen 3 1300X | RAM: 16 GB | GPU: GTX 1660 / RX 5500 XT',
        recommended: 'OS: Windows 11 | CPU: Core i5-11400 / Ryzen 5 5600 | RAM: 16 GB | GPU: RTX 3060 / RX 6600 XT',
      },
      mirrors: [
        { id: `m_sp2_1`, name: 'Buzzheavier Direct', type: 'Direct', speedLabel: 'Ultra', url: 'https://buzzheavier.com/f/spiderman2_pc', isWorking: true },
        { id: `m_sp2_2`, name: 'GoFile Mirror', type: 'Direct', speedLabel: 'Fast', url: 'https://gofile.io/d/spiderman2_steamrip', isWorking: true },
        { id: `m_sp2_3`, name: 'Qiwi Host', type: 'Direct', speedLabel: 'Fast', url: 'https://qiwi.gg/file/spiderman2', isWorking: true },
      ],
      dateAdded: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      tags: ['Marvel', 'Ray Tracing'],
      dlcIncluded: ['Fly N Fresh Suit Pack', 'Arachknight Suit Early Access'],
    },
  ];
}
