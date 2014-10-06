
busfactor = {
    
    loadLog: function(/*String*/ url) {
        $.get(url, function (data) {
          var logs = bflog.parseLog(data);
          
          console.log('logs.length: ' + logs.length);
        });
    }
    
};

jQuery(document).ready(function() {
    busfactor.loadLog('sample/hbo.log');
    
});