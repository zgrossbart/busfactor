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
 * This file handles all of the GIT log parsing.  It's basically a utility with a single
 * function, but I wanted to separate it into another file since it's relatively complex.
 */

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
                    // We want to filter out tags since they cause a lot of commits, but
                    // don't really count as a change.
                    logs.push(currentLog);
                }
                
            } else if (currentLog === null) {
                // This represents a parsing error.  We should always have a current
                // log entry if we aren't starting a new log.
                throw('We expected the beginning of a new log entry on line ' + (i + 1) + ' and we found: ' + line);
                
            } else if (line.indexOf(bflog.AUTHOR_START) === 0) {
                // This means we're at the Author line.  It looks like this:
                // Author: Zack Grossbart <zack@grossbart.com>
                currentLog.author = line.substring(bflog.AUTHOR_START.length, line.length).trim();
            } else if (line.indexOf(bflog.DATE_START) === 0) {
                // This means we're at the Date line.  It looks like this:
                // Date:   2014-09-17 15:10:50 -0400
                currentLog.date = moment(line.substring(bflog.DATE_START.length, line.length).trim(), 'YYYY-MM-DD HH:mm:ss Z');
            } else if (line.trim().indexOf(bflog.MODIFY_START) === 0 ||
                       line.trim().indexOf(bflog.ADD_START) === 0 ||
                       line.trim().indexOf(bflog.DELETE_START) === 0) {
                // This means we're at a modify, add, or delete line.  They look like this:
                // M	data.json
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
            } else if (line.indexOf('\t') === 0) {
                // Other lines in the log are comment lines
                currentLog.comment += line; 
            }
        }
        
        return logs;
    } 
};