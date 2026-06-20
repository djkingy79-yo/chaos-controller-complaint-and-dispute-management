import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { evidenceId } = body;

    if (!evidenceId) {
      return Response.json({ error: 'Missing evidenceId' }, { status: 400 });
    }

    // Get evidence record
    const evidence = await base44.entities.Evidence.get(evidenceId);
    if (!evidence) {
      return Response.json({ error: 'Evidence not found' }, { status: 404 });
    }

    // Get case to determine category
    const caseItem = await base44.entities.Case.get(evidence.case_id);
    if (!caseItem) {
      return Response.json({ error: 'Case not found' }, { status: 404 });
    }

    // Get Google Drive access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Create or get Chaos Controller backup folder
    const folderName = 'Chaos Controller Evidence Backup';
    let folderId = await getOrCreateFolder(accessToken, folderName);

    // Create category-specific subfolder (banking, insurance, tenancy, telco, utilities, government, other)
    const categoryName = caseItem.category || 'other';
    const categoryFolderName = categoryName === 'government' 
      ? 'Government Agencies' 
      : categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    const categoryFolderId = await getOrCreateFolder(accessToken, categoryFolderName, folderId);

    // Create case-specific subfolder within category
    const caseFolderName = `Case ${caseItem.title || evidence.case_id.slice(0, 8).toUpperCase()}`;
    const caseFolderId = await getOrCreateFolder(accessToken, caseFolderName, categoryFolderId);

    // Download file from Base44
    const fileResponse = await fetch(evidence.file_url);
    if (!fileResponse.ok) {
      throw new Error('Failed to download evidence file');
    }
    const fileBlob = await fileResponse.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    const base64Content = arrayBufferToBase64(arrayBuffer);

    // Upload to Google Drive
    const metadata = {
      name: evidence.file_name,
      description: `Evidence for case ${evidence.case_id}. Type: ${evidence.file_type || 'unknown'}. Tags: ${evidence.tags?.join(', ') || 'none'}`,
      parents: [caseFolderId]
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([arrayBuffer], { type: fileResponse.headers.get('content-type') || 'application/octet-stream' }));

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`Google Drive upload failed: ${JSON.stringify(error)}`);
    }

    const driveFile = await uploadResponse.json();

    // Update evidence record with Drive backup reference
    await base44.entities.Evidence.update(evidenceId, {
      description: evidence.description || `Backed up to Google Drive: ${driveFile.webViewLink}`,
      drive_backup_url: driveFile.webViewLink,
      drive_backup_id: driveFile.id
    });

    return Response.json({
      success: true,
      driveFileId: driveFile.id,
      driveFileLink: driveFile.webViewLink,
      fileName: evidence.file_name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getOrCreateFolder(accessToken, folderName, parentFolderId = null) {
  // Search for existing folder
  const searchQuery = parentFolderId
    ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

  const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name)`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!searchResponse.ok) {
    throw new Error('Failed to search Google Drive folders');
  }

  const searchResult = await searchResponse.json();

  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }

  // Create new folder
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`Failed to create folder: ${JSON.stringify(error)}`);
  }

  const folder = await createResponse.json();
  return folder.id;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}