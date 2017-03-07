
'use strict';

angular.module('fileUpload', ['ngFileUpload'])
.controller('MyCtrl',['Upload','$window', '$timeout','$http', function(Upload,$window, $timeout,$http){
    var vm = this;
    vm.fileDescription = "",
    vm.fileDocVerifier = "";
    vm.activeTab = 1;
    vm.tabDescription ="Please select a file that you wan to certify and store the fingerprint to blockchain.";
    vm.userNames = ["ING", "ABN AMRO", "HSBC"];
    vm.userName = "ING";
    vm.viewerNames =["ING", "ABN AMRO", "HSBC", "Romans Estate Agency"];
    vm.viewerName ="HSBC";
    vm.corporateNames = ["Wal-Mart", "TESCO", "Royal Dutch Shell"];
    vm.corporateName = "Wal-Mart";

var translate = function(x) {
  return x;
};
var show_message = function(message, type) {
  if (!type) {
    type = 'success';
  }
  $('.top-right').notify({
    'type': type,
    message: {
      'text': message
    },
    fadeOut: {
      enabled: true,
      delay: 5000
    }
  }).show();
};

$(document).ready(function() {
  var message = {
    'format': translate('Must select a file to upload'),
    'existing': translate('File already exists in the system. Redirecting...'),
    'added': translate('File successfully added to system. Redirecting...')
  };

  var bar = $('.bar');
  var upload_submit = $('#upload_submit');
  var upload_form = $('#upload_form');
  var latest = $('#latest');
  var latest_confirmed = $('#latest_confirmed');
  var explain = $('#explain');
  var dropbox = $('.dropbox');

  // uncomment this to try non-HTML support:
  //window.File = window.FileReader = window.FileList = window.Blob = null;

  var html5 = window.File && window.FileReader && window.FileList && window.Blob;
  $('#wait').hide();

  var handleFileSelect = function(f) {
    if (!html5) {
      return;
    }
    explain.html(translate('Loading document...'));
    var output = '';
    output = translate('Preparing to hash ') + escape(f.name) + ' (' + (f.type || translate('n/a')) + ') - ' + f.size + translate(' bytes, last modified: ') + (f.lastModifiedDate ? f.lastModifiedDate
      .toLocaleDateString() : translate('n/a')) + '';
    vm.file = f;
    var reader = new FileReader();
    reader.onload = function(e) {
      var data = e.target.result;
      bar.width(0 + '%');
      bar.addClass('bar-success');
      explain.html(translate('Now hashing... ') + translate('Initializing'));
      vm.fileName =  data;
      setTimeout(function() {
        CryptoJS.SHA256(data, crypto_callback, crypto_finish);
      }, 200);

    };
    reader.onprogress = function(evt) {
      if (evt.lengthComputable) {
        var w = (((evt.loaded / evt.total) * 100).toFixed(2));
        bar.width(w + '%');
      }
    };
    reader.readAsBinaryString(f);
    show_message(output, 'info');
  };
  if (!html5) {
    explain.html(translate('disclaimer'));
    upload_form.show();
  } else {
    dropbox.show();
    dropbox.filedrop({
      callback: handleFileSelect
    });
    dropbox.click(function() {
      $('#file').click();
    });
  }

  // latest documents
  var refreshLatest = function(confirmed, table) {
    $.getJSON('./api/internal/latest/' + (!!confirmed ? 'confirmed' : 'unconfirmed'), function(data) {
      var items = [];

      items.push(
        '<thead><tr><th></th><th>' +
        translate('Document Digest') +
        '</th><th>' +
        translate('Timestamp') +
        '</th></tr></thead>');
      $.each(data, function(index, obj) {
        var badge = '';
        if (obj.tx) {
          badge = '<span class="label label-success">✔</span>';
        }
        items.push('<tr><td>' + badge + '</td><td><a href="./detail/' + obj.digest +
          '">' + obj.digest +
          '</a></td><td> ' + obj.timestamp + '</td></tr>');
      });

      table.empty();
      $('<div/>', {
        'class': 'unstyled',
        html: items.join('<br />')
      }).appendTo(table);
    });
  };
  refreshLatest(false, latest);
  refreshLatest(true, latest_confirmed);

  // client-side hash
  var onRegisterSuccess = function(json) {
    if (json.success) {
      show_message(vsprintf(message['added'], []), 'success');
    } else {
      show_message(message[json.reason], 'warn');
    }
    if (json.digest) {
      window.setTimeout(function() {
        window.location.replace('./detail/' + json.digest);
      }, 5000);
    }
  };

  var crypto_callback = function(p) {
    var w = ((p * 100).toFixed(0));
    bar.width(w + '%');
    explain.html(translate('Now hashing... ') + (w) + '%');
  };

  var crypto_finish = function(hash) {
    bar.width(100 + '%');
    explain.html(translate('Document hash: ') + hash);
     $timeout(function(){
         vm.fileHash =  hash.toString();
         if(vm.activeTab!==1){
         vm.getDocument();
     }
     }
        );

    $.post('./api/v1/register/' + hash, onRegisterSuccess);
  };


  document.getElementById('file').addEventListener('change', function(evt) {
    var f = evt.target.files[0];
    handleFileSelect(f);
  }, false);
  });


    vm.submit = function(fileObject){ //function to call on form submit
        if (vm.upload_form.file.$valid && vm.file) { //check if from is valid
            vm.upload(vm.file); //call upload function
        }
    }

    vm.upload = function (file) {
        Upload.upload({
            url: '/upload', //webAPI exposed to upload the file
            data:{file:file} //pass file as data, should be user ng-model
        }).then(function (resp) { //upload function returns a promise
            if(resp.data.error_code === 0){ //validate success
                 $http({
                     url: '/CreateDocument',
                     method: "POST",
                     data:{  "filehash":vm.fileHash,
                             "docName":file.name,
                             "docDesc":vm.fileDescription,
                             "ownerName":vm.ownerName,
                              "userName": vm.userName}
                }).then(function (resp) { //upload function returns a promise
                        show_message(file.name+" uploaded successfully", 'success');
                    })
            } else {
                show_message("an error occured", 'warn');
            }
        }, function (resp) { //catch error
            console.log('Error status: ' + resp.status);

        }, function (evt) {
        });
    };

    vm.updateViewer = function (file) {

               $http({
                   url: '/UpdateViewer',
                   method: "POST",
                   data:{  "filehash":vm.fileHash,
                           "viewerName":vm.document.viewer}
              }).then(function (resp) { //upload function returns a promise
                      show_message("Send to Viewer successfully", 'success');
                  })

    };

   vm.getDocument = function(){
    var viewerName = "";
    if(vm.activeTab ===2){
      viewerName = vm.corporateName;
      vm.tabDescription ="Please select a file so that a  fingerprint can be generated to be used to find the certified record which is stored in blockchain.";

    }else if(vm.activeTab===3){
      viewerName = vm.viewerName;
      vm.tabDescription ="Please select a file which you want to find out the certified owner and the integrity of the file you selected here";
    }else{
      vm.tabDescription ="Please select a file that you wan to certify and store the fingerprint to blockchain.";
    }

    $http({
                     url: '/GetDocument/'+vm.fileHash+'/'+viewerName,
                     method: "GET"


                }).then(function (resp) { //upload function returns a promise
                      vm.document = {};
                      if(resp.data ===""){
                        show_message("Data not found", 'danger');
                      } else if (resp.data.error_code ===1){
                        show_message(resp.data.err_desc, 'danger');
                      }else{
                        show_message("File  retrived successfully", 'success');
                        vm.document = resp.data;
                      }

                    })
            };


   vm.setActiveTab=function(tabId){
    vm.activeTab = tabId;
     vm.fileHash ='';
    $('#explain').html('');
    $('.bar').width(0+'%');
    if (tabId ===1){
        vm.fileHash ='';
        vm.fileDescription = '';
        vm.fileDocVerifier ='';
        vm.file ='';
        vm.tabDescription ="Please select a file that you wan to certify and store the fingerprint to blockchain.";

    } else{
        vm.document ={};
        if(tabId ===2 ){
          vm.tabDescription ="Please select a file so that a  fingerprint can be generated to be used to find the certified record which is stored in blockchain.";
        }else{
           vm.tabDescription ="Please select a file which you want to find out the certified owner and the integrity of the file you selected here";
        }
    }
   }

}]);
