import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const GITHUB_TOKEN = 'REDACTED_TOKEN_USE_ENV_VAR';
const REPO_OWNER = 'hvndal';
const REPO_NAME = 'TvCan';
const TAG_NAME = 'v1.0.0';
const RELEASE_NAME = 'tvcan v1.0.0 — VLC Media Player Engine';
const RELEASE_DESCRIPTION = 'High-performance desktop live TV player with integrated VLC Media Player engine, smart category consolidation, and direct HLS stream filtering.';

const FILE_TO_UPLOAD = path.join(process.cwd(), 'tvcan-win-x64.zip');

async function main() {
  console.log('🚀 Step 1: Pushing latest code to GitHub repository...');
  try {
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Git push complete!');
  } catch (err) {
    console.warn('⚠️ Git push output:', err.message);
  }

  if (!fs.existsSync(FILE_TO_UPLOAD)) {
    console.error(`\n❌ ERROR: Target file not found at: ${FILE_TO_UPLOAD}`);
    process.exit(1);
  }

  const fileSize = fs.statSync(FILE_TO_UPLOAD).size;
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
  console.log(`\n📦 File ready for upload: ${FILE_TO_UPLOAD} (${fileSizeMB} MB)`);

  const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'User-Agent': 'tvcan-uploader',
    'Accept': 'application/vnd.github.v3+json'
  };

  console.log('\n🔎 Step 2: Checking GitHub Release...');
  let releaseId = null;
  let uploadUrl = null;

  try {
    const listRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, { headers });
    const releases = await listRes.json();
    if (Array.isArray(releases)) {
      const existingRelease = releases.find(r => r.tag_name === TAG_NAME);
      if (existingRelease) {
        console.log(`✅ Found existing release "${TAG_NAME}" (ID: ${existingRelease.id})`);
        releaseId = existingRelease.id;
        uploadUrl = existingRelease.upload_url;
      }
    }
  } catch (err) {
    console.log('Searching existing release via tag...');
  }

  if (!releaseId) {
    try {
      const getTagRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG_NAME}`, { headers });
      if (getTagRes.ok) {
        const tagRelease = await getTagRes.json();
        releaseId = tagRelease.id;
        uploadUrl = tagRelease.upload_url;
        console.log(`✅ Found existing release by tag "${TAG_NAME}" (ID: ${releaseId})`);
      }
    } catch (e) {}
  }

  if (!releaseId) {
    console.log(`🔨 Step 2b: Creating new GitHub Release "${TAG_NAME}"...`);
    const createRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: TAG_NAME,
        name: RELEASE_NAME,
        body: RELEASE_DESCRIPTION,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('❌ Failed to create release:', errText);
      process.exit(1);
    }

    const newRelease = await createRes.json();
    releaseId = newRelease.id;
    uploadUrl = newRelease.upload_url;
    console.log(`✅ Release "${TAG_NAME}" created successfully (ID: ${releaseId})!`);
  }

  const rawUploadUrl = uploadUrl.split('{')[0];
  const targetUploadUrl = `${rawUploadUrl}?name=tvcan-win-x64.zip`;

  console.log(`\n⬆️ Step 3: Uploading ${fileSizeMB} MB asset to GitHub Release...`);
  const fileBuffer = fs.readFileSync(FILE_TO_UPLOAD);

  const uploadRes = await fetch(targetUploadUrl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/zip',
      'Content-Length': fileBuffer.length.toString()
    },
    body: fileBuffer
  });

  if (uploadRes.ok) {
    const asset = await uploadRes.json();
    console.log(`\n🎉 SUCCESS! File uploaded to GitHub Release:`);
    console.log(`🔗 Direct Download URL: ${asset.browser_download_url}`);
  } else {
    const errText = await uploadRes.text();
    console.error('❌ Asset upload failed:', errText);
    process.exit(1);
  }

  if (process.argv.includes('--shutdown')) {
    console.log('\n🔌 Shutting down laptop in 30 seconds as requested...');
    execSync('shutdown /s /t 30', { stdio: 'inherit' });
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
