    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');
    var multer = require('multer');
    var fs = require('fs');
    var util = require('util');

    app.use(function(req, res, next) { //allow cross origin requests
        res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
        res.header("Access-Control-Allow-Origin", "http://localhost");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    /** Serving from the same express Server
    No cors required */
    app.use(express.static('../client'));
    app.use(bodyParser.json());

    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    });

    var upload = multer({ //multer settings
                    storage: storage
                }).single('file');

    /** API path that will upload the files */
    app.post('/upload', function(req, res) {
        upload(req,res,function(err){
            if(err){
                 res.json({error_code:1,err_desc:err});
                 return;
            }
             res.json({error_code:0,err_desc:null});
        });
    });

     app.post('/CreateDocument', function(req, res) {
       /*var fileData = fs.readFileSync('fileData.json');
        var config = JSON.parse(fileData);
        var fileDataStore = req.body;
        fileDataStore.dateVerified = new Date();
        fileDataStore.docOwner ="Test User";
        config.push(req.body);
        var configJSON = JSON.stringify(config);
        fs.writeFileSync('fileData.json', configJSON); */
         var results11 = CreateDocument(req.body.userName,req.body.filehash,req.body.docName,req.body.docDesc, req.body.ownerName);
         //var results11 = TestQuery(req.body.filehash);
         console.log(util.format("\n------------------------"));

         res.json({error_code:0,err_desc:null});

    });

        app.post('/UpdateViewer', function(req, res) {

         UpdateViewer(req.body.filehash, req.body.viewerName)
         res.json({error_code:0,err_desc:null});

    });


     app.get('/GetDocument/:fileHash/:viewerName', function(req, res) {

        GetDocument(req.params.fileHash, req.params.viewerName, function(err, response) {
          if(err){
              res.json({error_code:1,err_desc:"Record is not found"});
          }else{
         console.log("GetDocument returned value: " + response)
         var documentValue =JSON.parse(response);
           if(documentValue.error){
               res.json({error_code:1,err_desc:"Record is not found"});
           }else{
         documentValueMessgae = JSON.parse(documentValue.result.message)
          console.log("Document  value: " + documentValueMessgae)
          res.json(documentValueMessgae);
        }
        }
        });


    });

    function init() {


}

////retrieve data for standalone integration with blockchain.
////Create Document Object



function UpdateViewer(fileHash, viewerName)


      {
          var http = require('http');

          var response;

          try {
              console.log("config.json file path: " + __dirname)
              config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
          } catch (err) {
              console.log("config.json is missing or invalid file, Rerun the program with right file")
              process.exit();
          }


          var options1 = {
            host: config.chaincodeHost,
            port: config.chaincodePort,
            path: '/chaincode',
            method: 'POST'
          };


          var req1 = http.request(options1, function(res1) {
            console.log('RES1 STATUS: ' + res1.statusCode);
            console.log('RES1 HEADERS: ' + JSON.stringify(res1.headers));
            res1.setEncoding('utf8');
            res1.on('data', function (chunk) {
              console.log('RES1 BODY: ' + chunk);
              response = chunk;
              console.log('response: ' + response);
            });
          });

          req1.on('error', function(e) {
            console.log('problem with request1: ' + e.message);
          });



          var requestData = {
            jsonrpc: "2.0",
            method: "invoke",
            params: {
              type: 1,
              chaincodeID: {
                name: config.chaincodeID
              },
              ctorMsg: {
                function: "updateDocument",
                args: [
                  fileHash,
                  viewerName
                ]
              },
              secureContext: "test_user6"
            },
            id: 0
          };


          jsonObject = JSON.stringify(requestData);

          console.log('Query request: ' + jsonObject);


          req1.write(jsonObject);
          req1.end();

          return response;


}

    app.listen('8005', function(){
        console.log('running on 5002 mapped to 10598...');
        init();
    });


function CreateDocument(userName, filehash, docName, docDesc, ownerName)

    {
        var http = require('http');

        var response;

        try {
            console.log("config.json file path: " + __dirname)
            config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
        } catch (err) {
            console.log("config.json is missing or invalid file, Rerun the program with right file")
            process.exit();
        }


        var options1 = {
          host: config.chaincodeHost,
          port: config.chaincodePort,
          path: '/chaincode',
          method: 'POST'
        };


        var req1 = http.request(options1, function(res1) {
          console.log('RES1 STATUS: ' + res1.statusCode);
          console.log('RES1 HEADERS: ' + JSON.stringify(res1.headers));
          res1.setEncoding('utf8');
          res1.on('data', function (chunk) {
            console.log('RES1 BODY: ' + chunk);
            response = chunk;
            console.log('response: ' + response);
          });
        });

        req1.on('error', function(e) {
          console.log('problem with request1: ' + e.message);
        });



        var requestData = {
          jsonrpc: "2.0",
          method: "invoke",
          params: {
            type: 1,
            chaincodeID: {
              name: config.chaincodeID
            },
            ctorMsg: {
              function: "createDocument",
              args: [
                docName,
                docDesc,
                ownerName,
                userName,
                Date(),
                filehash
              ]
            },
            secureContext: "test_user6"
          },
          id: 0
        };


        jsonObject = JSON.stringify(requestData);

        console.log('Query request: ' + jsonObject);


        req1.write(jsonObject);
        req1.end();

        return response;
}




var GetDocument = function (fileHash, viewerName, callback)
{
    var http = require('http');

    var response;

    try {
        console.log("config.json file path: " + __dirname)
        config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
    } catch (err) {
        console.log("config.json is missing or invalid file, Rerun the program with right file")
        process.exit();
    }


    var options1 = {
      host: config.chaincodeHost,
      port: config.chaincodePort,
      path: '/chaincode',
      method: 'POST'
    };


    var req1 = http.request(options1, function(res1) {
      console.log('RES1 STATUS: ' + res1.statusCode);
      console.log('RES1 HEADERS: ' + JSON.stringify(res1.headers));
      res1.setEncoding('utf8');
      res1.on('data', function (chunk) {
        console.log('RES1 BODY: ' + chunk);
        response = chunk;
        callback(null, response); // invoke callback
        console.log('response: ' + response);
      });
    });

    req1.on('error', function(e) {
        callback(e, null); // invoke callback
      console.log('problem with request1: ' + e.message);
    });

    req1.on('end', function() {
    callback(response); // invoke callback
  });


    var requestData = {
      jsonrpc: "2.0",
      method: "query",
      params: {
        type: 1,
        chaincodeID: {
          name: config.chaincodeID
        },
        ctorMsg: {
          function: "GetDocument",
          args: [
            fileHash,
            viewerName
          ]
        },
        secureContext: "test_user6"
      },
      id: 0
    };



    jsonObject = JSON.stringify(requestData);

    console.log('Query request: ' + jsonObject);


    req1.write(jsonObject);
    req1.end();

     response;
}
