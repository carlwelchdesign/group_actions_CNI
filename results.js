
$(function () {

    /*


     ██████╗ ██████╗  ██████╗ ██╗   ██╗██████╗      █████╗  ██████╗████████╗██╗ ██████╗ ███╗   ██╗███████╗
    ██╔════╝ ██╔══██╗██╔═══██╗██║   ██║██╔══██╗    ██╔══██╗██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝
    ██║  ███╗██████╔╝██║   ██║██║   ██║██████╔╝    ███████║██║        ██║   ██║██║   ██║██╔██╗ ██║███████╗
    ██║   ██║██╔══██╗██║   ██║██║   ██║██╔═══╝     ██╔══██║██║        ██║   ██║██║   ██║██║╚██╗██║╚════██║
    ╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝██║         ██║  ██║╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║███████║
     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝         ╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
                                                                                                          

    */

    var groupActions = {
        
        APIPATH : '/wsdl/WebService.svc/',
        searchResultList: $("ul.searchResultList"),
        ProjectId : $("ul.searchResultList").data("projectid"),
        CastingAgencyId : $("ul.searchResultList").data("castingcompanyid"),
        selectivityID: null,

        moveToRoleProps: {
            'prioritySelected': false,
            'priorityLevel': null,
            'selectPriortyArr': null
        },

        api: {
            url: null,
            data: {
                'RoleTalentIds': null,
                'TalentIds': null,
                'Selectivity': null
            }
        },

        usersOnPageCheck: (function () {
            // Check if any no users are on page and disable group actions
            $.getJSON(document.location.href, {
                format: 'json'
            })
            .done(function (data) {
                if (data.length == 0) {
                    $("#groupActionsBtnWrapper .groupActionsBtn").addClass("disabled");
                } else {
                    $("#groupActionsBtnWrapper .groupActionsBtn").on("click", groupActions_buildFirstStepModal);
                }
            })

        })(),

        moveToRole: function () {

            var APIPATH = this.APIPATH;
            var destinationRoleID = $("#roleselect").val();
            this.selectivityID = $('input[name=priority]:checked').val();

            var apiurl;
            this.api = {
                url: null,
                data: {
                    TalentIds: null,
                    RoleTalentIds: null,
                    Selectivity: selectivityID,
                    RoleId: destinationRoleID
                }
            };
            if (window.location.href.indexOf("search") > -1) {
                this.api.url = APIPATH+'MoveManyTalentFromSearchResultToSelect';
                this.api.data.UserId = $("ul.searchResultList").data("userid");
                this.api.data.CastingAgencyId = $("ul.searchResultList").data("castingcompanyid");
            } else {
                this.api.url = APIPATH+'MoveManyRoleTalentRoleByRoleTalentId'
            }

            this.searchTalent(this.api);

        },

        changeSelect: function () {
           
            var APIPATH = this.APIPATH;
            if ($('input#change').is(':checked')) {
                // Change Select Number
                if ($('input[name=priority]:checked').length != 0) {
                    var selectivityID = $('input[name=priority]:checked').val();
                    this.api = {
                        url: APIPATH+'MoveManyRoleTalentToSelects',
                        data: {
                            RoleTalentIds: null,
                            Selectivity: selectivityID
                        }
                    };
                    this.searchTalent(this.api);
                }
            } else {
                // Remove Select Number from Talent and subsequently move them to "Viewed"
                this.api = {
                    url: APIPATH+'RemoveManyRoleTalentToViewed',
                    data: {
                        RoleTalentIds: null
                    }
                };
                this.searchTalent(this.api);
            }

        },

        handleMoveToRole : function() {
            // GET THE DATA REQUIRED TO BUILD THE GROUP ACTIONS 'MOVE TO ROLE' MODAL, THEN FIRE WHEN DATA IS LOADED
            // Specifically, to load the list of roles for use in the drop down
            // Get a list of all roles in this project
            var _this = this;
            var APIPATH = this.APIPATH;
            
            $.ajax({
               url: APIPATH+'GetProjectRoles',
               type: "POST",
               data: $.toJSON({
                   CastingAgencyId: _this.CastingAgencyId,
                   ProjectId: _this.ProjectId
               }),
               contentType: 'application/json',
               dataType: "json"
           }).done(function (response) {
               var roles = response.Roles;
                // Show the modal
                groupActions_buildMoveToRoleModal(roles);
            });
        },
        
        sendMessage : function() {

            //if ($('input[name=priority]:checked').length != 0) {
            var searchResultList = $("ul.searchResultList");
            var selectivityID = this.selectivityID
            //var selectivityID = $('input[name=priority]:checked').val();
                this.api = {
                    url: '/api/message',
                    data: {
                        SenderAddress: searchResultList.data('useremail'),
                        SenderName: searchResultList.data('userdisplayname'),
                        RecipientTalentIds: null,
                        Subject: $('#pageTitle h2').text() + ' : ' + $('#subject_email').val(),
                        Body: $('#message_email').val(),
                        Type: 'Email',
                        Selectivity: selectivityID
                    }
             };


            this.searchTalent(this.api);
            // }
        },

        searchTalent: function (api) {
            // GROUP ACTIONS SEARCH FOR TALENT FUNCTIONALITY //
            // This is used by other GA functions to grab the desired set of talent to
            // perform the group action to.

            var _this = this;
            var groupToMoveArr = [];
            var mtp = this.moveToRoleProps;
            $.getJSON(document.location.href, {
                format: 'json'
            })
            .done(function (data) {

                if (!mtp.prioritySelected) {
                    groupToMoveArr = _this.buildTalentArr(data);
                } else {
                    for (var i = 0; i < mtp.selectPriortyArr.length; i++) {
                        var t = _this.checkTalent(data, 'Selectivity', mtp.selectPriortyArr[i]);
                        if (t.length != 0) {
                            var bt = _this.buildTalentArr(t);
                            groupToMoveArr.push.apply(groupToMoveArr, bt);
                        }
                    }
                }

                if (api.url == '/api/message') {
                    api.data.RecipientTalentIds = groupToMoveArr;
                } else {
                    api.data.RoleTalentIds = groupToMoveArr;
                }
                console.log('Sending email: ' + JSON.stringify(api));
                _this.API_CALL(api);
            })
            .fail(function () {
                //console.log( "error" );
            });

        },

        API_CALL: function (api) {

            displayProcessingModal();
            console.log('api.url: ' + api.url)
            $.ajax({
                url: api.url,
                type: "POST",
                data: $.toJSON(api.data),
                contentType: "application/json",
                dataType: "json"
            })
            .done(function (response) {
                if (response.IsSuccessful) {
                    location.reload();
                } else {
                    $('.ui-dialog').dialog('destroy').remove();
                    alert('Something went wrong.');
                }
                console.log(JSON.stringify(response));
            })
            .fail(function (response) {
                //console.log(JSON.stringify(response));
            });
        },

        // Searches results of 'Search Talent' API
        checkTalent: function (obj, key, val) {
            var objects = [];
            for (var i in obj) {
                if (!obj.hasOwnProperty(i)) continue;
                if (typeof obj[i] == 'object') {
                    objects = objects.concat(this.checkTalent(obj[i], key, val));
                } else if (i == key && obj[key] == val) {
                    objects.push(obj);
                }
            }
            return objects;
        },

        buildTalentArr: function (arr) {
            var tArr = [];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].RoleTalentId != null) {
                    // user list came from current project
                    tArr.push(arr[i].RoleTalentId);
                } else {
                    // user list came from search
                    tArr.push(arr[i].TalentProfileId);
                    this.api.data.TalentIds = tArr;
                    console.log(api.data.TalentIds);
                }
            }
            return tArr;
        }
    }
});
