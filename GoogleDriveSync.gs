/** Brand Nation Google Drive image catalogue. Deploy as a Google Apps Script Web App. */
const FOLDER_ID = '1Z2D2lmaY3CxQSg0Yb7CzDpzvUXSeCm_D';

function doGet(e) {
  const callback = (e && e.parameter && e.parameter.callback) || '';
  // Only allow a simple JS function identifier for JSONP (no arbitrary code).
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]{0,79}$/.test(callback)) {
    return ContentService.createTextOutput(JSON.stringify({error:'Missing or invalid callback'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  let result;
  try {
    if (FOLDER_ID.indexOf('PASTE_') === 0) throw new Error('Configure FOLDER_ID first');
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFiles();
    const items = [];
    while (files.hasNext() && items.length < 500) {
      const file = files.next();
      if (!/^image\//i.test(file.getMimeType())) continue;
      const rawName = file.getName().replace(/\.[^.]+$/, '').replace(/[_-]+/g,' ').trim();
      items.push({id:file.getId(), name:rawName || 'New Arrival', updated:file.getLastUpdated().getTime()});
    }
    items.sort((a,b)=>b.updated-a.updated);
    result={items:items};
  } catch(err) {result={error:String(err.message||err)};}
  // Escape characters that can terminate a script tag if a file has an unusual name.
  const json=JSON.stringify(result).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return ContentService.createTextOutput(callback+'('+json+');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
