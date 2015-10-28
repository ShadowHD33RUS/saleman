Saleman (web client)
====================

Description
--------------------

This is a single page web client application of Saleman project [(http://saleman.biz)](http://saleman.biz).

How to deploy
--------------------
1.	[Optional] Create file in root named '.ftppass'. This is a JSON-file, [grunt-sftp-deploy plugin](https://github.com/thrashr888/grunt-sftp-deploy) is using to find credentials for connection with your FTP-server via SSL.
2.	[Optional] Configure sftp-deploy plugin in Gruntfile.js
3.	Configure Grunt's NPM dependencies. You need to run 'npm install' from this directory. If you don't have NPM - please, install it.
4.	Run Grunt task 'compileApp'. Directory 'build' is created under root of application folder. Since now you have to versions of application: development and production. Production is under 'build' directory, development is under root.
# IMPORTANT! You have to setup debug flag in app/config.js to true only if you use development version. Otherwise switch it to false.
5.	Configure 'app/config.js'.