#!/bin/bash

curl -X PUT $1/riak/webmin/index.html -H "Content-type: text/html" --data-binary @./webmin/index.html
curl -X PUT $1/riak/webmin/bucket.html -H "Content-type: text/html" --data-binary @./webmin/bucket.html
curl -X PUT $1/riak/webmin/document.html -H "Content-type: text/html" --data-binary @./webmin/document.html

curl -X PUT $1/riak/webmin/main.css -H "Content-type: text/css" --data-binary @./webmin/styles/main.css
curl -X PUT $1/riak/webmin/editor.css -H "Content-type: text/css" --data-binary @./webmin/styles/editor.css
curl -X PUT $1/riak/webmin/fluid.gs.css -H "Content-type: text/css" --data-binary @./webmin/styles/fluid.gs.css

curl -X PUT $1/riak/webmin/riak.js -H "Content-type: application/javascript" --data-binary @./webmin/scripts/riak.js
curl -X PUT $1/riak/webmin/main.js -H "Content-type: application/javascript" --data-binary @./webmin/scripts/main.js
curl -X PUT $1/riak/webmin/json2.js -H "Content-type: application/javascript" --data-binary @./webmin/scripts/json2.js
curl -X PUT $1/riak/webmin/jquery-1.4.3.min.js -H "Content-type: application/javascript" --data-binary @./webmin/scripts/jquery-1.4.3.min.js
curl -X PUT $1/riak/webmin/jquery.timers-1.2.js -H "Content-type: application/javascript" --data-binary @./webmin/scripts/jquery.timers-1.2.js
curl -X PUT $1/riak/webmin/editor.js -H "Content-type: application/javascript" --data-binary @./webmin/scripts/editor.js

curl -X PUT $1/riak/webmin/delete-icon.png -H "Content-type: image/png" --data-binary @./webmin/images/delete-icon.png
curl -X PUT $1/riak/webmin/fancybox.png -H "Content-type: image/png" --data-binary @./webmin/images/fancybox.png
curl -X PUT $1/riak/webmin/fancybox-x.png -H "Content-type: image/png" --data-binary @./webmin/images/fancybox-x.png
curl -X PUT $1/riak/webmin/fancybox-y.png -H "Content-type: image/png" --data-binary @./webmin/images/fancybox-y.png
curl -X PUT $1/riak/webmin/gritter.png -H "Content-type: image/png" --data-binary @./webmin/images/gritter.png
curl -X PUT $1/riak/webmin/left-icon.png -H "Content-type: image/png" --data-binary @./webmin/images/left-icon.png
curl -X PUT $1/riak/webmin/plus-icon.png -H "Content-type: image/png" --data-binary @./webmin/images/plus-icon.png
curl -X PUT $1/riak/webmin/riak-logo.png -H "Content-type: image/png" --data-binary @./webmin/images/riak-logo.png
curl -X PUT $1/riak/webmin/right-icon.png -H "Content-type: image/png" --data-binary @./webmin/images/right-icon.png
curl -X PUT $1/riak/webmin/tick-icon.png -H "Content-type: image/png" --data-binary @./webmin/images/tick-icon.png
curl -X PUT $1/riak/webmin/add.png -H "Content-type: image/png" --data-binary @./webmin/images/add.png
curl -X PUT $1/riak/webmin/delete.png -H "Content-type: image/png" --data-binary @./webmin/images/delete.png

curl -X PUT $1/riak/webmin/favicon.ico -H "Content-type: image/x-icon" --data-binary @./webmin/images/favicon.ico
