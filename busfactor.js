
busfactor = {
    
    loadLog: function(/*String*/ url) {
        $.get(url, function (data) {
            var logs = bflog.parseLog(data);
          
            var files = {};
          
            for (var i = logs.length - 1; i >= 0; i--) {
                for (var j = 0; j < logs[i].files.length; j++) {
                    var fileName = logs[i].files[j].name;
                    if (!files[fileName]) {
                        var file = {};
                        file.committers = {};
                      
                        files[fileName] = file;
                        file.name = fileName;
                    }
                    
                    if (logs[i].files[j].action === bflog.DELETE) {
                        // Then this file was deleted and we don't care about it
                        delete files[fileName];
                    } else {
                        busfactor.incrementCommitter(files[fileName], logs[i].author);
                    }
                }
            }
            
            _.each(files, function(file) {
                console.log('The file (' + file.name + ') was edited by');
                _.each(file.committers, function(committer) {
                    console.log('    ' + committer.author + ' ' + committer.count + ' time(s)');
                });
            });
        });
    },
    
    incrementCommitter: function(/*Object*/ file, /*String*/ committerName) {
        var committer = file.committers[committerName];
        if (!committer) {
            committer = {};
            committer.author = committerName;
            committer.count = 0;
            file.committers[committerName] = committer;

        }
        
        committer.count = committer.count + 1;
    }
    
};

jQuery(document).ready(function() {
    busfactor.loadLog('sample/hbo.log');
    
});