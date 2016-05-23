'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x9, _x10, _x11) { var _again = true; _function: while (_again) { var object = _x9, property = _x10, receiver = _x11; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x9 = parent; _x10 = property; _x11 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (global) {
    var ShareModel = (function (_Observable) {
        _inherits(ShareModel, _Observable);

        function ShareModel(pydio, node) {
            var dataModel = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

            _classCallCheck(this, ShareModel);

            _get(Object.getPrototypeOf(ShareModel.prototype), 'constructor', this).call(this);
            this._node = node;
            if (dataModel) {
                this._dataModel = dataModel;
            }
            this._status = 'idle';
            this._data = { link: {} };
            this._pendingData = {};
            this._pydio = pydio;
            if (this._node.getMetadata().get('ajxp_shared')) {
                this.load();
            }
            if (this._node.isLeaf()) {
                this._previewEditors = pydio.Registry.findEditorsForMime(this._node.getAjxpMime()).filter(function (entry) {
                    return !(entry.editorClass == "OtherEditorChooser" || entry.editorClass == "BrowserOpener");
                });
            }
        }

        _createClass(ShareModel, [{
            key: 'getNode',
            value: function getNode() {
                return this._node;
            }
        }, {
            key: 'hasActiveShares',
            value: function hasActiveShares() {
                if (this.hasPublicLink()) return true;
                var total = this.getSharedUsers().length + this.getOcsLinks().length;
                return total > 0;
            }
        }, {
            key: 'getSelectionLabel',
            value: function getSelectionLabel() {
                return this._node.getLabel();
            }
        }, {
            key: 'getStatus',
            value: function getStatus() {
                return this._status;
            }
        }, {
            key: 'currentRepoIsUserScope',
            value: function currentRepoIsUserScope() {
                var repo = this._pydio.user.getRepositoriesList().get(this._pydio.user.getActiveRepository());
                return repo.hasUserScope();
            }
        }, {
            key: 'hasPublicLink',
            value: function hasPublicLink() {
                var publicLinks = this.getPublicLinks();
                return publicLinks.length > 0;
            }
        }, {
            key: 'getPublicLink',
            value: function getPublicLink(linkId) {
                return this._data['links'][linkId]['public_link'];
            }
        }, {
            key: 'getPublicLinkHash',
            value: function getPublicLinkHash(linkId) {
                return this._data['links'][linkId]['hash'];
            }
        }, {
            key: 'publicLinkIsShorten',
            value: function publicLinkIsShorten(linkId) {
                return this._data['links'][linkId]['hash_is_shorten'];
            }
        }, {
            key: 'fileHasWriteableEditors',
            value: function fileHasWriteableEditors() {
                console.log(this._previewEditors);
                return this._previewEditors.filter(function (entry) {
                    return entry.canWrite;
                }).length > 0;
            }
        }, {
            key: 'togglePublicLink',
            value: function togglePublicLink() {
                var publicLinks = this.getPublicLinks();
                this._pendingData['enable_public_link'] = !publicLinks.length;
                if (!this._data['links']) {
                    this._data['links'] = {};
                }
                this.save();
            }
        }, {
            key: 'enablePublicLinkWithPassword',
            value: function enablePublicLinkWithPassword(mandatoryPassword) {
                this._pendingData['enable_public_link'] = true;
                this._initPendingData();
                this._pendingData['links']['ajxp_create_public_link'] = { 'password': mandatoryPassword };
                if (!this._data['links']) {
                    this._data['links'] = {};
                }
                this.save();
            }
        }, {
            key: '_initPendingData',
            value: function _initPendingData() {
                if (!this._pendingData['links']) {
                    this._pendingData['links'] = {};
                    if (this._data['links']) {
                        for (var k in this._data['links']) {
                            if (this._data['links'].hasOwnProperty(k)) {
                                this._pendingData['links'][k] = {};
                            }
                        }
                    }
                }
                if (!this._pendingData['entries']) {
                    this._pendingData['entries'] = [];
                    if (this._data['entries']) {
                        // Deep duplicate
                        this._pendingData['entries'] = JSON.parse(JSON.stringify(this._data['entries']));
                    }
                }
                if (!this._pendingData['ocs_links']) {
                    var links = {};
                    this.getOcsLinks().map(function (l) {
                        links[l.hash] = JSON.parse(JSON.stringify(l));
                    });
                    this._pendingData['ocs_links'] = links;
                }
            }
        }, {
            key: 'revertChanges',
            value: function revertChanges() {
                this._pendingData = {};
                this._setStatus('idle');
            }
        }, {
            key: 'getSharedUsers',
            value: function getSharedUsers() {
                var data = [],
                    sharedData = [];
                if (this._pendingData['entries']) {
                    data = this._pendingData['entries'];
                } else if (this._data['entries']) {
                    data = this._data['entries'];
                }
                // Skip minisite temporary user
                data.map(function (entry) {
                    if (!entry['HIDDEN']) sharedData.push(entry);
                });
                return sharedData;
            }
        }, {
            key: 'getSharedUser',
            value: function getSharedUser(userId) {
                var data = [],
                    user = null;
                if (this._pendingData['entries']) {
                    data = this._pendingData['entries'];
                } else if (this._data['entries']) {
                    data = this._data['entries'];
                }
                data.map(function (entry) {
                    if (entry['ID'] == userId) {
                        user = entry;
                    }
                });
                return user;
            }
        }, {
            key: 'getSharedUsersAsObjects',
            value: function getSharedUsersAsObjects() {
                var map = {};
                this.getSharedUsers().map(function (uData) {
                    map[uData.ID] = new PydioUsers.User(uData["ID"], uData["LABEL"], uData["TYPE"]);
                });
                return map;
            }
        }, {
            key: 'getSharedUserAsObject',
            value: function getSharedUserAsObject(userId) {
                var map = this.getSharedUsersAsObjects();
                return map[userId];
            }
        }, {
            key: 'updateSharedUser',
            value: function updateSharedUser(operation, userId, userData) {
                this._initPendingData();
                if (userData['ID']) {
                    userData['ID'] = userId;
                }
                var updatedData = [];
                if (operation == 'add') {
                    this._pendingData['entries'].push(userData);
                } else if (operation == 'remove') {
                    this._pendingData['entries'].map(function (entry) {
                        if (entry['ID'] != userId) updatedData.push(entry);
                    });
                    this._pendingData['entries'] = updatedData;
                } else if (operation == 'update') {
                    this._pendingData['entries'].map(function (entry) {
                        if (entry['ID'] != userId) updatedData.push(entry);else updatedData.push(userData);
                    });
                    this._pendingData['entries'] = updatedData;
                } else if (operation == 'update_right') {
                    // UserData is {right:'read'|'right', add:true|false}
                    this._pendingData['entries'].map(function (entry) {
                        if (entry['ID'] != userId) {
                            updatedData.push(entry);
                        } else {
                            if (userData['right'] == 'watch') {
                                entry.WATCH = userData['add'];
                            } else {
                                var crtRead = (entry.RIGHT.indexOf('r') !== -1 || userData['right'] == 'read' && userData['add']) && !(userData['right'] == 'read' && !userData['add']);
                                var crtWrite = (entry.RIGHT.indexOf('w') !== -1 || userData['right'] == 'write' && userData['add']) && !(userData['right'] == 'write' && !userData['add']);
                                if (!crtRead && !crtWrite) {
                                    crtRead = true;
                                }
                                entry.RIGHT = (crtRead ? 'r' : '') + (crtWrite ? 'w' : '');
                            }
                            updatedData.push(entry);
                        }
                    });
                    this._pendingData['entries'] = updatedData;
                } else {
                    throw new Error('Unsupported operation, should be add, update, update_right or remove');
                }
                this._setStatus('modified');
            }
        }, {
            key: '_sharedUsersToParameters',
            value: function _sharedUsersToParameters(params) {
                var entries = this.getSharedUsers();
                var index = 0;
                entries.map(function (e) {
                    params['user_' + index] = e.ID;
                    params['right_read_' + index] = e.RIGHT.indexOf('r') !== -1 ? 'true' : 'false';
                    params['right_write_' + index] = e.RIGHT.indexOf('w') !== -1 ? 'true' : 'false';
                    if (e.WATCH) {
                        params['right_watch_' + index] = 'true';
                    }
                    params['entry_type_' + index] = e.TYPE == 'group' ? 'group' : 'user';
                    index++;
                });
            }
        }, {
            key: 'saveSelectionAsTeam',
            value: function saveSelectionAsTeam(teamName) {
                var userIds = [];
                this.getSharedUsers().map(function (e) {
                    if (e.TYPE == 'user') userIds.push(e.ID);
                });
                PydioUsers.Client.saveSelectionAsTeam(teamName, userIds, function () {
                    // Flatten Team?
                });
            }

            /**********************************************/
            /* GLOBAL PARAMETERS : label, desc, notif     */
            /**********************************************/
        }, {
            key: 'getGlobal',
            value: function getGlobal(name) {
                if (this._pendingData[name] !== undefined) {
                    return this._pendingData[name];
                }
                if (name == 'watch') {
                    return this._data["element_watch"] == 'META_WATCH_BOTH';
                } else {
                    return this._data[name];
                }
            }
        }, {
            key: 'setGlobal',
            value: function setGlobal(name, value) {
                this._pendingData[name] = value;
                this._setStatus('modified');
            }
        }, {
            key: '_globalsAsParameters',
            value: function _globalsAsParameters(params) {
                params['repo_label'] = this.getGlobal("label");
                params['repo_description'] = this.getGlobal("description");
                params['self_watch_folder'] = this.getGlobal("watch") ? 'true' : 'false';
            }

            /**************************/
            /* SHARE VISIBILITY       */
            /**************************/
        }, {
            key: 'isPublic',
            value: function isPublic() {
                if (this._pendingData["scope"] !== undefined) {
                    return this._pendingData["scope"];
                }
                return this._data["share_scope"] == 'public';
            }
        }, {
            key: 'toggleVisibility',
            value: function toggleVisibility() {
                this._pendingData['scope'] = !this.isPublic();
                this._setStatus('modified');
            }
        }, {
            key: 'getShareOwner',
            value: function getShareOwner() {
                return this._data['share_owner'];
            }
        }, {
            key: 'currentIsOwner',
            value: function currentIsOwner() {
                return this._pydio.user.id == this.getShareOwner();
            }
        }, {
            key: 'setNewShareOwner',
            value: function setNewShareOwner(owner) {
                this._pendingData['new_owner'] = owner;
                this.save();
            }
        }, {
            key: '_visibilityDataToParameters',
            value: function _visibilityDataToParameters(params) {
                params['share_scope'] = this.isPublic() ? 'public' : 'private';
                if (this._pendingData['new_owner'] && this._pendingData['new_owner'] != this._data['owner']) {
                    params['transfer_owner'] = this._pendingData['new_owner'];
                }
            }

            /*****************************************/
            /*  DETECT PUBLIC LINKS VS. REMOTE LINKS
            /*****************************************/
        }, {
            key: 'getPublicLinks',
            value: function getPublicLinks() {
                if (!this._data["links"]) return [];
                var result = [];
                for (var key in this._data['links']) {
                    if (!this._data['links'].hasOwnProperty(key)) continue;
                    if (this._data['links'][key]['public_link']) {
                        result.push(this._data['links'][key]);
                    }
                }
                return result;
            }
        }, {
            key: 'getOcsLinks',
            value: function getOcsLinks() {
                if (this._pendingData["ocs_links"]) {
                    return Object.values(this._pendingData["ocs_links"]);
                }
                if (!this._data["links"]) return [];
                var key,
                    result = [];
                for (key in this._data['links']) {
                    if (!this._data['links'].hasOwnProperty(key)) continue;
                    if (!this._data['links'][key]['public_link']) {
                        result.push(this._data['links'][key]);
                    }
                }
                return result;
            }
        }, {
            key: 'getOcsLinksByStatus',
            value: function getOcsLinksByStatus() {
                return this.getOcsLinks().sort(function (a, b) {
                    if (!a.invitation || !b.invitation) return 0;
                    return b.invitation.STATUS - a.invitation.STATUS;
                });
            }
        }, {
            key: 'userEntryForLink',
            value: function userEntryForLink(linkId) {
                var linkData;
                if (this._pendingData["ocs_links"] && this._pendingData["ocs_links"][linkId]) {
                    linkData = this._pendingData["ocs_links"][linkId];
                } else {
                    for (var key in this._data['links']) {
                        if (!this._data['links'].hasOwnProperty(key)) continue;
                        if (this._data['links'][key]['hash'] == linkId) {
                            linkData = this._data['links'][key];
                        }
                    }
                }
                if (linkData && linkData['internal_user_id']) {
                    return this.getSharedUser(linkData['internal_user_id']);
                }
                return false;
            }
        }, {
            key: 'findPendingKeyForLink',
            value: function findPendingKeyForLink(linkId, key) {
                var result;
                try {
                    result = this._pendingData['links'][linkId][key];
                    return result;
                } catch (e) {
                    return null;
                }
            }

            /****************************/
            /* PUBLIC LINK PASSWORD     */
            /****************************/
        }, {
            key: 'hasHiddenPassword',
            value: function hasHiddenPassword(linkId) {
                return this._data['links'][linkId] && this._data['links'][linkId]['has_password'];
            }
        }, {
            key: 'getPassword',
            value: function getPassword(linkId) {
                return this.findPendingKeyForLink(linkId, 'password') || '';
            }
        }, {
            key: 'updatePassword',
            value: function updatePassword(linkId, newValue) {
                this._initPendingData();
                this._pendingData['links'][linkId]['password'] = newValue;
                this._setStatus('modified');
            }
        }, {
            key: 'resetPassword',
            value: function resetPassword(linkId) {
                this._data['links'][linkId]['has_password'] = false;
                this._data['links'][linkId]['password_cleared'] = true;
                this.updatePassword(linkId, '');
            }
        }, {
            key: '_passwordAsParameter',
            value: function _passwordAsParameter(linkId, params) {
                if (this._pendingData['links'] && this._pendingData['links'][linkId] && this._pendingData['links'][linkId]['password']) {
                    params['guest_user_pass'] = this._pendingData['links'][linkId]['password'];
                } else if (this._data['links'] && this._data['links'][linkId] && this._data['links'][linkId]['password_cleared']) {
                    params['guest_user_pass'] = '';
                }
            }

            /****************************/
            /* PUBLIC LINK EXPIRATION   */
            /****************************/
        }, {
            key: 'getExpirationFor',
            value: function getExpirationFor(linkId, name) {
                var pendingExpiration = this.findPendingKeyForLink(linkId, 'expiration');
                if (pendingExpiration && pendingExpiration[name] !== undefined) {
                    return pendingExpiration[name];
                }
                var current;var defaults = { days: 0, downloads: 0 };
                if (this._data['links'] && this._data['links'][linkId]) {
                    if (name == 'days') {
                        current = this._data['links'][linkId]['expire_after'];
                    } else if (name == 'downloads') {
                        current = this._data['links'][linkId]['download_limit'];
                    }
                } else {
                    current = defaults[name];
                }
                return current;
            }
        }, {
            key: 'getDownloadCounter',
            value: function getDownloadCounter(linkId) {
                if (this._data['links'] && this._data['links'][linkId] && this._data['links'][linkId]['download_counter']) {
                    return this._data['links'][linkId]['download_counter'];
                }
                return 0;
            }
        }, {
            key: 'setExpirationFor',
            value: function setExpirationFor(linkId, name, value) {
                this._initPendingData();
                var expiration = this.findPendingKeyForLink(linkId, "expiration") || {};
                expiration[name] = value;
                this._pendingData['links'][linkId]['expiration'] = expiration;
                this._setStatus('modified');
            }
        }, {
            key: '_expirationsToParameters',
            value: function _expirationsToParameters(linkId, params) {
                if (this.getExpirationFor(linkId, 'days')) {
                    params['expiration'] = this.getExpirationFor(linkId, 'days');
                } else {
                    params['expiration'] = '';
                }
                if (this.getExpirationFor(linkId, 'downloads')) {
                    params['downloadlimit'] = this.getExpirationFor(linkId, 'downloads');
                } else {
                    params['downloadlimit'] = '';
                }
            }
        }, {
            key: 'isExpired',
            value: function isExpired(linkId) {
                return this._data['links'] && this._data['links'][linkId] && this._data["links"][linkId]['is_expired'];
            }

            /****************************/
            /* PUBLIC LINKS PERMISSIONS */
            /****************************/
        }, {
            key: 'getPublicLinkPermission',
            value: function getPublicLinkPermission(linkId, name) {
                var permissions = this.findPendingKeyForLink(linkId, "permissions");
                if (permissions && permissions[name] !== undefined) {
                    return permissions[name];
                }
                var userEntry = this.userEntryForLink(linkId);
                var current;
                var defaults = {
                    read: !this._previewEditors || this._previewEditors.length > 0,
                    download: true,
                    write: false
                };
                var json;
                if (this._data['ocs_links'] && this._data['ocs_links'][linkId]) {
                    json = this._data['ocs_links'][linkId];
                } else if (this._data['links'] && this._data['links'][linkId]) {
                    json = this._data['links'][linkId];
                }
                if (json) {
                    if (name == 'download') {
                        current = !json['disable_download'];
                    } else if (name == 'read') {
                        current = userEntry.RIGHT.indexOf('r') !== -1 && json['minisite_layout'] != 'ajxp_unique_dl';
                    } else if (name == 'write') {
                        current = userEntry.RIGHT.indexOf('w') !== -1;
                    }
                } else {
                    current = defaults[name];
                }
                return current;
            }
        }, {
            key: 'isPublicLinkPreviewDisabled',
            value: function isPublicLinkPreviewDisabled() {
                return this._previewEditors && this._previewEditors.length == 0;
            }
        }, {
            key: 'setPublicLinkPermission',
            value: function setPublicLinkPermission(linkId, name, value) {
                this._initPendingData();
                var permissions = this._pendingData['links'][linkId]['permissions'] || {};
                permissions[name] = value;
                this._pendingData['links'][linkId]['permissions'] = permissions;
                this._setStatus('modified');
            }
        }, {
            key: '_permissionsToParameters',
            value: function _permissionsToParameters(linkId, params) {
                var isSharedLink = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

                if (this.getPublicLinkPermission(linkId, 'read')) {
                    params['simple_right_read'] = 'on';
                }
                if (!isSharedLink && this.getPublicLinkPermission(linkId, 'download')) {
                    params['simple_right_download'] = 'on';
                }
                if (this.getPublicLinkPermission(linkId, 'write')) {
                    params['simple_right_write'] = 'on';
                }
            }

            /****************************/
            /* PUBLIC LINKS TEMPLATE    */
            /* TODO: INFER FROM DEFAULT PUBLIC LINK
            /****************************/
        }, {
            key: 'getTemplate',
            value: function getTemplate(linkId) {
                if (this._pendingData["links"] && this._pendingData["links"][linkId] && this._pendingData["links"][linkId]["layout"]) {
                    return this._pendingData["links"][linkId]["layout"];
                }
                if (this._node.isLeaf()) {
                    if (this.getPublicLinkPermission(linkId, 'read')) {
                        return 'ajxp_unique_strip';
                    } else {
                        return 'ajxp_unique_dl';
                    }
                }
                if (this._data['links'] && this._data['links'][linkId] && this._data['links'][linkId]['minisite_layout']) {
                    return this._data['links'][linkId]['minisite_layout'];
                }
            }
        }, {
            key: 'setTemplate',
            value: function setTemplate(linkId, tplName) {
                this._initPendingData();
                this._pendingData["links"][linkId]["layout"] = tplName;
                this._setStatus('modified');
            }
        }, {
            key: '_templateToParameter',
            value: function _templateToParameter(linkId, params) {
                if (this.getTemplate(linkId)) {
                    params['minisite_layout'] = this.getTemplate(linkId);
                }
            }

            /**********************/
            /* CUSTOM LINK HANDLE */
            /**********************/
        }, {
            key: 'updateCustomLink',
            value: function updateCustomLink(linkId, newValue) {
                if (newValue == linkId) {
                    return;
                }
                this._initPendingData();
                this._pendingData['links'][linkId]['custom_link'] = newValue;
                this.save();
            }

            /*********************************/
            /*  OCS DATA                     */
            /*********************************/
        }, {
            key: 'createRemoteLink',
            value: function createRemoteLink(host, user) {
                this._initPendingData();
                var newId = Math.random();
                this._pendingData['ocs_links'][newId] = {
                    hash: newId,
                    NEW: true,
                    HOST: host,
                    USER: user
                };
                this.save();
            }
        }, {
            key: 'removeRemoteLink',
            value: function removeRemoteLink(linkId) {
                this._initPendingData();
                if (this._pendingData["ocs_links"][linkId]) {
                    delete this._pendingData["ocs_links"][linkId];
                }
                this.save();
            }
        }, {
            key: '_ocsLinksToParameters',
            value: function _ocsLinksToParameters(params) {
                var ocsData = {
                    LINKS: [],
                    REMOVE: []
                };
                if (this._pendingData["ocs_links"]) {
                    for (var key in this._data["links"]) {
                        if (!this._data["links"].hasOwnProperty(key) || this._data["links"][key]["public_link"]) {
                            continue;
                        }
                        if (!this._pendingData["ocs_links"][key]) {
                            ocsData.REMOVE.push(key);
                        }
                    }
                }
                this.getOcsLinks().map((function (link) {
                    var pLinkId = link.hash;
                    this._permissionsToParameters(pLinkId, link, true);
                    this._expirationsToParameters(pLinkId, link);
                    this._passwordAsParameter(pLinkId, link);
                    this._templateToParameter(pLinkId, link);
                    if (link.NEW) {
                        delete link['hash'];
                        delete link['NEW'];
                    }
                    ocsData.LINKS.push(link);
                }).bind(this));
                params["ocs_data"] = JSON.stringify(ocsData);
            }

            /*********************************/
            /* GENERIC: STATUS / LOAD / SAVE */
            /*********************************/
        }, {
            key: '_setStatus',
            value: function _setStatus(status) {
                this._status = status;
                this.notify('status_changed', {
                    status: status,
                    model: this
                });
            }
        }, {
            key: 'load',
            value: function load() {
                if (this._status == 'loading') return;
                this._setStatus('loading');
                ShareModel.loadSharedElementData(this._node, (function (transport) {
                    if (transport.responseJSON) {
                        this._data = transport.responseJSON;
                        this._pendingData = {};
                        this._setStatus('idle');
                    } else if (transport.responseXML && XMLUtils.XPathGetSingleNodeText(transport.responseXML, '//message[@type="ERROR"]')) {
                        this._setStatus('error');
                    }
                }).bind(this));
            }
        }, {
            key: 'save',
            value: function save() {
                if (Object.keys(this._pendingData).length) {
                    this.submitToServer();
                }
            }
        }, {
            key: 'stopSharing',
            value: function stopSharing() {
                var callbackFunc = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

                var params = {
                    get_action: 'unshare'
                };
                if (this._data && this._data['share_scope']) {
                    params['share_scope'] = this._data['share_scope'];
                }
                ShareModel.prepareShareActionParameters(this.getNode(), params);
                PydioApi.getClient().request(params, (function (response) {
                    try {
                        if (this._dataModel && this._pydio.getContextHolder() !== this._dataModel) {
                            this._dataModel.requireContextChange(this._dataModel.getRootNode(), true);
                        } else {
                            this._pydio.fireNodeRefresh(this._node);
                        }
                    } catch (e) {}
                    if (callbackFunc) {
                        callbackFunc(response);
                    } else {
                        this.load();
                    }
                }).bind(this), null);
            }
        }, {
            key: 'submitToServer',
            value: function submitToServer() {
                var params = {
                    get_action: 'share',
                    sub_action: 'share_node',
                    return_json: 'true'
                };
                if (this._pendingData["enable_public_link"] !== undefined) {
                    if (this._pendingData["enable_public_link"]) {
                        params["enable_public_link"] = "true";
                    } else {
                        params["disable_public_link"] = this.getPublicLinks()[0]['hash'];
                    }
                } else if (this.getPublicLinks().length) {
                    params["enable_public_link"] = "true";
                }
                if (this._node.getMetadata().get('shared_element_hash')) {
                    params["tmp_repository_id"] = this._node.getMetadata().get('shared_element_parent_repository');
                    params["file"] = this._node.getMetadata().get("original_path");
                } else {
                    params["file"] = this._node.getPath();
                }

                if (this._data['repositoryId']) {
                    params['repository_id'] = this._data['repositoryId'];
                } else {
                    params["element_type"] = this._node.isLeaf() ? "file" : this._node.getMetadata().get("ajxp_shared_minisite") ? "minisite" : "repository";
                    params['create_guest_user'] = 'true';
                }
                this._globalsAsParameters(params);
                if (!params['repo_label']) {
                    params['repo_label'] = this._node.getLabel();
                }

                var publicLinks = this.getPublicLinks();
                if (publicLinks.length) {
                    var pLinkId = publicLinks[0]['hash'];
                    var userEntry = this.userEntryForLink(pLinkId);
                    params['guest_user_id'] = userEntry['internal_user_id'];
                    params['hash'] = pLinkId;
                    // PUBLIC LINKS
                    this._permissionsToParameters(pLinkId, params);
                    this._expirationsToParameters(pLinkId, params);
                    this._passwordAsParameter(pLinkId, params);
                    this._templateToParameter(pLinkId, params);
                    if (this._pendingData['links'] && this._pendingData['links'][pLinkId] && this._pendingData['links'][pLinkId]['custom_link']) {
                        params['custom_handle'] = this._pendingData['links'][pLinkId]['custom_link'];
                    }
                } else if (this._pendingData["enable_public_link"] === true) {
                    this._permissionsToParameters('ajxp_create_public_link', params);
                    this._expirationsToParameters('ajxp_create_public_link', params);
                    this._passwordAsParameter('ajxp_create_public_link', params);
                    this._templateToParameter('ajxp_create_public_link', params);
                }

                // GENERIC
                this._visibilityDataToParameters(params);
                this._sharedUsersToParameters(params);

                // OCS LINK
                this._ocsLinksToParameters(params);

                PydioApi.getClient().request(params, (function (transport) {
                    var _data = transport.responseJSON;
                    if (_data !== null) {
                        this._data = _data;
                        this._pendingData = {};
                        this._setStatus('saved');
                        this._pydio.fireNodeRefresh(this._node);
                    } else {
                        // There must have been an error, revert
                        this.load();
                    }
                }).bind(this), null);
            }
        }, {
            key: 'resetDownloadCounter',
            value: function resetDownloadCounter(linkId) {
                var callback = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

                var params = {
                    "get_action": "reset_counter",
                    "element_id": linkId
                };
                ShareModel.prepareShareActionParameters(this.getNode(), params);
                PydioApi.getClient().request(params, (function () {
                    this.load();
                    callback();
                }).bind(this));
            }
        }, {
            key: 'prepareEmail',
            value: function prepareEmail(shareType) {
                var linkId = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

                var MessageHash = global.pydio.MessageHash;
                var ApplicationTitle = global.pydio.appTitle;

                var s,
                    message,
                    link = '';
                if (shareType == "link") {
                    s = MessageHash["share_center.42"];
                    if (s) s = s.replace("%s", ApplicationTitle);
                    link = this.getPublicLink(linkId);
                    message = s + "\n\n " + "<a href='" + link + "'>" + link + "</a>";
                } else {
                    s = MessageHash["share_center." + (this.getNode().isLeaf() ? "42" : "43")];
                    if (s) s = s.replace("%s", ApplicationTitle);
                    if (this._data['repository_url']) {
                        link = this._data['repository_url'];
                    }
                    //if(this.shareFolderMode == 'workspace'){
                    message = s + "\n\n " + "<a href='" + link + "'>" + MessageHash["share_center.46"].replace("%s1", this.getGlobal("label")).replace("%s2", ajaxplorer.appTitle) + "</a>";
                    //}else{
                    //    message = s + "\n\n " + "<a href='" + link +"'>" + MessageHash["share_center.46" + (this.currentNode.isLeaf()?'_file':'_mini')].replace("%s1", this._currentRepositoryLabel) + "</a>";
                    //}
                }
                var usersList = null;
                if (this.shareFolderMode == 'workspace' && oForm) {
                    usersList = oForm.down(".editable_users_list");
                }
                var subject = MessageHash["share_center.44"].replace("%s", ApplicationTitle);
                var panelTitle = MessageHash["share_center.45"];
                return {
                    subject: subject,
                    message: message
                };
            }
        }], [{
            key: 'prepareShareActionParameters',
            value: function prepareShareActionParameters(uniqueNode, params) {
                var meta = uniqueNode.getMetadata();
                if (meta.get('shared_element_hash')) {
                    params["hash"] = meta.get('shared_element_hash');
                    params["tmp_repository_id"] = meta.get('shared_element_parent_repository');
                    params["element_type"] = meta.get('share_type');
                    params["file"] = meta.get("original_path");
                } else {
                    params["file"] = uniqueNode.getPath();
                    params["element_type"] = uniqueNode.isLeaf() ? "file" : meta.get("ajxp_shared_minisite") ? "minisite" : "repository";
                }
            }
        }, {
            key: 'loadSharedElementData',
            value: function loadSharedElementData(node) {
                var completeCallback = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
                var errorCallback = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
                var settings = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

                var meta = node.getMetadata();
                var options = {
                    get_action: 'load_shared_element_data',
                    merged: 'true'
                };
                if (meta.get('shared_element_hash')) {
                    options["tmp_repository_id"] = meta.get('shared_element_parent_repository');
                    options["file"] = meta.get("original_path");
                    options["owner"] = meta.get("owner");
                } else {
                    options["file"] = node.getPath();
                }
                PydioApi.getClient().request(options, completeCallback, errorCallback, settings);
            }
        }, {
            key: 'getAuthorizations',
            value: function getAuthorizations(pydio) {
                var pluginConfigs = pydio.getPluginConfigs("action.share");
                var authorizations = {
                    folder_public_link: pluginConfigs.get("ENABLE_FOLDER_PUBLIC_LINK"),
                    folder_workspaces: pluginConfigs.get("ENABLE_FOLDER_INTERNAL_SHARING"),
                    file_public_link: pluginConfigs.get("ENABLE_FILE_PUBLIC_LINK"),
                    file_workspaces: pluginConfigs.get("ENABLE_FILE_INTERNAL_SHARING"),
                    editable_hash: pluginConfigs.get("HASH_USER_EDITABLE"),
                    pass_mandatory: false,
                    max_expiration: pluginConfigs.get("FILE_MAX_EXPIRATION"),
                    max_downloads: pluginConfigs.get("FILE_MAX_DOWNLOAD")
                };
                var pass_mandatory = pluginConfigs.get("SHARE_FORCE_PASSWORD");
                if (pass_mandatory) {
                    authorizations.password_mandatory = true;
                }
                authorizations.password_placeholder = pass_mandatory ? pydio.MessageHash['share_center.176'] : pydio.MessageHash['share_center.148'];
                return authorizations;
            }
        }, {
            key: 'compileLayoutData',
            value: function compileLayoutData(pydio, node) {

                // Search registry for template nodes starting with minisite_
                var tmpl;
                if (node.isLeaf()) {
                    var currentExt = node.getAjxpMime();
                    tmpl = XPathSelectNodes(pydio.getXmlRegistry(), "//template[contains(@name, 'unique_preview_')]");
                } else {
                    tmpl = XPathSelectNodes(pydio.getXmlRegistry(), "//template[contains(@name, 'minisite_')]");
                }

                if (!tmpl.length) {
                    return [];
                }
                if (tmpl.length == 1) {
                    return [{ LAYOUT_NAME: tmpl[0].getAttribute('element'), LAYOUT_LABEL: '' }];
                }
                var crtTheme = ajxpBootstrap.parameters.get('theme');
                var values = [];
                var noEditorsFound = false;
                tmpl.map(function (node) {
                    var theme = node.getAttribute('theme');
                    if (theme && theme != crtTheme) return;
                    var element = node.getAttribute('element');
                    var name = node.getAttribute('name');
                    var label = node.getAttribute('label');
                    if (currentExt && name == "unique_preview_file") {
                        var editors = pydio.Registry.findEditorsForMime(currentExt);
                        if (!editors.length || editors.length == 1 && editors[0].editorClass == "OtherEditorChooser") {
                            noEditorsFound = true;
                            return;
                        }
                    }
                    if (label) {
                        if (MessageHash[label]) label = MessageHash[label];
                    } else {
                        label = node.getAttribute('name');
                    }
                    values[name] = element;
                    //chooser.insert(new Element('option', {value:element}).update(label));
                    values.push({ LAYOUT_NAME: name, LAYOUT_ELEMENT: element, LAYOUT_LABEL: label });
                });
                return values;
            }
        }, {
            key: 'mailerActive',
            value: function mailerActive() {
                return global.pydio.Registry.hasPluginOfType("mailer");
            }
        }, {
            key: 'forceMailerOldSchool',
            value: function forceMailerOldSchool() {
                return global.pydio.getPluginConfigs("action.share").get("EMAIL_INVITE_EXTERNAL");
            }
        }, {
            key: 'federatedSharingEnabled',
            value: function federatedSharingEnabled() {
                return global.pydio.getPluginConfigs("core.ocs").get("ENABLE_FEDERATED_SHARING");
            }
        }]);

        return ShareModel;
    })(Observable);

    var ReactModel = global.ReactModel || {};
    ReactModel['Share'] = ShareModel;
    global.ReactModel = ReactModel;
    // Set for dependencies management
    global.ReactModelShare = ShareModel;
})(window);
