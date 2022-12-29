var express = require('express');
var router = express.Router();
const webpush = require('web-push');

const fs = require('fs');

// index
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// sendNotification
router.get('/sendNotification', async function(req, res, next) {
  await sendPushNotifications();
  res.send('Success');
});


// saveSender
router.post('/saveSender', function(req, res, next){
  var formData = req.body
  var date = new Date(formData.ts)
  fs.writeFile('zadnjeSlikano.txt', formData.title + ', ' + date.getHours()+':'+date.getMinutes(), (err) => {
    if (err) throw err;
})
  return res.send(formData);
});


let subscriptions = [];
const SUBS_FILENAME = 'subscriptions.json';
try {
  subscriptions = JSON.parse(fs.readFileSync(SUBS_FILENAME));
} catch (error) {
  console.error(error);
}

// saveSubscription
router.post("/saveSubscription", function(req, res, next) {
  let sub = req.body.sub;
  subscriptions.push(sub);
  fs.writeFileSync(SUBS_FILENAME,JSON.stringify(subscriptions));
  res.json({
    success: true
  });
});

async function sendPushNotifications() {
  webpush.setVapidDetails('mailto:luka.kusec@fer.hr',
  'BOh-7z_dSVwgpsMv4mbBPBXLiff1wnjDui10PTaGVCPb7-3rdZLoRfiGa1-W6oZzYQJZt_TXo_Z-D3fTGEc8Co8',
  'LdWiPW9U3k0pw99MSy4FAp_AhsGguV9C1OAMz4XSgBA');
  subscriptions.forEach(async sub => {
    try {
      await webpush.sendNotification(sub, JSON.stringify({
        title: 'Nova notifikacija!',
        body: 'Netko je poslao novu notifikaciju',
        redirectUrl: '/'
      }));
    } catch (error) {
      console.error(error);
    }
  });
}

module.exports = router;
