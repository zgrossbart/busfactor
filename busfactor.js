var busfactor = {
    
    loadLog: function(/*String*/ url) {
        $.get(url, function (data) {
            var logs = bflog.parseLog(data);
          
            var files = {};
            var sortedFiles = [];
          
            for (var i = logs.length - 1; i >= 0; i--) {
                for (var j = 0; j < logs[i].files.length; j++) {
                    var fileName = logs[i].files[j].name;
                    if (fileName.indexOf('README.md') === 0) {
                        // We don't care about the README.md file
                        continue;
                    }
                    
                    if (!files[fileName]) {
                        var file = {};
                        file.committers = {};
                      
                        files[fileName] = file;
                        file.name = fileName;
                        file.commitCount = 0;
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
                console.log('The file (' + file.name + ') was edited ' + file.commitCount + ' time(s) by');
                _.each(file.committers, function(committer) {
                    console.log('    ' + committer.author + ' ' + committer.count + ' time(s)');
                });
            }*/

        });
    },
    
    drawFiles: function(/*Map*/ files, /*Array*/ sortedFiles) {
        var height = $('#busGraph').height() - 20;
        var width = $('#busGraph').width();
        var max = Object.keys(files[sortedFiles[0]].committers).length;
        var min = Object.keys(files[sortedFiles[sortedFiles.length - 1]].committers).length;
        var bump = Math.floor(height / ((max - min) + 1));
        
        // We need to find the maximum and minumum number of commits for
        // the files we're dealing with.  We do that by sorting the files
        // by the number of committers.
        
        var filesByCommitNum = sortedFiles.slice();
        filesByCommitNum = _.sortBy(filesByCommitNum, function(fileName) {
            return files[fileName].commitCount;
        });
        var maxCommitters = files[filesByCommitNum[filesByCommitNum.length - 1]].commitCount;
        var minCommitters = files[filesByCommitNum[0]].commitCount;
        var commitBump = Math.floor(width / ((maxCommitters - minCommitters)));
        
        console.log('height: ' + height);
        console.log('width: ' + width);
        console.log('max: ' + max);
        console.log('min: ' + min);
        console.log('bump: ' + bump);
        console.log('maxCommitters: ' + maxCommitters);
        console.log('minCommitters: ' + minCommitters);
        console.log('commitBump: ' + commitBump);
        
        
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
            countLabel.css('top', ((height - ((i) * bump)) + 5) + 'px');
            countLabel.css('left', 10 + 'px');
            $('#busGraph').append(countLabel);
        }
        
        // Now we'll draw the commit counts at the bottom
        for (var j = minCommitters; j <= maxCommitters; j += Math.floor(maxCommitters / 4)) {
            busfactor.addCommitterLabel((((j - minCommitters) * commitBump)), height, j, height);
        }
        console.log('j: ' + j);
        if (j > maxCommitters) {
            busfactor.addCommitterLabel((((maxCommitters - minCommitters) * commitBump)), height, maxCommitters, height);
        }
        
        // Now we'll add the files
        _.each(sortedFiles, function(fileName) {
            var file = files[fileName];
            
            var fileLabel = $('<div class="busGraphItem">' + fileName + '</div>');
            var r = busfactor.getRandomArbitrary(0, bump - (bump / 3));
            fileLabel.css('top', (((height - (((Object.keys(file.committers).length - 1) * bump))) - bump) + r) + 'px');
            fileLabel.css('left', (((file.commitCount) - minCommitters) * commitBump) + 'px');
            $('#busGraph').append(fileLabel);
        });
        
        
    },
    
    addCommitterLabel: function(/*int*/ x, /*int*/ y, /*int*/ count, /*int*/ totalHeight) {
        var commitLabel = $('<div class="busGraphCommitCountLabel">' + count + '</div>');
        commitLabel.css('top', y + 'px');
        commitLabel.css('left', x + 'px');
        $('#busGraph').append(commitLabel);
        
        var commitLine = $('<div class="busGraphCommitCountLine"></div>');
        commitLine.css('top', '0px');
        commitLine.css('left', (x + (commitLabel.width() / 2)) + 'px');
        commitLine.css('height', totalHeight + 'px');
        $('#busGraph').append(commitLine);
        
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
        file.commitCount = file.commitCount + 1;
    }
    
};

jQuery(document).ready(function() {
    $('#busGraph').css('height', ($(window).height() - 50) + 'px');
    
    busfactor.loadLog('sample/hbo.log');
    
    
    
});