import { Game } from '../types';
import { getCurrentUser } from './userAuth';

export function getLinkedDrivePath(): string {
  try {
    const user = getCurrentUser();
    if (user && user.linkedDrivePath) {
      return user.linkedDrivePath;
    }
  } catch (e) {}
  if (typeof localStorage === 'undefined') return 'D:\\Games\\SteamRIP';
  return localStorage.getItem('steamrip_linked_drive_path') || 'D:\\Games\\SteamRIP';
}

export function triggerMirrorDownload(url: string, filename?: string) {
  try {
    // Hidden iframe trigger to initiate file download stream without navigation or tab popups
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    // Hidden anchor click for standard browser attachment download
    const a = document.createElement('a');
    a.href = url;
    if (filename) {
      a.setAttribute('download', filename);
    }
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 3000);
  } catch (err) {
    console.error('Mirror direct download error:', err);
  }
}

export async function downloadGameToLocalDrive(game: Game, directoryHandle?: any): Promise<boolean> {
  const targetPath = game.targetFolder || `${getLinkedDrivePath()}\\${game.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}`;

  // Get the direct download URL (preferably first working mirror, or steamripUrl)
  const downloadUrl = (game.mirrors && game.mirrors.length > 0 && game.mirrors[0].url) 
    ? game.mirrors[0].url 
    : game.steamripUrl;

  // If we have an active File System Directory Handle from window.showDirectoryPicker
  if (directoryHandle) {
    try {
      const folderName = game.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const gameDir = await directoryHandle.getDirectoryFolder(folderName, { create: true });
      
      // Write launcher helper info in local folder
      const readmeFile = await gameDir.getFileHandle('SteamRIP_Info.txt', { create: true });
      const writable = await readmeFile.createWritable();
      const content = `Game: ${game.title}
Version: ${game.version}
Release Year: ${game.releaseYear || 'N/A'}
Size: ${game.fileSize}
Target Directory: ${targetPath}
Extraction Password: ${game.extractionPassword || 'steamrip.com'}
Download Source: ${downloadUrl}
`;
      await writable.write(content);
      await writable.close();
    } catch (err) {
      console.warn('Could not write folder info file:', err);
    }
  }

  // Trigger browser direct download of the mirror URL without opening a new tab
  try {
    const urlFileName = downloadUrl.split('/').pop()?.split('?')[0];
    const isDirectArchive = urlFileName && (urlFileName.endsWith('.zip') || urlFileName.endsWith('.rar') || urlFileName.endsWith('.7z') || urlFileName.endsWith('.iso') || urlFileName.endsWith('.exe') || urlFileName.endsWith('.torrent'));
    const downloadFileName = isDirectArchive ? urlFileName : `${game.title.replace(/[^a-zA-Z0-9_\-]/g, '_')}.zip`;

    triggerMirrorDownload(downloadUrl, downloadFileName);
    return true;
  } catch (e) {
    console.error('Failed browser download trigger:', e);
    return false;
  }
}

