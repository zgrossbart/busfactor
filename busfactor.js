/*******************************************************************************
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 ******************************************************************************/

/**
 * This is our main class.  The busfactor is the first graph, but I may add more in the future
 */
var busfactor = {
    // We're not interested in files with more than 20 authors and we can
    // make the graph run faster by ignoring them.
    authorMax: 20,
    
    // This is the array of files we are graphing.
    files: null,
    
    // The one month date helps us handle date formating since we show recent
    // dates as a string like "a week ago" and older dates as the formatted date.
    oneMonthAgo: moment().subtract(1, 'months'),
    
    /**
     * This function handles loading the log and showing the graph data.
     *
     * @param the data of the log file as a raw string
     */
    loadLog: function(/*String*/ data) {
        $('#inprogress').show();
        
        $('#logErrCont').hide();
        $('#busGraphCont').show();
        $('#busGraph').css('height', ($(window).height() - 100) + 'px');
        $('#busGraphCont').css('height', ($(window).height() - 50) + 'px');
        
        var logs = null;
        
        try {
            // The first step is to parse the log file.
            logs = bflog.parseLog(data);
        } catch (e) {
            $('#logPicker').hide();
            $('#logErrCont').show();
            $('#logError').text(e);
            $('#inprogress').hide();
            $('#busGraphCont').hide();
            return;
        }
        
        $('#logPicker').hide();
      
        var files = {};
        busfactor.files = files;
        var sortedFiles = [];
      
        // Now we need to sort through the log file and create data based on files and the
        // changes which have happened to those files.
        for (var i = logs.length - 1; i >= 0; i--) {
            for (var j = 0; j < logs[i].files.length; j++) {
                var fileName = logs[i].files[j].name;
                if (fileName.indexOf('README.md') === 0) {
                    // We don't care about the README.md file since it normally
                    // has a very low bus factor, but that isn't a problem.
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
                    // Then this file was deleted and we don't care about showing
                    // it in the graph
                    delete files[fileName];
                    busfactor.removeFromArray(sortedFiles, fileName);
                } else {
                    busfactor.addDate(files[fileName], logs[i].date);
                    busfactor.addToArray(sortedFiles, fileName);
                    busfactor.incrementCommitter(files[fileName], logs[i].author);
                }
            }
        }

        // We want to sort the files by the number of different committers
        sortedFiles = _.sortBy(sortedFiles, function(fileName) {
            
            return Object.keys(files[fileName].committers).length;
        });
        
        sortedFiles.reverse();
        
        // Now we want to take out any files with more committers than we care about
        sortedFiles = _.filter(sortedFiles, function(fileName) {
            return Object.keys(files[fileName].committers).length <= busfactor.authorMax;
        });
        
        busfactor.drawFiles(files, sortedFiles);
        
        $('#inprogress').hide();
        
/*            for (var i = 0; i < sortedFiles.length; i++) {
            var file = files[sortedFiles[i]];
            console.log('The file (' + file.name + ') was edited ' + file.commitCount + ' time(s) by');
            _.each(file.committers, function(committer) {
                console.log('    ' + committer.author + ' ' + committer.count + ' time(s)');
            });
        }*/
        
        $('html, body').animate({ 
               scrollTop: $('#busGraphCont').offset().top - 30
           }, 
           1400, 
           'easeOutQuint'
        );
        
    },
    
    /**
     * Show the progress of the log graph
     */
    showProgress: function() {
        $('#logPicker').hide();
        $('#inprogress').show();
    },
    
    /**
     * Hide the progress of the log graph
     */
    hideProgress: function() {
        busfactor.inProgress = false;
    },
    
    /**
     * This function draws the files in the logging graph
     *
     * @param files the map of file objects
     * @param sortedFiles an array of the files names sorted by the number of committers
     */
    drawFiles: function(/*Map*/ files, /*Array*/ sortedFiles) {
        var height = $('#busGraph').height() - 20;
        var width = $('#busGraph').width();
        var max = Math.min(Object.keys(files[sortedFiles[0]].committers).length, busfactor.authorMax);
        var min = Object.keys(files[sortedFiles[sortedFiles.length - 1]].committers).length;
        var bump = Math.floor(height / ((max - min) + 1));
        
        // We need to find the maximum and minumum number of commits for
        // the files we're dealing with.  We do that by sorting the files
        // by the number of committers.
        
        var filesByCommitNum = sortedFiles.slice();
        filesByCommitNum = _.sortBy(filesByCommitNum, function(fileName) {
            return files[fileName].commitCount;
        });
        var maxCommits = files[filesByCommitNum[filesByCommitNum.length - 1]].commitCount;
        
        var minCommits = files[filesByCommitNum[0]].commitCount;
        var commitBump = width / (maxCommits - minCommits);
        
/*        console.log('height: ' + height);
        console.log('width: ' + width);
        console.log('max: ' + max);
        console.log('min: ' + min);
        console.log('bump: ' + bump);
        console.log('maxCommits: ' + maxCommits);
        console.log('minCommits: ' + minCommits);
        console.log('commitBump: ' + commitBump);
        */
        
        
        // We'll start by drawing the counts at the side of the graph
        for (var i = min; i <= max; i++) {
            
            var countStripe = $('<div class="busGraphStripe"></div>');
            countStripe.css('top', (height - ((i) * bump)) + 'px');
            countStripe.css('left', '0px');
            countStripe.css('width', width + 'px');
            countStripe.css('height', bump + 'px');
            countStripe.attr('count', i);
            
            if (i % 2 === 0) {
                countStripe.addClass('even');
            } else {
                countStripe.addClass('odd');
            }
            $('#busGraph').append(countStripe);
            
            var countLabel = $('<div class="busGraphLabel">' + i + '</div>');
            countLabel.css('top', ((height - ((i) * bump)) + 3) + 'px');
            countLabel.css('left', 5 + 'px');
            $('#busGraph').append(countLabel);
        }
        
        // Now we'll draw the commit counts at the bottom
        for (var j = minCommits; j <= maxCommits; j += Math.floor(maxCommits / 8)) {
            busfactor.addCommitLabel((((j - minCommits) * commitBump)), height, j, height);
        }

/*        if (j > maxCommits) {
            busfactor.addCommitLabel((((maxCommits - minCommits) * commitBump)), height, maxCommits, height);
        }
*/
        
        // Now we'll add the files
        _.each(sortedFiles, function(fileName) {
            var file = files[fileName];
            
            var fileLabel = $('<div class="busGraphItem" title="' + fileName + '"></div>');
            var r = busfactor.getRandomArbitrary(0, bump - (bump / 3));
            fileLabel.css('top', (((height - (((Object.keys(file.committers).length - 1) * bump))) - bump) + r) + 'px');
            fileLabel.css('left', (((file.commitCount) - minCommits) * commitBump) + 'px');
            $('#busGraph').append(fileLabel);
        });
        
        
    },
    

    /**
     * Draw the committer label.  These labels show the number of total commits in a file
     * and goes along the bottom of the graph
     *
     * @param x the X coordinate of the label
     * @param y the Y coordinate of the label
     * @param count the number to show in the label
     * @param totalHeight the total height of graph to draw the vertical line above the label
     */    
    addCommitLabel: function(/*int*/ x, /*int*/ y, /*int*/ count, /*int*/ totalHeight) {
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
    
    /**
     * This function adds a date to the file object if it is
     * before the first date or after the last date.  Any dates
     * in the middle are ignored.
     * 
     * @param file the file object to add the dates to
     * @param date the date to add
     */
    addDate: function(/*Object*/ file, /*Date*/ date) {
        if (!file.startDate) {
            file.startDate = date;
            file.endDate = date;
        } else if (date.isBefore(file.startDate)) {
            file.startDate = date;
        } else if (date.isAfter(file.endDate)) {
            file.endDate = date;
        }
    },
    
    /**
     * Just a helper function to get a random number within a range.
     * We space the dots out in the graph using random spacing.
     * 
     * @param min the minimum of the range
     * @param max the maximum of the range
     */
    getRandomArbitrary: function(/*int*/ min, /*int*/ max) {
        return Math.random() * (max - min) + min;
    },
    
    /**
     * A helper routine which adds a file to an array if it isn't there already.
     * 
     * @param files the array of files
     * @param fileName the file to add
     */
    addToArray: function(/*Array*/ files, /*String*/ fileName) {
        if (_.indexOf(files, fileName) > -1) {
            return;
        } else {
            files.push(fileName);
        }
        
    },
    
    /**
     * A helper routine which removes a file to an array if it isn't there already.
     * 
     * @param files the array of files
     * @param fileName the file to remove
     */
    removeFromArray: function(/*Array*/ files, /*String*/ fileName) {
        var index = _.indexOf(files, fileName);
        if (index > -1) {
            files.splice(index, 1);
        }         
    },
    
    /**
     * This utility function increments the count for a specific committer on a specific file.
     * 
     * @param file the file to add the committer to
     * @param committerName the name of the committer to add
     */
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
    },
    
    /**
     * A helper function to format dates for display in the tooltip
     * 
     * @param date the date to forma
     */
    format: function(/*Date*/ date) {
        if (date.isBefore(busfactor.oneMonthAgo)) {
            return date.format('MMMM Do YYYY');
        } else {
            return date.fromNow();
        }
    },
    
    /**
     * A helper function to escape HTML tags
     * 
     * @param string the string to escape the HTML in
     */
    escapeHTML: function(/*String*/ string) {
        var pre = document.createElement('pre');
        var text = document.createTextNode(string);
        pre.appendChild(text);
        return pre.innerHTML;
    },
    
    /**
     * This is the change handler for the file upload control on our main page
     * 
     * @param files the array of selected files
     */
    handleFiles: function(files) {
        var reader = new FileReader();
        
        reader.onload = (function(theFile) {
            return function(e) {
                busfactor.showProgress();
                $('#graphTitle').text('Bus factor for ' + theFile.name);
                setTimeout(function() {
                   busfactor.loadLog(e.target.result);
                }, 100);
            };
        })(files[0]);
        
        reader.readAsText(files[0]);
    }
};

jQuery(document).ready(function() {    

    $('#logLinks a').click(function(evt) {
        evt.preventDefault();
        var title = $(this).text();
        busfactor.showProgress();
        $.get($(this).attr('href'), function (data) {
            $('#graphTitle').text('Bus factor for ' + title);
            setTimeout(function() {
               busfactor.loadLog(data); 
            }, 100);
        });       
    });
    
    $('#pickAgain').click(function(evt) {
        evt.preventDefault();
        $('#busGraphCont').hide();
        $('#logPicker').show();
        $('#busGraph').empty();
    });
    

    $(document).tooltip({
        items: '#busGraph .busGraphItem',
        
        content: function() {
            var element = $(this);
            var file = busfactor.files[element.attr('title')];
            
            var title = element.attr('title');
            
            for (var i = title.length; i >= 0; i -= 10) {
                title = title.slice(0, i) + '&#173;' + title.slice(i, title.length);
            }
            
            var editCount = file.commitCount + ' times';
            if (file.commitCount === 1) {
                editCount = 'one time';
            }
            
            var people = Object.keys(file.committers).length + ' people';
            
            if (Object.keys(file.committers).length < 4) {
                people = '';
                var count = 0;
                var length = Object.keys(file.committers).length;
                _.each(file.committers, function(committer) {
                    if (count > 0 && count === length - 1) {
                        people += ', and ';
                    } else if (count > 0) {
                        people += ', ';
                    }
                    
                    people += committer.author.trim();
                    count++;
                });
                
            }
            
            return title + ' was edited ' + editCount + ' by ' + 
                busfactor.escapeHTML(people) + 
                ' between ' + busfactor.format(file.startDate) + 
                ' and ' + busfactor.format(file.endDate);
        },
        
        tooltipClass: 'busfactorTooltip'
        
    });
    
    
    
});