var CacheItem = (function () {
    function CacheItem() {
        this.ready = false;
        this.callbacks = [];
        this.value = null;
    }
    return CacheItem;
})();
var AadGraphContext = (function () {
    function AadGraphContext() {
        this.cache = {};
    }
    // on 404 error, return {}
    AadGraphContext.prototype.getData = function (userId, dataType, data3, data4, callback) {
        userId = userId.toLowerCase();
        dataType = dataType.toLowerCase();
        data3 = data3.toLowerCase();
        data4 = data4.toLowerCase();
        var key = userId + "/" + dataType + "/" + data3 + "/" + data4;
        if (this.cache[key] == null) {
            this.cache[key] = new CacheItem();
            var this_ = this;
            this.getDataThroughNetwork(userId, dataType, data3, data4, function (value) {
                if (this_.cache[key].ready == false) {
                    this_.cache[key].ready = true;
                    this_.cache[key].value = value;
                    var callbacks = this_.cache[key].callbacks;
                    this_.cache[key].callbacks = null;
                    for (var i = 0; i < callbacks.length; ++i) {
                        setTimeout(callbacks[i], 0);
                    }
                }
            });
        }
        if (this.cache[key].ready) {
            return this.cache[key].value;
        }
        this.cache[key].callbacks.push(callback);
        return null;
    };
    AadGraphContext.prototype.getDataThroughNetwork = function (userId, dataType, data3, data4, callback) {
        if (1) {
            console.log("getDataThroughNetwork: start");
            $.ajax({
                'url': "/getData",
                'type': 'Get',
                'data': {
                    'userId': userId,
                    'entityType': dataType,
                    'entityId': data3,
                    'entityType2': data4
                },
                'success': function (data) {
                    if (typeof data == 'string') {
                        data = JSON.parse(data);
                    }
                    if (typeof data == 'object') {
                        console.log("getDataThroughNetwork: success");
                        callback(data);
                    }
                    else {
                        alert("Wrong type of data: " + typeof data);
                        callback({});
                    }
                },
                'error': function (jqXHR, textStatus, errorThrown) {
                    if (jqXHR.status != 404) {
                        alert("Error in ajax: " + textStatus + ": " + errorThrown);
                    }
                    callback({});
                }
            });
        }
        else {
            // use test data
            var value = null;
            if (testResponses[userId] != null && testResponses[userId][dataType] != null) {
                value = testResponses[userId][dataType];
                if (data3 != "") {
                    value = {};
                }
            }
            else {
                value = {};
            }
            setTimeout(function () { callback(value); }, Math.random() * 1000);
        }
    };
    return AadGraphContext;
})();
var UserEntity = (function () {
    function UserEntity(aad, userId, json) {
        if (userId === void 0) { userId = null; }
        if (json === void 0) { json = null; }
        this.aad = aad;
        this.userId = userId;
        this.userJson = json;
        if (this.userJson != null) {
            this.userId = this.userJson.objectId;
        }
    }
    UserEntity.createUserAsync = function (aad, userName, callback) {
        var json = aad.getData(userName, "", "", "", function () {
            UserEntity.createUserAsync(aad, userName, callback);
        });
        if (json != null) {
            if (json.objectType != null) {
                var entity = new UserEntity(aad, null, json);
                setTimeout(function () { callback(entity); }, 0);
            }
        }
    };
    UserEntity.prototype.getComparisonKey = function () {
        return "UserEntity:" + this.userId.toString();
    };
    UserEntity.prototype.prepare = function (callback) {
        this.callback = callback;
        setTimeout(this.tryPrepare.bind(this), 0);
    };
    UserEntity.prototype.tryPrepare = function () {
        if (this.userJson == null) {
            this.userJson = this.aad.getData(this.userId, "", "", "", this.tryPrepare.bind(this));
        }
        if (this.managerJson == null) {
            this.managerJson = this.aad.getData(this.userId, "manager", "", "", this.tryPrepare.bind(this));
        }
        if (this.reportsJson == null) {
            this.reportsJson = this.aad.getData(this.userId, "directReports", "", "", this.tryPrepare.bind(this));
        }
        if (this.userJson == null) {
            return;
        }
        if (this.managerJson == null) {
            return;
        }
        if (this.reportsJson == null) {
            return;
        }
        if (this.callback != null) {
            this.callback(this);
        }
        this.callback = null;
    };
    UserEntity.prototype.renderLabel = function () {
        var label = new Label();
        if (this.userJson.displayName != null) {
            label.text = this.userJson.displayName;
        }
        return label;
    };
    UserEntity.prototype.renderDetail = function (container) {
        var img = $('<img/>', { src: "/images/userimage.jpg", height: 128 }).appendTo(container);
        var table = $('<table/>');
        var tr;
        var td;
        if (this.userJson.objectType != null) {
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Object Type" }).appendTo(tr);
            td = $('<td/>', { text: this.userJson.objectType }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Principal Id" }).appendTo(tr);
            td = $('<td/>', { text: this.userJson.userPrincipalName }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Name" }).appendTo(tr);
            td = $('<td/>', { text: this.userJson.displayName }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Job Title" }).appendTo(tr);
            td = $('<td/>', { text: this.userJson.jobTitle }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Department" }).appendTo(tr);
            td = $('<td/>', { text: this.userJson.department }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "E-mail" }).appendTo(tr);
            td = $('<td/>', { text: this.userJson.mail }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Office" }).appendTo(tr);
            td = $('<td/>', { text: this.userJson.physicalDeliveryOfficeName }).appendTo(tr);
        }
        if (this.managerJson.objectType != null) {
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Manager" }).appendTo(tr);
            td = $('<td/>', { text: this.managerJson.displayName }).appendTo(tr);
        }
        if (this.reportsJson.value != null) {
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Direct Reports" }).appendTo(tr);
            td = $('<td/>', { text: this.reportsJson.value.length }).appendTo(tr);
        }
        table.appendTo(container);
    };
    UserEntity.prototype.getLinks = function (linkPropertiesOut) {
        var linkEntities = [];
        if (this.managerJson.objectType != null) {
            linkEntities.push(new UserEntity(this.aad, null, this.managerJson));
            linkPropertiesOut.push(new LinkProperty("Reports To", "", 0.3, 0.1));
        }
        if (this.reportsJson.value != null) {
            for (var i = 0; i < this.reportsJson.value.length; ++i) {
                linkEntities.push(new UserEntity(this.aad, null, this.reportsJson.value[i]));
                linkPropertiesOut.push(new LinkProperty("", "", 0.1, 0.1));
            }
        }
        if (this.userJson.objectType != null) {
            linkEntities.push(new UserGroupsEntity(this.aad, this.userJson));
            linkPropertiesOut.push(new LinkProperty("Groups", "#66AA66", 0.03, 0.03));
            linkEntities.push(new UserFilesEntity(this.aad, this.userJson));
            linkPropertiesOut.push(new LinkProperty("Files", "#6677AA", 0.03, 0.03));
        }
        return linkEntities;
    };
    return UserEntity;
})();
var UserGroupsEntity = (function () {
    function UserGroupsEntity(aad, userJson) {
        this.aad = aad;
        this.userJson = userJson;
        this.userId = this.userJson.objectId;
    }
    UserGroupsEntity.prototype.getComparisonKey = function () {
        return "UserGroupsEntity:" + this.userId.toString();
    };
    UserGroupsEntity.prototype.prepare = function (callback) {
        this.callback = callback;
        setTimeout(this.tryPrepare.bind(this), 0);
    };
    UserGroupsEntity.prototype.tryPrepare = function () {
        if (this.memberOfJson == null) {
            this.memberOfJson = this.aad.getData(this.userId, "memberOf", "", "", this.tryPrepare.bind(this));
        }
        if (this.memberOfJson == null) {
            return;
        }
        if (this.callback != null) {
            this.callback(this);
        }
        this.callback = null;
    };
    UserGroupsEntity.prototype.renderLabel = function () {
        var label = new Label();
        label.text = this.userJson.givenName + "'s Groups";
        label.color = "#009900";
        return label;
    };
    UserGroupsEntity.prototype.renderDetail = function (container) {
        var img = $('<img/>', { src: "/images/groupimage.png", height: 128 }).appendTo(container);
        var table = $('<table/>');
        var tr;
        var td;
        tr = $('<tr/>').appendTo(table);
        td = $('<td/>', { text: "Name" }).appendTo(tr);
        td = $('<td/>', { text: this.userJson.displayName + "'s Groups" }).appendTo(tr);
        if (this.memberOfJson.value != null) {
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Groups" }).appendTo(tr);
            td = $('<td/>', { text: this.memberOfJson.value.length }).appendTo(tr);
        }
        table.appendTo(container);
    };
    UserGroupsEntity.prototype.getLinks = function (linkPropertiesOut) {
        var linkEntities = [];
        if (this.memberOfJson.value != null) {
            for (var i = 0; i < this.memberOfJson.value.length; ++i) {
                var groupJson = this.memberOfJson.value[i];
                if (groupJson.description == null ||
                    groupJson.displayName == null ||
                    groupJson.mailNickname == null ||
                    groupJson.displayName.toLowerCase() == groupJson.mailNickname.toLowerCase() ||
                    groupJson.securityEnabled == true) {
                    continue;
                }
                linkEntities.push(new GroupEntity(this.aad, groupJson));
                linkPropertiesOut.push(new LinkProperty("", "", 0.03, 0.3));
            }
        }
        return linkEntities;
    };
    return UserGroupsEntity;
})();
var GroupEntity = (function () {
    function GroupEntity(aad, json) {
        this.aad = aad;
        this.groupJson = json;
        this.groupId = this.groupJson.objectId;
    }
    GroupEntity.prototype.getComparisonKey = function () {
        return "GroupEntity:" + this.groupId.toString();
    };
    GroupEntity.prototype.prepare = function (callback) {
        this.callback = callback;
        setTimeout(this.tryPrepare.bind(this), 0);
    };
    GroupEntity.prototype.tryPrepare = function () {
        if (this.callback != null) {
            this.callback(this);
        }
        this.callback = null;
    };
    GroupEntity.prototype.renderLabel = function () {
        var label = new Label();
        if (this.groupJson.displayName != null) {
            label.text = this.groupJson.displayName;
        }
        label.color = "#009900";
        return label;
    };
    GroupEntity.prototype.renderDetail = function (container) {
        var img = $('<img/>', { src: "/images/groupimage.png", height: 128 }).appendTo(container);
        var table = $('<table/>');
        var tr;
        var td;
        if (this.groupJson.objectType != null) {
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Discription" }).appendTo(tr);
            td = $('<td/>', { text: this.groupJson.description }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Name" }).appendTo(tr);
            td = $('<td/>', { text: this.groupJson.displayName }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "E-mail" }).appendTo(tr);
            td = $('<td/>', { text: this.groupJson.mail }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
        }
        table.appendTo(container);
    };
    GroupEntity.prototype.getLinks = function (linkPropertiesOut) {
        return [];
    };
    return GroupEntity;
})();
var UserFilesEntity = (function () {
    function UserFilesEntity(aad, userJson) {
        this.aad = aad;
        this.userJson = userJson;
        this.userId = this.userJson.objectId;
    }
    UserFilesEntity.prototype.getComparisonKey = function () {
        return "UserFilesEntity:" + this.userId.toString();
    };
    UserFilesEntity.prototype.prepare = function (callback) {
        this.callback = callback;
        setTimeout(this.tryPrepare.bind(this), 0);
    };
    UserFilesEntity.prototype.tryPrepare = function () {
        if (this.filesJson == null) {
            this.filesJson = this.aad.getData(this.userId, "files", "", "", this.tryPrepare.bind(this));
        }
        if (this.filesJson == null) {
            return;
        }
        if (this.callback != null) {
            this.callback(this);
        }
        this.callback = null;
    };
    UserFilesEntity.prototype.renderLabel = function () {
        var label = new Label();
        label.text = this.userJson.givenName + "'s Files";
        label.color = "#003399";
        return label;
    };
    UserFilesEntity.prototype.renderDetail = function (container) {
        var img = $('<img/>', { src: "/images/folderimage.gif", height: 128 }).appendTo(container);
        var table = $('<table/>');
        var tr;
        var td;
        tr = $('<tr/>').appendTo(table);
        td = $('<td/>', { text: "Name" }).appendTo(tr);
        td = $('<td/>', { text: this.userJson.displayName + "'s Files" }).appendTo(tr);
        if (this.filesJson.value != null) {
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Items" }).appendTo(tr);
            td = $('<td/>', { text: this.filesJson.value.length }).appendTo(tr);
        }
        table.appendTo(container);
    };
    UserFilesEntity.prototype.getLinks = function (linkPropertiesOut) {
        var linkEntities = [];
        if (this.filesJson.value != null) {
            for (var i = 0; i < this.filesJson.value.length; ++i) {
                var fileJson = this.filesJson.value[i];
                linkEntities.push(new FileEntity(this.aad, null, fileJson, this.userId));
                linkPropertiesOut.push(new LinkProperty("", "", 0.01, 0.1));
            }
        }
        return linkEntities;
    };
    return UserFilesEntity;
})();
var FileEntity = (function () {
    function FileEntity(aad, fileId, fileJson, userId) {
        if (fileId === void 0) { fileId = null; }
        if (fileJson === void 0) { fileJson = null; }
        this.aad = aad;
        this.fileJson = fileJson;
        this.fileId = fileId;
        if (this.fileJson != null) {
            this.fileId = this.fileJson.id;
        }
        this.userId = userId;
    }
    FileEntity.prototype.getComparisonKey = function () {
        return "FileEntity:" + this.fileId.toString();
    };
    FileEntity.prototype.prepare = function (callback) {
        this.callback = callback;
        setTimeout(this.tryPrepare.bind(this), 0);
    };
    FileEntity.prototype.tryPrepare = function () {
        if (this.fileJson == null) {
            this.fileJson = this.aad.getData(this.userId, "files", this.fileId, "", this.tryPrepare.bind(this));
            if (this.fileJson == null) {
                return;
            }
        }
        if (this.fileJson.type == "Folder") {
            if (this.childrenJson == null) {
                this.childrenJson = this.aad.getData(this.userId, "files", this.fileId, "children", this.tryPrepare.bind(this));
            }
            if (this.childrenJson == null) {
                return;
            }
        }
        if (this.callback != null) {
            this.callback(this);
        }
        this.callback = null;
    };
    FileEntity.prototype.renderLabel = function () {
        var label = new Label();
        if (this.fileJson.name != null) {
            label.text = this.fileJson.name;
        }
        label.color = "#003399";
        return label;
    };
    FileEntity.prototype.renderDetail = function (container) {
        if (this.fileJson.type == "Folder") {
            var img = $('<img/>', { src: "/images/folderimage.gif", height: 128 }).appendTo(container);
            var table = $('<table/>');
            var tr;
            var td;
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Type" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.type }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Name" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.name }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Path" }).appendTo(tr);
            td = $('<td/>', { text: (this.fileJson.parentReference != null ? this.fileJson.parentReference.path : "") }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Children" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.childCount }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Created" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.dateTimeCreated }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Modified" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.dateTimeLastModified }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Url" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.webUrl }).appendTo(tr);
            table.appendTo(container);
        }
        else {
            var img = $('<img/>', { src: "/images/fileimage.png", height: 128 }).appendTo(container);
            var table = $('<table/>');
            var tr;
            var td;
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Type" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.type }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Name" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.name }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Path" }).appendTo(tr);
            td = $('<td/>', { text: (this.fileJson.parentReference != null ? this.fileJson.parentReference.path : "") }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Size" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.size }).appendTo(tr);
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Created" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.dateTimeCreated }).appendTo(tr);
            if (this.fileJson.createdBy != null && this.fileJson.createdBy.user != null) {
                tr = $('<tr/>').appendTo(table);
                td = $('<td/>', { text: "by" }).appendTo(tr);
                td = $('<td/>', { text: this.fileJson.createdBy.user.displayName }).appendTo(tr);
            }
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Modified" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.dateTimeLastModified }).appendTo(tr);
            if (this.fileJson.lastModifiedBy != null && this.fileJson.lastModifiedBy.user != null) {
                tr = $('<tr/>').appendTo(table);
                td = $('<td/>', { text: "by" }).appendTo(tr);
                td = $('<td/>', { text: this.fileJson.lastModifiedBy.user.displayName }).appendTo(tr);
            }
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { text: "Url" }).appendTo(tr);
            td = $('<td/>', { text: this.fileJson.webUrl }).appendTo(tr);
            table.appendTo(container);
        }
    };
    FileEntity.prototype.getLinks = function (linkPropertiesOut) {
        var linkEntities = [];
        if (this.fileJson.parentReference != null && this.fileJson.parentReference.path != "/") {
            linkEntities.push(new FileEntity(this.aad, this.fileJson.parentReference.id, null, this.userId));
            linkPropertiesOut.push(new LinkProperty("Parent", "#6677AA", 1.0, 0.1));
        }
        if (this.fileJson.type == "Folder" && this.childrenJson.value != null) {
            for (var i = 0; i < this.childrenJson.value.length; ++i) {
                var fileJson = this.childrenJson.value[i];
                linkEntities.push(new FileEntity(this.aad, null, fileJson, this.userId));
                linkPropertiesOut.push(new LinkProperty("", "", 0.1, 0.1));
            }
        }
        if (this.fileJson.type != "Folder") {
            if (this.fileJson.createdBy != null && this.fileJson.createdBy.user != null) {
                linkEntities.push(new ByUserEntity(this.aad, "Created", this.fileJson.createdBy.user.id, this.fileJson.createdBy.user.displayName));
                linkPropertiesOut.push(new LinkProperty("properties", "#AA7777", 0.01, 0.01));
            }
            if (this.fileJson.lastModifiedBy != null && this.fileJson.lastModifiedBy.user != null) {
                linkEntities.push(new ByUserEntity(this.aad, "Last Modified", this.fileJson.lastModifiedBy.user.id, this.fileJson.lastModifiedBy.user.displayName));
                linkPropertiesOut.push(new LinkProperty("properties", "#AA7777", 0.01, 0.01));
            }
        }
        return linkEntities;
    };
    return FileEntity;
})();
var ByUserEntity = (function () {
    function ByUserEntity(aad, verb, userId, displayName) {
        this.aad = aad;
        this.verb = verb;
        this.userId = userId;
        this.displayName = displayName;
    }
    ByUserEntity.prototype.getComparisonKey = function () {
        return "ByUserEntity:" + this.verb + ":" + this.userId.toString();
    };
    ByUserEntity.prototype.prepare = function (callback) {
        this.callback = callback;
        setTimeout(this.tryPrepare.bind(this), 0);
    };
    ByUserEntity.prototype.tryPrepare = function () {
        if (this.callback != null) {
            this.callback(this);
        }
        this.callback = null;
    };
    ByUserEntity.prototype.renderLabel = function () {
        var label = new Label();
        label.text = this.verb + " by " + this.displayName;
        label.color = "#993333";
        return label;
    };
    ByUserEntity.prototype.renderDetail = function (container) {
        var img = $('<img/>', { src: "/images/folderimage.gif", height: 128 }).appendTo(container);
        var table = $('<table/>');
        var tr;
        var td;
        tr = $('<tr/>').appendTo(table);
        td = $('<td/>', { text: "Name" }).appendTo(tr);
        td = $('<td/>', { text: "Files " + this.verb + " by " + this.displayName }).appendTo(tr);
        table.appendTo(container);
    };
    ByUserEntity.prototype.getLinks = function (linkPropertiesOut) {
        var linkEntities = [];
        linkEntities.push(new UserEntity(this.aad, this.userId, null));
        linkPropertiesOut.push(new LinkProperty("", "#AA7777", 0.03, 0.03));
        return linkEntities;
    };
    return ByUserEntity;
})();
var LinkProperty = (function () {
    function LinkProperty(label, color, factor, inverseFactor) {
        if (label === void 0) { label = null; }
        if (color === void 0) { color = null; }
        if (factor === void 0) { factor = 0.1; }
        if (inverseFactor === void 0) { inverseFactor = 0.1; }
        this.label = label;
        this.color = color;
        this.factor = factor;
        this.inverseFactor = inverseFactor;
    }
    return LinkProperty;
})();
var Label = (function () {
    function Label() {
        this.text = "<label>";
        this.color = "#000000";
        this.background = "#FFFFFF";
    }
    ;
    return Label;
})();
var testGraphData = [
    [],
    [2, 3, 4],
    [1, 3, 4],
    [1, 2, 4],
    [1, 2, 3, 5, 6],
    [],
    [7, 8],
    [6],
    [6, 9, 10],
    [8, 10],
    [8, 9]
];
var TestEntity = (function () {
    function TestEntity(id) {
        if (id === void 0) { id = 1; }
        this.id = id;
    }
    TestEntity.prototype.getComparisonKey = function () {
        return "TestEntity:" + this.id.toString();
    };
    TestEntity.prototype.prepare = function (callback) {
        setTimeout((function (this_, callback_) {
            return function () {
                this_.neighbors = testGraphData[this_.id];
                callback_(this_);
            };
        })(this, callback), Math.random() * 1000);
    };
    TestEntity.prototype.renderLabel = function () {
        var label = new Label();
        label.text = "Test Entity #" + this.id.toString();
        return label;
    };
    TestEntity.prototype.renderDetail = function (container) {
        var e;
        e = $('<p/>');
        e.text("Label - " + this.renderLabel().text);
        e.appendTo(container);
        e = $('<p/>');
        e.text("Number of Outgoing Links - " + this.neighbors.length.toString());
        e.appendTo(container);
    };
    TestEntity.prototype.getLinks = function (linkPropertiesOut) {
        var linkEntities = [];
        for (var i = 0, count = this.neighbors.length; i < count; ++i) {
            var neighborId = this.neighbors[i];
            linkEntities.push(new TestEntity(neighborId));
            var property = new LinkProperty();
            if (this.id == 4) {
                property.label = "link from 4 to " + neighborId;
            }
            linkPropertiesOut.push(property);
        }
        return linkEntities;
    };
    return TestEntity;
})();
var GraphView = (function () {
    function GraphView(graphContainer, detailContainer, boardContainer) {
        this.threshold = 0.023;
        this.entities = {};
        this.preparedEntities = {};
        this.readyEntities = {};
        this.links = {};
        this.inverseLinks = {};
        this.focus = "";
        this.currentDetail = null;
        this.activeNodes = {};
        this.activeEdges = {};
        this.updateGraphTimer = null;
        this.pinnedKeys = [];
        this.pinnedStatus = [];
        this.graphContainer = graphContainer;
        this.detailContainer = detailContainer;
        this.boardContainer = boardContainer;
        this.graphContainer.innerHTML = "";
        this.detailContainer.innerHTML = "";
        this.boardContainer.innerHTML = "";
        this.springy_graph = new Springy.Graph();
        var canvas = $('<canvas/>', { width: '1000' }).attr({ width: 1280, height: 960 });
        canvas.appendTo(this.graphContainer);
        canvas.springy({
            graph: this.springy_graph,
            nodeSelected: (function (this_) {
                return function (node) {
                    this_.onEntitySelected(node.data.entity);
                };
            })(this),
            nodeHovered: (function (this_) {
                return function (node) {
                    this_.onEntityHovered(node == null ? node : node.data.entity);
                };
            })(this)
        });
        this.updateGraphNow();
    }
    GraphView.prototype.onEntityReady = function (entity) {
        var key = entity.getComparisonKey();
        this.readyEntities[key] = entity;
        var linkProperties = [];
        var linkEntities = entity.getLinks(linkProperties);
        for (var i = 0; i < linkEntities.length; ++i) {
            var key2 = linkEntities[i].getComparisonKey();
            if (key2 == key) {
                continue;
            }
            if (this.entities[key2] == null) {
                this.entities[key2] = linkEntities[i];
            }
            var entity2 = this.entities[key2];
            if (this.links[key] == null) {
                this.links[key] = {};
            }
            this.links[key][key2] = linkProperties[i];
            if (this.inverseLinks[key2] == null) {
                this.inverseLinks[key2] = {};
            }
            this.inverseLinks[key2][key] = linkProperties[i];
        }
        this.updateGraph();
    };
    GraphView.prototype.onEntityHovered = function (entity) {
        this.detailContainer.innerHTML = "";
        if (entity != null) {
            entity.renderDetail(this.detailContainer);
            this.currentDetail = entity.getComparisonKey();
        }
        else {
            if (this.entities[this.focus]) {
                this.entities[this.focus].renderDetail(this.detailContainer);
                this.currentDetail = this.focus;
            }
        }
    };
    GraphView.prototype.onEntitySelected = function (entity) {
        entity.renderDetail(this.detailContainer);
        this.currentDetail = entity.getComparisonKey();
        this.switchToEntity(entity);
    };
    GraphView.prototype.onEntityDoubleClicked = function (entity) {
    };
    GraphView.prototype.switchToEntity = function (entity) {
        var key = entity.getComparisonKey();
        if (this.entities[key] == null) {
            this.entities[key] = entity;
        }
        this.focus = key;
        this.currentDetail = key;
        this.updateGraphNow();
    };
    GraphView.prototype.computeActiveEntities = function (nearestNodeOut, factorsOut) {
        var newActiveEntities = {};
        var queue = [];
        var initialKeys = {};
        for (var key in this.activeNodes) {
            nearestNodeOut[key] = this.activeNodes[key];
        }
        if (this.entities[this.focus] != null) {
            initialKeys[this.focus] = true;
        }
        for (var i = 0; i < this.pinnedKeys.length; ++i) {
            if (this.pinnedStatus[i] && this.entities[this.pinnedKeys[i]] != null) {
                initialKeys[this.pinnedKeys[i]] = true;
            }
        }
        for (var key in initialKeys) {
            newActiveEntities[key] = this.entities[key];
            factorsOut[key] = 1.0;
            queue.push(key);
        }
        for (var queuehead = 0; queuehead < queue.length; ++queuehead) {
            var key = queue[queuehead];
            var factor = factorsOut[key];
            for (var key2 in this.links[key]) {
                if (nearestNodeOut[key2] == null) {
                    nearestNodeOut[key2] = nearestNodeOut[key];
                }
                var link = this.links[key][key2];
                var factor2 = factor * link.factor;
                if (initialKeys[key] == null && factor2 < this.threshold) {
                    continue;
                }
                if (factorsOut[key2] != null && factor2 <= factorsOut[key2]) {
                    continue;
                }
                newActiveEntities[key2] = this.entities[key2];
                factorsOut[key2] = factor2;
                queue.push(key2);
            }
            for (var key2 in this.inverseLinks[key]) {
                if (nearestNodeOut[key2] == null) {
                    nearestNodeOut[key2] = nearestNodeOut[key];
                }
                var link = this.inverseLinks[key][key2];
                var factor2 = factor * link.inverseFactor;
                if (initialKeys[key] == null && factor2 < this.threshold) {
                    continue;
                }
                if (factorsOut[key2] != null && factor2 <= factorsOut[key2]) {
                    continue;
                }
                newActiveEntities[key2] = this.entities[key2];
                factorsOut[key2] = factor2;
                queue.push(key2);
            }
        }
        return newActiveEntities;
    };
    GraphView.prototype.updateGraphNow = function () {
        // find new nodes
        var nearestNode = {};
        var factors = {}; // [key: string]: number
        var newActiveEntities = this.computeActiveEntities(nearestNode, factors);
        var newActiveNodes = {};
        for (var key in newActiveEntities) {
            var entity = newActiveEntities[key];
            if (this.preparedEntities[key] == null) {
                this.preparedEntities[key] = entity;
                entity.prepare(this.onEntityReady.bind(this));
            }
            if (this.readyEntities[key] == null) {
                continue;
            }
            if (this.activeNodes[key] != null) {
                newActiveNodes[key] = this.activeNodes[key];
            }
            else {
                var label = entity.renderLabel();
                newActiveNodes[key] = this.springy_graph.newNode({
                    label: label.text,
                    color: label.color,
                    background: label.background,
                    //image: { src: "https://www.bing.com/favicon.ico" },
                    entity: entity,
                    ondoubleclick: (function (this_, entity_) {
                        return function () {
                            this_.onEntityDoubleClicked(entity_);
                        };
                    })(this, entity),
                    mass: 30.0,
                    initialmass: 3.0,
                    initialmasstime: 1500,
                    basenode: nearestNode[key]
                });
            }
        }
        // highlight some of the nodes
        for (var key in newActiveNodes) {
            var node = newActiveNodes[key];
            if (node.data.originalcolor != null) {
                node.data.color = node.data.originalcolor;
                node.data.originalcolor = null;
            }
        }
        for (var key in newActiveNodes) {
            var node = newActiveNodes[key];
            var incoming = 0;
            for (var key2 in this.inverseLinks[key]) {
                if (newActiveNodes[key2] != null) {
                    incoming += 1;
                }
            }
            if (incoming >= 2 && node.data.color == "#009900") {
                node.data.originalcolor = node.data.color;
                node.data.color = "#00FFFF";
            }
        }
        // remove nodes
        for (var key in this.activeNodes) {
            if (newActiveNodes[key] == null) {
                this.springy_graph.removeNode(this.activeNodes[key]);
            }
        }
        // find new edges
        var newActiveEdges = {};
        for (var key in newActiveNodes) {
            var node = newActiveNodes[key];
            if (node == null) {
                continue;
            }
            if (newActiveEdges[key] == null) {
                newActiveEdges[key] = {};
            }
            for (var key2 in this.links[key]) {
                var node2 = newActiveNodes[key2];
                if (node2 == null) {
                    continue;
                }
                if (this.links[key2] != null && this.links[key2][key] != null) {
                    // there are two links with opposite directions
                    if (factors[key] < factors[key2]) {
                        continue;
                    }
                }
                if (this.activeEdges[key] != null && this.activeEdges[key][key2] != null) {
                    newActiveEdges[key][key2] = this.activeEdges[key][key2];
                }
                else {
                    var property = this.links[key][key2];
                    newActiveEdges[key][key2] = this.springy_graph.newEdge(node, node2, {
                        label: property.label || undefined,
                        color: property.color || "#808080"
                    });
                }
            }
        }
        // remove edges
        for (var key in this.activeEdges) {
            if (newActiveNodes[key] == null) {
                continue; // already removed; don't remove twice
            }
            for (var key2 in this.activeEdges[key]) {
                if (newActiveNodes[key2] == null) {
                    continue; // already removed; don't remove twice
                }
                if (newActiveEdges[key] != null && newActiveEdges[key][key2] != null) {
                    continue;
                }
                this.springy_graph.removeEdge(this.activeEdges[key][key2]);
            }
        }
        this.activeNodes = newActiveNodes;
        this.activeEdges = newActiveEdges;
        if (this.currentDetail != null && this.readyEntities[this.currentDetail] != null) {
            this.detailContainer.innerHTML = "";
            this.readyEntities[this.currentDetail].renderDetail(this.detailContainer);
        }
        // update the pin board
        this.boardContainer.innerHTML = "";
        var table = $('<table/>', { 'table-layout': 'fixed', width: '160px' });
        $('<col/>').attr({ width: '16px' }).appendTo(table);
        $('<col/>').attr({}).appendTo(table);
        $('<col/>').attr({ width: '16px' }).appendTo(table);
        var tr;
        var td;
        var img;
        var this_ = this;
        for (var i = this.pinnedKeys.length - 1; i > -1; --i) {
            tr = $('<tr/>').appendTo(table);
            td = $('<td/>', { height: '16px' }).appendTo(tr);
            td.click((function (i_) {
                return function () { this_.togglePin(i_); };
            })(i));
            img = $('<img/>', { width: '16px', src: '/images/check.png' }).appendTo(td);
            if (!this.pinnedStatus[i]) {
                img.hide();
            }
            td = $('<td/>', { overflow: 'hidden' }).appendTo(tr);
            if (this.readyEntities[this.pinnedKeys[i]] != null) {
                var label = this.readyEntities[this.pinnedKeys[i]].renderLabel();
                td.text(label.text);
                td.css('color', label.color);
            }
            else {
                td.text(this.pinnedKeys[i]);
            }
            td.click((function (i_) {
                return function () { this_.switchToPin(i_); };
            })(i));
            if (this.pinnedStatus[i]) {
                td.css('background-color', "#FFFFE0");
            }
            td = $('<td/>').appendTo(tr);
            img = $('<img/>', { width: '16px', src: '/images/remove.png' }).appendTo(td);
            img.click((function (i_) {
                return function () { this_.removePin(i_); };
            })(i));
        }
        tr = $('<tr/>').appendTo(table);
        td = $('<td/>', { height: '16px' }).appendTo(tr);
        td.click(function () { this_.addPin(); });
        img = $('<img/>', { width: '16px', src: '/images/add.png' }).appendTo(td);
        td = $('<td/>', { overflow: 'hidden' }).appendTo(tr);
        if (this.readyEntities[this.focus] != null) {
            var label = this.readyEntities[this.focus].renderLabel();
            td.text(label.text);
            td.css('color', label.color);
        }
        else {
            td.text(this.focus);
        }
        if (this.focus != "") {
            td.css('background-color', "#FFFFE0");
        }
        td = $('<td/>').appendTo(tr);
        img = $('<img/>', { width: '16px', src: '/images/remove.png' }).appendTo(td);
        img.click(function () { this_.removeFocus(); });
        table.appendTo(this.boardContainer);
    };
    GraphView.prototype.addPin = function () {
        if (this.focus == "") {
            return;
        }
        this.pinnedKeys.splice(0, 0, this.focus);
        this.pinnedStatus.splice(0, 0, true);
        this.focus = "";
        this.updateGraphNow();
    };
    GraphView.prototype.removeFocus = function () {
        if (this.pinnedKeys.length == 0) {
            return;
        }
        this.focus = "";
        this.updateGraphNow();
    };
    GraphView.prototype.togglePin = function (index) {
        if (0 <= index && index < this.pinnedKeys.length) {
            this.pinnedStatus[index] = !this.pinnedStatus[index];
            this.updateGraphNow();
        }
    };
    GraphView.prototype.switchToPin = function (index) {
        if (0 <= index && index < this.pinnedKeys.length) {
            var entity = this.entities[this.pinnedKeys[index]];
            if (entity != null) {
                this.switchToEntity(entity);
            }
        }
    };
    GraphView.prototype.removePin = function (index) {
        if (0 <= index && index < this.pinnedKeys.length) {
            if (this.pinnedKeys.length == 1 && this.focus == "") {
                this.focus = this.pinnedKeys[0];
            }
            this.pinnedKeys.splice(index, 1);
            this.pinnedStatus.splice(index, 1);
            this.updateGraphNow();
        }
    };
    GraphView.prototype.updateGraph = function () {
        if (this.updateGraphTimer == null) {
            this.updateGraphTimer = setTimeout(this.onUpdateGraphTimerFired.bind(this), 100);
        }
    };
    GraphView.prototype.onUpdateGraphTimerFired = function () {
        this.updateGraphTimer = null;
        this.updateGraphNow();
    };
    return GraphView;
})();
