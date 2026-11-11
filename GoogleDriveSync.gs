/** Brand Nation Drive catalogue. Publish this version as an Apps Script Web App.
 * Images must be shared for public viewing to display on the storefront.
 * Product prices, names and availability remain editable in catalogue-admin.json.
 * To group photos, put all photos of ONE article/design in its own subfolder
 * under a category folder. Different designs need separate subfolders.
 * Publish a new Apps Script Web App version after this change.
 */
const FOLDER_ID = '1Z2D2lmaY3CxQSg0Yb7CzDpzvUXSeCm_D';
const MAX_IMAGES = 500;
const MAX_DEPTH = 4;

function doGet(e) {
  const callback = (e && e.parameter && e.parameter.callback) || '';
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]{0,79}$/.test(callback)) {
    return ContentService.createTextOutput(JSON.stringify({error:'Missing or invalid callback'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  let result;
  try {
    const root = DriveApp.getFolderById(FOLDER_ID);
    const items = [];
    const seen = {};
    const categoryCounts = {};
    const categoryFolders = [];
    function scan(folder, category, depth, productGroup) {
      if (depth > MAX_DEPTH || items.length >= MAX_IMAGES) return;
      if (depth === 1) {
        categoryFolders.push(category);
        if (!(category in categoryCounts)) categoryCounts[category] = 0;
      }
      const files = folder.getFiles();
      while (files.hasNext() && items.length < MAX_IMAGES) {
        const file = files.next();
        if (!/^image\//i.test(file.getMimeType()) || seen[file.getId()]) continue;
        seen[file.getId()] = true;
        const bucket = category || 'New Arrivals';
        categoryCounts[bucket] = (categoryCounts[bucket] || 0) + 1;
        const name = file.getName().replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
        items.push({
          id:file.getId(),
          name:name || 'New Arrival',
          category:category || 'New Arrivals',
          productGroup:productGroup || '',
          updated:file.getLastUpdated().getTime()
        });
      }
      if (depth >= MAX_DEPTH) return;
      const folders = folder.getFolders();
      while (folders.hasNext() && items.length < MAX_IMAGES) {
        const child = folders.next();
        scan(child, category || child.getName(), depth + 1, category ? (productGroup || child.getId()) : '');
      }
    }
    scan(root, '', 0, '');
    items.sort((a,b) => b.updated - a.updated);
    result = {items:items, categoryCounts:categoryCounts, categoryFolders:categoryFolders, total:items.length, limitReached:items.length >= MAX_IMAGES};
  } catch(err) {
    result = {error:String(err.message || err)};
  }
  const json = JSON.stringify(result)
    .replace(/</g,'\\u003c').replace(/>/g,'\\u003e')
    .replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return ContentService.createTextOutput(callback + '(' + json + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
