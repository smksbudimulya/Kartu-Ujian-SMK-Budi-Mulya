// E-Kartu Ujian - GitHub Pages configuration
// Ganti URL di bawah dengan URL Web App Google Apps Script yang berakhiran /exec.
// Contoh: https://script.google.com/macros/s/AKfycb.../exec
window.EKARTU_API_URL = "/**
 * E-KARTU UJIAN - GOOGLE APPS SCRIPT API BACKEND
 * Frontend: GitHub Pages
 * Database: Google Spreadsheet
 *
 * Deploy sebagai Web App:
 * Execute as: Me
 * Who has access: Anyone
 * Copy URL /exec ke config.js pada repository GitHub.
 */

function doGet(e) {
  e = e || {parameter:{}};
  var p = e.parameter || {};
  if (p.action) {
    return jsonp_(p.callback, routeGet_(p.action, p));
  }
  return HtmlService.createHtmlOutput(
    '<h2>E-Kartu Ujian API</h2><p>Backend aktif. Frontend berada di GitHub Pages.</p>'
  );
}

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    var payload = {};
    if (p.payload) payload = JSON.parse(p.payload);
    var result = routePost_(p.action || '', payload);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({success:false,message:String(err.message || err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function jsonp_(callback, data) {
  var safe = String(callback || '').replace(/[^a-zA-Z0-9_$]/g,'');
  if (!safe) {
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput(safe + '(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function routeGet_(action, p) {
  switch (action) {
    case 'getAppData': return getAppData();
    case 'checkLogin': return checkLogin(p.username, p.password);
    case 'getPrintHistory': return getPrintHistory(p.limit);
    case 'getUsers': return getUsers();
    default: return {success:false,message:'Action GET tidak dikenal: '+action};
  }
}

function routePost_(action, p) {
  switch (action) {
    case 'saveAppConfig': return {success:saveAppConfig(p),message:'Konfigurasi tersimpan.'};
    case 'replaceStudents': return replaceStudents(p.students || []);
    case 'savePrintHistory':
      return {success:savePrintHistory(p.operator,p.jumlahKartu,p.kelasRuang)};
    case 'addUser': return addUser(p);
    case 'deleteUser': return deleteUser(p.username);
    case 'clearPrintHistory': return {success:clearPrintHistory()};
    default: return {success:false,message:'Action POST tidak dikenal: '+action};
  }
}

/* ===== DATABASE ===== */

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var config = ensureSheet_(ss, 'Konfigurasi', ['Kunci','Nilai']);
  if (config.getLastRow() < 2) {
    config.getRange(2,1,7,2).setValues([
      ['judul_ujian','PENILAIAN TENGAH SEMESTER'],
      ['nama_sekolah','SMKS Budi Mulya'],
      ['tahun_ajaran','2026-2027'],
      ['kota','Bojonegoro'],
      ['tgl_ttd','27 September 2026'],
      ['nama_kepsek',''],
      ['nip_kepsek','']
    ]);
  }

  var siswa = ensureSheet_(ss,'DataSiswa',
    ['no_peserta','nama_lengkap','jk','kelas','ruang','ttl','foto_url']);
  if (siswa.getLastRow() < 2) {
    siswa.getRange(2,1,2,7).setValues([
      ['01-001-2026','Ahmad Rizky Pratama','L','XII TKJ 1','Ruang 01','Bojonegoro, 12 Mei 2007',''],
      ['01-002-2026','Siti Nurhaliza','P','XII TKJ 1','Ruang 01','Bojonegoro, 20 Agustus 2007','']
    ]);
  }

  var users = ensureSheet_(ss,'Users',
    ['username','password','role','nama_lengkap']);
  if (users.getLastRow() < 2) {
    users.getRange(2,1,2,4).setValues([
      ['admin','edudigital','Admin','Administrator Utama'],
      ['peserta','edudigital','Peserta','Siswa / User']
    ]);
  }

  ensureSheet_(ss,'RiwayatCetak',
    ['id','tgl_cetak','operator','jumlah_kartu','kelas_ruang']);

  return 'Database berhasil dibuat.';
}

function ensureSheet_(ss,name,headers) {
  var sh=ss.getSheetByName(name);
  if (!sh) sh=ss.insertSheet(name);
  if (sh.getLastRow()===0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function checkLogin(username,password) {
  username=String(username||'').trim();
  password=String(password||'');
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sh) return {success:false,message:'Sheet Users belum ada. Jalankan setupDatabase().'};

  var rows=sh.getDataRange().getDisplayValues();
  for (var i=1;i<rows.length;i++) {
    if (String(rows[i][0]).trim()===username && String(rows[i][1])===password) {
      return {success:true,user:{
        username:rows[i][0],role:rows[i][2]||'User',nama:rows[i][3]||username
      }};
    }
  }
  return {success:false,message:'Username atau Password salah.'};
}

function getAppData() {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  return {config:readConfig_(ss),students:readStudents_(ss),timestamp:new Date().toISOString()};
}

function readConfig_(ss) {
  var sh=ss.getSheetByName('Konfigurasi');
  if (!sh || sh.getLastRow()<2) return {};
  var values=sh.getRange(2,1,sh.getLastRow()-1,2).getDisplayValues();
  var out={};
  values.forEach(function(row){
    var key=String(row[0]||'').trim();
    if(key) out[key]=row[1];
  });
  return out;
}

function readStudents_(ss) {
  var sh=ss.getSheetByName('DataSiswa');
  if (!sh || sh.getLastRow()<2) return [];
  var values=sh.getDataRange().getDisplayValues();
  var headers=values[0].map(function(v){return String(v||'').trim().toLowerCase();});
  return values.slice(1).filter(function(row){
    return row.some(function(v){return String(v||'').trim()!=='';});
  }).map(function(row){
    var item={};
    headers.forEach(function(h,i){item[h]=row[i]||'';});
    return {
      no_peserta:item.no_peserta||item['nomor peserta']||'',
      nama_lengkap:item.nama_lengkap||item.nama||'',
      jk:item.jk||item.jenis_kelamin||'',
      kelas:item.kelas||'',
      ruang:item.ruang||'',
      ttl:item.ttl||item['tempat, tgl lahir']||'',
      foto_url:item.foto_url||item.foto||''
    };
  });
}

function saveAppConfig(config) {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName('Konfigurasi');
  if(!sh) sh=ensureSheet_(ss,'Konfigurasi',['Kunci','Nilai']);

  var values=sh.getDataRange().getValues();
  var rowMap={};
  for(var i=1;i<values.length;i++){
    var key=String(values[i][0]||'').trim();
    if(key)rowMap[key]=i+1;
  }

  Object.keys(config||{}).forEach(function(key){
    var value=config[key]==null?'':String(config[key]);
    if(value.length>45000)return;
    if(rowMap[key])sh.getRange(rowMap[key],2).setValue(value);
    else sh.appendRow([key,value]);
  });
  return true;
}

function replaceStudents(students) {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName('DataSiswa');
  if(!sh)sh=ensureSheet_(ss,'DataSiswa',
    ['no_peserta','nama_lengkap','jk','kelas','ruang','ttl','foto_url']);

  sh.clearContents();
  sh.getRange(1,1,1,7).setValues([[
    'no_peserta','nama_lengkap','jk','kelas','ruang','ttl','foto_url'
  ]]);

  var rows=(students||[]).map(function(s){
    return [s.no_peserta||'',s.nama_lengkap||'',s.jk||'',
      s.kelas||'',s.ruang||'',s.ttl||'',s.foto_url||''];
  });
  if(rows.length)sh.getRange(2,1,rows.length,7).setValues(rows);
  return {success:true,count:rows.length};
}

function savePrintHistory(operator,jumlahKartu,kelasRuang) {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh=ss.getSheetByName('RiwayatCetak');
  if(!sh)sh=ensureSheet_(ss,'RiwayatCetak',
    ['id','tgl_cetak','operator','jumlah_kartu','kelas_ruang']);

  sh.appendRow([Utilities.getUuid(),new Date(),operator||'admin',
    Number(jumlahKartu||0),kelasRuang||'Semua Ruang']);
  return true;
}

function getPrintHistory(limit) {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RiwayatCetak');
  if(!sh||sh.getLastRow()<2)return [];
  var values=sh.getDataRange().getDisplayValues().slice(1).reverse();
  var max=Math.max(1,Math.min(Number(limit||100),500));
  return values.slice(0,max).map(function(row){
    return {id:row[0],tgl:row[1],operator:row[2],jumlah:Number(row[3]||0),ruang:row[4]};
  });
}

function clearPrintHistory() {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RiwayatCetak');
  if(!sh)return true;
  if(sh.getLastRow()>1)sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
  return true;
}

function getUsers() {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if(!sh||sh.getLastRow()<2)return [];
  return sh.getDataRange().getDisplayValues().slice(1).filter(function(r){
    return String(r[0]).trim()!=='';
  }).map(function(r){
    return {username:r[0],role:r[2]||'Peserta',nama:r[3]||''};
  });
}

function addUser(user) {
  user=user||{};
  var username=String(user.username||'').trim();
  var password=String(user.password||'');
  var nama=String(user.nama||'').trim();
  var role=String(user.role||'Peserta');
  if(!username||!password||!nama)return {success:false,message:'Username, password, dan nama wajib diisi.'};
  if(['Admin','Guru','Peserta'].indexOf(role)<0)role='Peserta';

  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if(!sh)sh=ensureSheet_(SpreadsheetApp.getActiveSpreadsheet(),'Users',
    ['username','password','role','nama_lengkap']);
  var rows=sh.getDataRange().getDisplayValues();
  for(var i=1;i<rows.length;i++){
    if(String(rows[i][0]).trim().toLowerCase()===username.toLowerCase())
      return {success:false,message:'Username sudah digunakan.'};
  }
  sh.appendRow([username,password,role,nama]);
  return {success:true};
}

function deleteUser(username) {
  var sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if(!sh)return {success:false,message:'Sheet Users belum ada.'};
  var rows=sh.getDataRange().getDisplayValues();
  for(var i=1;i<rows.length;i++){
    if(String(rows[i][0]).trim()===String(username).trim()){
      sh.deleteRow(i+1);
      return {success:true};
    }
  }
  return {success:false,message:'Pengguna tidak ditemukan.'};
}
";
