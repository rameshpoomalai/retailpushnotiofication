/*
    Copyright 2016-17 IBM Corp.
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
        http://www.apache.org/licenses/LICENSE-2.0
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
//import "bmsutils";
function displayNotification(event) {
    console.log("Display Notification");
    var messageJson = event.data.json();
    var title = messageJson.title ? messageJson.title : "New message";
    var imageUrl = messageJson.iconUrl ? messageJson.iconUrl : "images/icon.png";
    var tagJson = messageJson.payload;
    var tag = tagJson.tag ? tagJson.tag : "";
    var bodyAlert = messageJson.alert ? messageJson.alert : "Example message";
    var payloadData = messageJson.payload ? messageJson.payload : "Example message";

      console.log(messageJson);
      console.log(payloadData)
      

    self.registration.showNotification(title, {
        body: bodyAlert,
        icon: imageUrl,
        data: payloadData,
        tag: tag
    });
    return Promise.resolve();
}


function triggerSeenEvent(event) {
    console.log("Trigger Seen event " + event.data.text());
    send_message_to_all_clients("msgEventSeen:" + event.data.text());
}

function triggerOpenEvent(strMsg) {
    console.log("Trigger Open event " + strMsg);
    send_message_to_all_clients("msgEventOpen:" +strMsg);

}

function onPushNotificationReceived(event) {
    console.log('Push notification received : ', event);
    if (event.data) {
        console.log('Event data is : ', event.data.text());
    }
    event.waitUntil(displayNotification(event).then(() => triggerSeenEvent(event)));
};

self.addEventListener('push', onPushNotificationReceived);


function send_message_to_client(client, msg){
    console.log("Send message to client:"+msg);
    return new Promise(function(resolve, reject){
        var msg_chan = new MessageChannel();

        msg_chan.port1.onmessage = function(event){
            if(event.data.error){
                reject(event.data.error);
            }else{
                resolve(event.data);
            }
        };
        client.postMessage(msg, [msg_chan.port2]);
    });
}

function send_message_to_all_clients(msg){
    clients.matchAll().then(clients => {
        clients.forEach(client => {
        	console.log("Found a client " + client);
            if(client)
            {
              client.focus();
            }
            send_message_to_client(client, msg).then(m => console.log("SW Received Message: "+m));
        })
    });

}

var i = 0;
self.addEventListener('install', function(event) {
    self.skipWaiting();
    console.log('Installed Service Worker : ', event);
    //event.postMessage("SW Says 'Hello back!'");
});

self.addEventListener('message', function(event) {
    console.log("The message is " + event.data + " port is " + event.ports[0]);
    replyPort = event.ports[0];
});

self.addEventListener('activate', function(event) {
    console.log('Activated Service Worker : ', event);
    event.waitUntil(self.clients.claim());
});



self.addEventListener('pushsubscriptionchange', function() {
	console.log('Push Subscription change');
	send_message_to_all_clients("updateRegistration:");
});

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  console.log('On notification click:Body ', event.notification.body);
  console.log('On notification click:Body ', event.notification.data);
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: "window"
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      console.log("+++++++++++++++++++++++++");
      console.log(client.url);
      console.log(client);
      console.log("+++++++++++++++++++++++++");
      if (client.url == 'https://mypushnotification.mybluemix.net/' && 'focus' in client)
        return client.focus();
    }
    if (clients.openWindow)
      return clients.openWindow('/');
  }));
});
