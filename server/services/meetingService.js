module.exports = {

    getMeetings: function (options) {
        var moment = require('moment');
        var Meeting = require('../models/meeting');

        var showNotAnnounced = (options.showNotAnnounced === 'true');
        var showOld = (options.showOld === 'true');
        var showNew = (options.showNew === 'true');
        var filter = {};

        if (options.username !== undefined) {
            filter.username = options.username;
        }
        if (options.courseOrEvent !== undefined) {
            filter.courseOrEvent = options.courseOrEvent;
        }
        if (options.isFreetime !== undefined) {
            filter.isFreetime = (options.isFreetime === 'true');
        }

        if (showNew || showOld || showNotAnnounced) {
            filter['$or'] = [];
        }

        var currentDate;

        if (showNew) {
            currentDate = moment({ h: 0, m: 0, s: 0, ms: 0 }).toDate();
            filter.$or.push({ 'date': { '$gte': currentDate } });
        }

        if (showOld) {
            currentDate = moment({ h: 0, m: 0, s: 0, ms: 0 }).toDate();
            filter.$or.push({ 'date': { '$lt': currentDate } });
        }

        if (showNotAnnounced) {
            filter.$or.push({ 'date': null });
        }

        return new Promise(function (resolve, reject) {
            if (!showNew && !showNotAnnounced && !showOld) {
                resolve([]);
            } else {
                Meeting.find(filter).where('deleted').eq(false).sort('date').exec(function (err, meetings) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    var result = [];
                    for (var i = 0; i < meetings.length; i++) {
                        var meeting = meetings[i];
                        var add = true;
                        if (add) {
                            result.push(meeting);
                        }
                    }

                    resolve(result);
                });
            }
        });
    },

    getMeeting: function (mid) {
        return new Promise(function (resolve, reject) {
            var Meeting = require('../models/meeting');
            Meeting.findOne({ mid: mid }).where('deleted').eq(false).exec(function (err, meeting) {
                if (err) {
                    reject(err);
                    return;
                }

                if (meeting) {
                    resolve(meeting);
                }
                else {
                    reject('404');
                }
            });
        });
    },

    saveMeeting: function (request, username) {
        var Meeting = require('../models/meeting');
        var meeting = new Meeting();
        
        if (request.title !== undefined) {
            meeting.title = request.title;
        }
        if (request.shortDescription !== undefined) {
            meeting.shortDescription = request.shortDescription;
        }
        if (request.description !== undefined) {
            meeting.description = request.description;
        }
        if (request.startTime !== undefined) {
            meeting.startTime = request.startTime;
        }
        if (request.endTime !== undefined) {
            meeting.endTime = request.endTime;
        }
        if (request.location !== undefined) {
            meeting.location = request.location;
        }
        if (request.costCenter !== undefined) {
            meeting.costCenter = request.costCenter;
        }
        if (request.courseOrEvent !== undefined) {
            meeting.courseOrEvent = request.courseOrEvent;
        }
        if (request.isFreetime !== undefined) {
            meeting.isFreetime = request.isFreetime;
        }
        if (request.date !== undefined) {
            meeting.date = request.date;
        }

        meeting.username = username;

        return meeting.save();
    },

    updateMeeting: function (mid, request) {
        var Meeting = require('../models/meeting');
        
        var updateMeeting = {};
        if (request.title !== undefined) {
            updateMeeting.title = request.title;
        }
        if (request.shortDescription !== undefined) {
            updateMeeting.shortDescription = request.shortDescription;
        }
        if (request.description !== undefined) {
            updateMeeting.description = request.description;
        }
        if (request.startTime !== undefined) {
            updateMeeting.startTime = request.startTime;
        }
        if (request.endTime !== undefined) {
            updateMeeting.endTime = request.endTime;
        }
        if (request.location !== undefined) {
            updateMeeting.location = request.location;
        }
        if (request.costCenter !== undefined) {
            updateMeeting.costCenter = request.costCenter;
        }
        if (request.courseOrEvent !== undefined) {
            updateMeeting.courseOrEvent = request.courseOrEvent;
        }
        if (request.isFreetime !== undefined) {
            updateMeeting.isFreetime = request.isFreetime;
        }
        if (request.date !== undefined) {
            updateMeeting.date = request.date;
        }

        return Meeting.update({ mid: mid }, { $set: updateMeeting }, { upsert: true });
    },

    addComment: function (mid, request) {
        var Meeting = require('../models/meeting');
        var Comment = require('../models/comment');

        return this.getMeeting(mid).then(function (meeting) {

            if (meeting === null) {
                console.error('addComment: meeting is null');
                return;
            }

            if (!request.text || !request.author) {
                console.error('addComment: text or author is null');
                return;
            }

            var comment = new Comment();
            comment.text = request.text;
            comment.author = request.author;
            if (!meeting.comments) {
                meeting.comments = [];
            }
            meeting.comments.push(comment);

            return meeting.save();
        });
    },

    deleteMeeting: function (mid) {
        return new Promise(function (resolve, reject) {
            var Meeting = require('../models/meeting');

            if (mid === undefined) {
                reject('No mid specified');
            }

            Meeting.update({ mid: mid }, { $set: { deleted: true } }, { upsert: true }, function (err, meeting) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(meeting);
            });

        });
    },

    getUsersForMid: function(mid){
        var MeetingUser = require('../models/meeting_user');
        return MeetingUser.find({mid: mid}).where('deleted').eq(false).exec();
    },

    getMeetingsForUser: function(username){
        var MeetingUser = require('../models/meeting_user');
        return MeetingUser.find({username: username, tookPart: true}).where('deleted').eq(false).exec();
    },

    attendingToMeeting: function(mid, username){
        var MeetingUser = require('../models/meeting_user');

        var meeting_user = new MeetingUser();
        meeting_user.mid = mid;
        meeting_user.username = username;
        meeting_user.tookPart = false;

        return meeting_user.save();
    },

    notAttendingToMeeting: function(mid, username){
        var MeetingUser = require('../models/meeting_user');
        return MeetingUser.update({ $and: [{ mid: mid }, { username: username }, { deleted: false }] }, { $set: { deleted: true } }, { upsert: true });
    }, 

    confirmUserForMeeting: function(mid, username){
        var MeetingUser = require('../models/meeting_user');
        return MeetingUser.update({ $and: [{ mid: mid }, { username: username }, { deleted: false }] }, { $set: {tookPart: true} }, { upsert: true });
    },

    rejectUserFromMeeting: function(mid, username){
        var MeetingUser = require('../models/meeting_user');
        return MeetingUser.update({ $and: [{ mid: mid }, { username: username }, { deleted: false }] }, { $set: {tookPart: false} }, { upsert: true });
    }
}