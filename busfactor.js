var busfactor = {
    
    loadLog: function(/*String*/ url) {
        $.get(url, function (data) {
            var logs = bflog.parseLog(data);
          
            var files = {};
            var sortedFiles = [];
          
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
                        busfactor.removeFromArray(sortedFiles, fileName);
                    } else {
                        busfactor.addToArray(sortedFiles, fileName);
                        busfactor.incrementCommitter(files[fileName], logs[i].author);
                    }
                }
            }

            //We want to sort the files by the number of different committers
            sortedFiles = _.sortBy(sortedFiles, function(fileName) {
                
                return Object.keys(files[fileName].committers).length;
            });
            
            sortedFiles.reverse();
            
            busfactor.drawFiles(files, sortedFiles);
            
/*            for (var i = 0; i < sortedFiles.length; i++) {
                var file = files[sortedFiles[i]];
                console.log('The file (' + file.name + ') was edited by');
                _.each(file.committers, function(committer) {
                    console.log('    ' + committer.author + ' ' + committer.count + ' time(s)');
                });
            }
*/
        });
    },
    
    drawFiles: function(/*Map*/ files, /*Array*/ sortedFiles) {
        var height = $('#busGraph').height() - 20;
        var width = $('#busGraph').width();
        var max = Object.keys(files[sortedFiles[0]].committers).length;
        var min = Object.keys(files[sortedFiles[sortedFiles.length - 1]].committers).length;
        var bump = Math.floor(height / ((max - min) + 1));
        
        console.log('height: ' + height);
        console.log('width: ' + width);
        console.log('max: ' + max);
        console.log('min: ' + min);
        console.log('bump: ' + bump);
        
        // We'll start by drawing the counts at the side of the graph
        for (var i = min; i <= max; i++) {
            
            var countStripe = $('<div class="busGraphStripe"></div>');
            countStripe.css('top', (height - ((i) * bump)) + 'px');
            countStripe.css('left', '0px');
            countStripe.css('width', width + 'px');
            countStripe.css('height', bump + 'px');
            
            if (i % 2 === 0) {
                countStripe.addClass('even');
            } else {
                countStripe.addClass('odd');
            }
            $('#busGraph').append(countStripe);
            
            var countLabel = $('<div class="busGraphLabel">' + i + '</div>');
            countLabel.css('top', (height - ((i) * bump)) + 'px');
            countLabel.css('left', (width - 10) + 'px');
            $('#busGraph').append(countLabel);
        }
        
        // Now we'll add the files
        _.each(sortedFiles, function(fileName) {
            console.log('fileName: ' + fileName);
            var file = files[fileName];
            
            var fileLabel = $('<div class="busGraphItem">' + fileName + '</div>');
            var r = busfactor.getRandomArbitrary(0, bump - (bump / 3));
            fileLabel.css('top', (((height - (((Object.keys(file.committers).length - 1) * bump))) - bump) + r) + 'px');
            fileLabel.css('left', busfactor.getRandomArbitrary(0, width - (width / 3)) + 'px');
            $('#busGraph').append(fileLabel);
        });
        
        
    },
    
    getRandomArbitrary: function(/*int*/ min, /*int*/ max) {
        return Math.random() * (max - min) + min;
    },
    
    addToArray: function(/*Array*/ files, /*String*/ fileName) {
        if (_.indexOf(files, fileName) > -1) {
            return;
        } else {
            files.push(fileName);
        }
        
    },
    
    removeFromArray: function(/*Array*/ files, /*String*/ fileName) {
        var index = _.indexOf(files, fileName);
        if (index > -1) {
            files.splice(index, 1);
        }         
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
    $('#busGraph').css('height', ($(window).height() - 50) + 'px');
    
    busfactor.loadLog('sample/hbo.log');
    
    
    
});