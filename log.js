
/*global bflog:true */
var bflog = {
    ITEM_START: 'commit ',
    AUTHOR_START: 'Author: ',
    DATE_START: 'Date:   ',
    MODIFY_START: 'M\t',
    ADD_START: 'A\t',
    DELETE_START: 'D\t',
    ADD: 'A',
    MODIFY: 'M',
    DELETE: 'D',
    
    
    parseLog: function (/*String*/ data) {
        var logs = [];
        var lines = data.split(/\r\n|\n/);
        
        var currentLog = null;
        var currentComment = null;
        
        for (var i = 0;  i < lines.length; i++) {
            var line = lines[i];
            
//            console.log('line: ' + line.trim());
            
            if (line.trim().length === 0) {
                // Then it was just an empty line and we want to skip it
                continue;
            } else if (line.indexOf(bflog.ITEM_START) === 0) {
                // This means we're at the beginning of a new commit
                if (currentLog && currentComment) {
                    currentLog.comment = currentComment;
                }
                
                currentComment = null;
                currentLog = {};
                currentLog.files = [];
                currentLog.comment = '';
                if (line.indexOf(' ', bflog.ITEM_START.length) > 0) {
                    currentLog.commit = line.substring(bflog.ITEM_START.length, line.indexOf(' ', bflog.ITEM_START.length)).trim();
                } else {
                    currentLog.commit = line.substring(bflog.ITEM_START.length, line.length).trim();
                }
                
                if (line.indexOf('refs/tags/') === -1) {
                    // We want to filer out tags since they cause a lot of commits, but
                    // don't really count as a change.
                    logs.push(currentLog);
                }
                
            } else if (currentLog === null) {
                // This represnts a parsing error.  We should always have a current
                // log entry if we aren't starting a new log.
                throw('Invalid logging line.  We expected the beginning of a new log entry and we found: ' + line);
                
            } else if (line.indexOf(bflog.AUTHOR_START) === 0) {
                // This means we're at the Author line.  It looks like this:
                // Author: Zack Grossbart <zack@grossbart.com>
                currentLog.author = line.substring(bflog.AUTHOR_START.length, line.length).trim();
//                console.log('currentLog.author: ' + currentLog.author);
            } else if (line.indexOf(bflog.DATE_START) === 0) {
                // This means we're at the Date line.  It looks like this:
                // Date:   2014-09-17 15:10:50 -0400
                currentLog.date = moment(line.substring(bflog.DATE_START.length, line.length).trim(), 'YYYY-MM-DD HH:mm:ss Z');
//                console.log('currentLog.date: ' + currentLog.date.format());
            } else if (line.trim().indexOf(bflog.MODIFY_START) === 0 ||
                       line.trim().indexOf(bflog.ADD_START) === 0 ||
                       line.trim().indexOf(bflog.DELETE_START) === 0) {
                // This means we're at a modify, add, or delete line.  They look like this:
                // M	data.json
//                console.log('line: ' + line);
                var file = {};
                            
                if (line.trim().indexOf(bflog.MODIFY_START) === 0) {
                    file.action = bflog.MODIFY;
                    file.name = line.trim().substring(bflog.MODIFY_START.length, line.length).trim();
                } else if (line.trim().indexOf(bflog.ADD_START) === 0) {
                    file.action = bflog.ADD;
                    file.name = line.trim().substring(bflog.ADD_START.length, line.length).trim();
                } else if (line.trim().indexOf(bflog.DELETE_START) === 0) {
                    file.name = line.trim().substring(bflog.DELETE_START.length, line.length).trim();
                    file.action = bflog.DELETE;
                }
                
                currentLog.files.push(file);
                
//                console.log('currentLog.file: ' + currentLog.file.format());
            } else if (line.indexOf('\t') === 0) {
                // Other lines in the log are comment lines
                currentLog.comment += line; 
            }
                
        }
        
        return logs;
    } 
};