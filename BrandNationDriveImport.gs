/**
 * Brand Nation: copy ALL public GitHub product photos to existing Google Drive folders.
 * Run importBrandNationImages() repeatedly until it reports "Complete".
 * Safe to rerun: destination filenames are stable and existing files are skipped.
 * This is a separate script file; do not replace the deployed GoogleDriveSync.gs.
 */
const BN_REPO = 'A-ankita/brand-nation';
const BN_ROOT_ID = '1Z2D2lmaY3CxQSg0Yb7CzDpzvUXSeCm_D';
const BN_BATCH_SIZE = 15;
const BN_MAX_BYTES = 15 * 1024 * 1024;
const BN_CATEGORIES = [
  'Shirts', 'T-shirts & Polos', 'Knitwear', 'Sweatshirts & Hoodies',
  'Bottomwear', 'Co-ord Sets', 'Jackets', 'Watches', 'Bags'
];

function bnCategory(path) {
  const s = path.toLowerCase();
  if (/watch|timepiece/.test(s)) return 'Watches';
  if (/bag|backpack|wallet|tote/.test(s)) return 'Bags';
  if (/co[-_ ]?ord|coord|matching[-_ ]?set/.test(s)) return 'Co-ord Sets';
  if (/jacket|windbreaker|blazer|coat/.test(s)) return 'Jackets';
  if (/hood|sweatshirt|crewneck/.test(s)) return 'Sweatshirts & Hoodies';
  if (/knit|sweater|quarter[-_ ]?zip|pullover|henley/.test(s)) return 'Knitwear';
  if (/jogger|jean|denim[-_ ]?pant|trouser|bottom|trackpant/.test(s)) return 'Bottomwear';
  if (/polo|t[-_ ]?shirt|tee[-_ ]?shirt/.test(s)) return 'T-shirts & Polos';
  if (/shirt|flannel|button[-_ ]?down/.test(s)) return 'Shirts';
  return 'New Arrivals';
}

function bnImagePaths() {
  const url = 'https://api.github.com/repos/' + BN_REPO + '/git/trees/main?recursive=1';
  const token = PropertiesService.getScriptProperties().getProperty('BN_GITHUB_TOKEN');
  if (!token) throw new Error('Set BN_GITHUB_TOKEN in Apps Script Project Settings → Script properties before importing.');
  const response = UrlFetchApp.fetch(url, {muteHttpExceptions:true,headers:{Accept:'application/vnd.github+json', 'User-Agent':'BrandNationDriveImport', Authorization:'Bearer '+token}});
  if (response.getResponseCode() !== 200) throw new Error('GitHub tree API returned HTTP ' + response.getResponseCode() + '. Check token permissions and API rate limits.');
  const tree = JSON.parse(response.getContentText());
  if (tree.truncated) throw new Error('GitHub tree listing was truncated; import stopped to avoid missing images.');
  return tree.tree.filter(f => f.type === 'blob' && /\.(jpe?g|png|webp|gif|avif)$/i.test(f.path))
    .map(f => ({path:f.path,size:f.size||0})).sort((a,b)=>a.path.localeCompare(b.path));
}

function bnTargetFolders(root) {
  const result = {};
  const it = root.getFolders();
  while(it.hasNext()) {const f=it.next();if(BN_CATEGORIES.includes(f.getName()))result[f.getName()]=f;}
  // Unclassified images go into the catalogue root, not a new category folder.
  result['New Arrivals'] = root;
  return result;
}

function bnFileName(path) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, path, Utilities.Charset.UTF_8);
  const hash = bytes.slice(0,8).map(x=>('0'+(x&255).toString(16)).slice(-2)).join('');
  const base = path.split('/').pop().replace(/[^a-zA-Z0-9._-]/g,'_');
  return 'BN-GH-' + hash + '-' + base;
}

function importBrandNationImages() {
  const paths = bnImagePaths();
  const root = DriveApp.getFolderById(BN_ROOT_ID);
  const folders = bnTargetFolders(root);
  const props = PropertiesService.getScriptProperties();
  let cursor = Number(props.getProperty('BN_IMPORT_CURSOR')||0);
  if(cursor >= paths.length) {Logger.log('Complete: '+paths.length+' image paths processed.');return;}
  let copied=0,skipped=0,failed=0,processed=0;
  const stop=Math.min(paths.length,cursor+BN_BATCH_SIZE);
  for(let i=cursor;i<stop;i++) {
    const item=paths[i];
    const category=bnCategory(item.path);
    const folder=folders[category];
    if(!folder){Logger.log('Missing category folder '+category+' for '+item.path);failed++;break;}
    const filename=bnFileName(item.path);
    try {
      if(folder.getFilesByName(filename).hasNext()){skipped++;processed++;continue;}
      if(item.size>BN_MAX_BYTES){Logger.log('Oversized: '+item.path);skipped++;processed++;continue;}
      const url='https://raw.githubusercontent.com/'+BN_REPO+'/main/'+item.path.split('/').map(encodeURIComponent).join('/');
      const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true});
      if(response.getResponseCode()!==200)throw new Error('HTTP '+response.getResponseCode());
      const blob=response.getBlob().setName(filename);
      if(blob.getBytes().length>BN_MAX_BYTES)throw new Error('File exceeds 15 MB');
      folder.createFile(blob);
      copied++;processed++;
    } catch(err) {
      Logger.log('Failed '+item.path+': '+err);
      failed++;
      break; // Retain cursor at failed file; no silent loss.
    }
  }
  props.setProperty('BN_IMPORT_CURSOR',String(cursor+processed));
  Logger.log('Processed '+(cursor+processed)+'/'+paths.length+'; copied '+copied+', already present/oversized '+skipped+', failed '+failed+'. Run again to continue.');
}

function resetBrandNationImportCursor() {
  // Only resets progress, never deletes images; existing copies are still skipped.
  PropertiesService.getScriptProperties().deleteProperty('BN_IMPORT_CURSOR');
}
