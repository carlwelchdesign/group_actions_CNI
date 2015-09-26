
$(function () {


    // establish default settings for modal
    $.extend($.ui.dialog.prototype.options, {
        closeOnEscape: true,
        draggable: false,
        hide: 'fade',
        modal: true,
        open: function () { //removes jQuery UI title bar
            $('.ui-dialog-titlebar').remove();
        },
        position: 'center',
        resizable: false,
        show: 'fade',
        width: 400,
        zIndex: 30
    });

    function loadSideDrawer() {
        var html, drawerUrl, regionScriptUrl;
        regionScriptUrl = '/View/Regions/js/MultiRegionFilter.js';
        html = '<input type="hidden" name="view" value="Search.Basic"><h3 class="loading">Loading search criteria...</h3><img src="/View/images/ajax-loaderLRG.gif" />';
        drawerUrl = document.location.search ? document.location.href + '&drawer=1' : document.location.href + '?drawer=1';
        $('.searchForm').html(html).load(drawerUrl, function () {
            $.getScript(regionScriptUrl);
        });
    }

    function toggleSideDrawer() {
        if ($('.Search-Basic').length == 0) {
            loadSideDrawer();
        }
        var sideDrawer = $('#sideDrawer');
        var overlay = $('#sideDrawer .overlay');
        var sideDrawerStatus = $('#sideDrawer').attr('class');

        if (sideDrawerStatus == '') {
            sideDrawer.addClass('opened');
            document.cookie = "isSearchSideDrawerOpen=true";
        } else {
            sideDrawer.removeClass('opened');
            document.cookie = "isSearchSideDrawerOpen=false";
        }

        if ($('.roleDescription').hasClass('opened')) {
            refreshOpenRoleDescription();
        }

        // if there opened relocation menus, close em up
        if ($('#searchResults > .subMenu:visible').length > 0) {
            $('#searchResults .subMenu:visible').slideUp('fast', function () {
                $(this).remove();
                $('.relocate.open').removeClass('open');
            });
        }
    }

    function toggleResultDisplayOption(e) {
        var result = false;

        // Temporary variable to help determine uniqueness in possibleOptions
        var prev;

        var element = $(e.currentTarget);
        var searchResultList = $(".searchResultList");
        var displayOptions = $(".displayOptions");
        var displayOptionsMenu = $(".displayOptionsMenu");

        // Gets a unique list of possible display options that selectedOption may contain
        var optionArray = $(".displayOptionsMenu li").map(function (i, e) { return $(e).attr("class") }).toArray().sort();
        var filteredOptions = $.grep(optionArray, function (e) { return prev != (prev = e); });
        var possibleOptions = filteredOptions.join(" ");

        // Get the actual selected display option
        var selectedOption = element.attr("class");

        // Temporary until detail view is ready - halts view switch if 'detail' is selected
        if (selectedOption == "detail") { return false };

        if (!searchResultList.hasClass(selectedOption)) {
            searchResultList.removeClass(possibleOptions).addClass(selectedOption);
            displayOptions.removeClass(possibleOptions).addClass(selectedOption);

            displayOptionsMenu.find('li.selected').removeClass('selected');
            displayOptionsMenu.find('li.' + selectedOption).addClass('selected');

            switch (selectedOption) {
                case 'note':
                case 'tiled':
                    $('.noteContain, .photoContain').removeAttr('style');
                    $('.allShowPhotos, .allShowNotes').hide();
                    break;
                case 'basic':
                    $('.talentTabs .active').removeClass('active');
                    $('.talentTabs .photo').addClass('active');
                    $('.allShowNotes').show();
            }

            result = true;
        }

        return result;
    }

    function updateSearchFormAction(e) {
        var element = $(e.currentTarget);
        var elementValue = element.val();
        var form = element.closest("form");
        var action = form.attr("action");

        if (element.attr("name") == "roleId") {
            action = action.replace(/(\/role\/)\d+/gi, "$1" + elementValue);
        }

        form.attr("action", action);
    }

    function expander(e) {
        e.preventDefault(); // keeps 1st radio/checkbox from being toggled ('for' attr issue)

        var searchForm = $('.searchForm');
        var clicked = $(e.target).closest('label');
        var expandee;

        // check what the expandee is (span or div)
        if (clicked.next('span').length == 0) {
            expandee = clicked.next('div');
        } else {
            expandee = clicked.next('span');
        };

        // now open/close it
        if (clicked.hasClass('opened')) {
            expandee.css('display', 'none');
            clicked.removeClass('opened');
        } else {
            expandee.css('display', 'block');
            clicked.addClass('opened');
            clicked[0].scrollIntoView();
        }
    }

    function filterBadBoxFunction() {
        return !$(this).parents(".help, .quicksearch, .openInBadbox, .popup").length;
    }

    $("#header a, a.returnToProj, .changeRole a").filter(filterBadBoxFunction).on("click", function () {
        var url = $(this).attr('href');
        var submissionCompleteUrl = $("#submissionCompleteUrl").val();
        var proceedAsNormal = true;

        if (submissionCompleteUrl) {
            $('<iframe id="submissionCompleteConfirmation">')
            .attr("src", submissionCompleteUrl)
            .css({ width: '400px', height: '100px' })
            .data("redirectUrl", url)
            .dialog({
                width: 400,
                height: 100
            });

            proceedAsNormal = false;
        }

        return proceedAsNormal;
    });

    function buildSubmitAllModal(e) {
        var html =
        '<div id="sumbitAllModal" style="display:none">' +
        '<div class="modalHeader"></div>' +
        '<div id="submitAllWarning"></div>' +
        '<div class="actions">' +
        '<a id="submit" href="#" class="button green"></a>' +
        '<span id="cancelSpan"></span>' +
        '</div>' +
        '</div>';

        var target = $(html);

        var divSumbitAll = target.find('#sumbitAllModal');
        var divHead = target.find('.modalHeader');
        var divBody = target.find('#submitAllWarning');
        var spanCancel = target.find('#cancelSpan');
        var modalSubmitAllBtn = target.find('#submit');
        divHead.append('<h2>Warning</h2>');

        if ($(e.target).attr("id") == "submitAll") {
            var submitString = document.getLocalResourceObject("submitAllMessage1") +
            " <strong>" + $("div.resultCount").find("span.count").html() + "</strong> " +
            document.getLocalResourceObject("submitAllMessage2") +
            " <strong>" + $("div.roleDescription").find("h5").html() + "</strong> " +
            document.getLocalResourceObject("submitAllMessage3") +
            " <strong>" + $(e.target).data("projectname") + "</strong>" +
            document.getLocalResourceObject("submitAllMessage4") +
            "</br> </br>" +
            '<div class="warningOrange">' + "<p>" + document.getLocalResourceObject("submitAllMessage5") + "</p>" + "</div>";
            divBody.append('<p class="note">' + submitString + '</p>');
            modalSubmitAllBtn.html(document.getLocalResourceObject("submitAllBtnText"));
            modalSubmitAllBtn.click(function () {
                $('.ui-dialog').dialog('destroy').remove();
                // post a loading message, while the page refreshes
                displayProcessingModal();

                submitAll();
            });
        }
        else {
            var unSubmitAllMessage = document.getLocalResourceObject("unSubmitAllMessage1") + " <strong>" + $(e.target).data("submissioncount") + "</strong> " + document.getLocalResourceObject("unSubmitAllMessage2") + " <strong>" + $("div.roleDescription").find("h5").html() + "</strong> " + document.getLocalResourceObject("unSubmitAllMessage3") + " <strong>" + $(e.target).data("projectname") + "</strong>" + document.getLocalResourceObject("unSubmitAllMessage4");
            divBody.append('<p class="note">' + unSubmitAllMessage + '</p>');
            modalSubmitAllBtn.text(document.getLocalResourceObject("unSubmitAllBtnText"));
            modalSubmitAllBtn.click(function () {
                $('.ui-dialog').dialog('destroy').remove();
                // post a loading message, while the page refreshes
                displayProcessingModal();

                unsubmitAll();
            });
        }

        var aCancel = $('<a href="#">' + document.getLocalResourceObject("Cancel") + '</a>').addClass('button').click(function () { $("#sumbitAllModal").dialog("destroy").remove(); return false; });
        spanCancel.append(aCancel);

        $("body").append(target);
        $("#sumbitAllModal").dialog({
            width: 450
        });

        return false;
    }

    function submitAll() {
        var element = $("ul.searchResultList");
        var queryString = "";
        var url = window.location.href.split('?');
        if (url.length > 1) {
            queryString = "?" + url[1];
        }
        var projectId = element.data("projectid");
        var roleId = element.data("roleid");

        var advanceSearchRequest = {};

        $("#advancedSearchCriteria input:hidden").each(function () {
            advanceSearchRequest[$(this).attr("name")] = $(this).val();
        });

        $.ajax({
            url: ["/api/project/", projectId, "/role/", roleId, "/profiles", queryString].join(""),
            type: "POST",
            headers: advanceSearchRequest,
            data: {
                action: "submitAll",
                project: projectId,
                role: roleId
            },
            traditional: true,
            error: submitAllError
        }).done(function (response) {
            location.reload();
        });
    }

    function unsubmitAll() {
        var element = $("ul.searchResultList");
        var queryString = "";
        var url = window.location.href.split('?');
        if (url.length > 1) {
            queryString = "?" + url[1];
        }
        var projectId = element.data("projectid");
        var roleId = element.data("roleid");

        $.ajax({
            url: ["/api/project/", projectId, "/role/", roleId, "/profiles", queryString].join(""),
            type: "POST",
            data: {
                action: "unsubmitAll",
                project: projectId,
                role: roleId
            },
            traditional: true,
            error: submitAllError
        }).done(function (response) {
            location.reload();
        });
    }

    function submitAllError(xhr, status, error) {
        var thisXhr = xhr;
        var thisStatus = status;
        var thisError = error;
    }

    function buildAgentEmailTalent(e) {
        $('<iframe src="' + $(e.target).data("url") + '">').dialog({
            width: 600,
            height: 400
        });
        $('.ui-dialog iframe').css({ width: '600px', height: '400px' });

        return false;
    }
    function closeModal() {
        $(".ui-dialog iframe").dialog("close");
    }

    function openPrintCallListWindow(e) {
        window.open($(e.target).data("url"), '', 'width=800,height=480');
        return false;
    }

    function autofillRoleCriteria(e) {
        var roleCollectionData = $.parseJSON($("div.roleDescription").data("rolecollectiondata"));

        if (roleCollectionData.isMaleRole) {
            $(".Person-ti-Sex input[value=MALE], .Person-ti-Sex input[value=100]").attr("checked", true);
        }

        if (roleCollectionData.isFemaleRole) {
            $(".Person-ti-Sex input[value=FEMALE], .Person-ti-Sex input[value=200]").attr("checked", true);
        }

        $("input[name='Person.Managed.AgeRangeMin'], input[name='Person.AgeRangeMin']").val(roleCollectionData.ageMin);
        $("input[name='Person.Managed.AgeRangeMax'], input[name='Person.AgeRangeMax']").val(roleCollectionData.ageMax);

        if (roleCollectionData.allEthnicity) {
            $(".Person-ti-Ethnicities input").attr("checked", true);
        }
        else {
            for (var j = 0; j < roleCollectionData.ethnicityList.length; j++) {
                if (roleCollectionData.ethnicityList[j].selected) {
                    $('.Person-ti-Ethnicities input[value="' + roleCollectionData.ethnicityList[j].token + '"]').attr("checked", true);
                }
            }
        }
        // open ethnicities expandable
        $('.Person-ti-Ethnicities > label').addClass('opened');
        $('.Person-ti-Ethnicities > span').css('display', 'block');

        //autofill regions associated with a role, fetch each regionid from json object and create comma separated list of regionIds
        var regionIdList = [];
        var suggestedRegionIdList = [];
        var regionIds = "";
        var suggestedRegionIds = "";
        if (roleCollectionData.regionList.length > 0) {
            for (var i = 0; i < roleCollectionData.regionList.length; i++) {
                regionIdList.push(roleCollectionData.regionList[i].id);
            }
            regionIds = regionIdList.join(',');
        }

        if ($('.Search-AdvancedRegions').length > 0) {

            //get suggested regions of role-regions
            if (roleCollectionData.suggestedRegionList.length > 0) {
                for (var i = 0; i < roleCollectionData.suggestedRegionList.length; i++) {
                    suggestedRegionIdList.push(roleCollectionData.suggestedRegionList[i].id);
                }
                suggestedRegionIds = suggestedRegionIdList.join(',');
            }

            //set RegionIds and suggestedRegionId to input fields of a control, this is needed to prepopulatea a control
            $('.Search-Location-Advanced > div#MultiRegionSelector input[id="RegionId"]').val(regionIds);
            $('.Search-Location-Advanced > div#MultiRegionSelector input[id="SuggestedRegionIds"]').val(suggestedRegionIds);
            //call method to populate multiRegionPicker control
            $('.Search-Location-Advanced > div#MultiRegionSelector').PopulateMultiRegionPickerControl();
            // expand multiRegionPicker control
            $('.Search-AdvancedRegions > label').addClass('opened');
            $('.Search-AdvancedRegions > span').css('display', 'block');
        }
        else if ($('.Search-Location-Basic').length > 0) {
            //set RegionIds to input fields of a control, this is needed to prepopulatea a control
            $('.Search-Location-Basic > div#MultiRegionFilter input[id="SelectedRegionIds"]').val(regionIds);
            $('.Search-Location-Basic > div#MultiRegionFilter input[id="RegionId"]').val(regionIds);
            //clear suggestedRegionId hiddenfield, For autofill we need to populate suggestedRegions from list of selectedRegions and that is done using "PopulateMultiRegionFilterControl" method
            //suggestedRegionId hiddenfield is required for searching talents and for autofill feature we need not require it.
            $('.Search-Location-Basic > div#MultiRegionFilter input[id="SuggestedRegionIds"]').val('');
            //call method to populate multiRegionFilter control
            $('.Search-Location-Basic > div#MultiRegionFilter').PopulateMultiRegionFilterControl();
            // expand multiregionfilter control
            $('.Search-Location-Basic > label').addClass('opened');
            $('.Search-Location-Basic > div#MultiRegionFilter').css('display', 'block');
        }

        return false;
    }

    function navigateToAdvancedSearchCriteria(event) {
        $("#advancedSearchCriteria").submit();
    }

    function showSendSelectsModal() {
        var results = $(".searchResultList");
        var castingCompanyId = results.data("castingcompanyid");
        var roleId = results.data("roleid");
        var url = ["/ccd/badbox/SendSelects.aspx?id=", castingCompanyId, "&roleId=", roleId].join("");
        $('<iframe class="sendSelects" src="' + url + '">').dialog({
            width: 610,
            height: 407
        });
    }

    // Bind the datetime range search options
    (function () {
        $(".datetimeRangeSearch").each(function (i, e) {
            var inputs = $(e).find("input").hide();
            var earliest = inputs.first();
            var latest = inputs.last();

            var newInput = function (src, increment) {
                var initValue = parseInt(src.val().replace(/NOW-(\d*)YEAR/gi, "$1"), 10);

                return $('<input/>')
                .attr("type", "text")
                .attr("pattern", "\\d*")
                .val(initValue ? initValue - increment : "")
                .on("change", function () {
                    var value = $(this).val();
                    src.val(value ? "NOW-" + (parseInt(value, 10) + increment) + "YEAR" : "");
                });
            }

            var newEarliest = newInput(latest, 0);
            var newLatest = newInput(earliest, 1);

            var to = document.getLocalResourceObject("Search.Advanced.Label.To") || document.getLocalResourceObject("Label.To") || "to";
            var yearsOld = document.getLocalResourceObject("Search.Advanced.Label.YearsOld") || document.getLocalResourceObject("Label.YearsOld") || "years old";

            var toLabel = $('<span class="toSpan"/>').text(to);
            var yearsOldLabel = $('<span class="toSpan"/>').text(yearsOld);

            inputs
            .parent()
            .append(newEarliest)
            .append(toLabel)
            .append(newLatest)
            .append(yearsOldLabel);
        });
    }());

    if ($('#Person_ti_DueDate').val() == 'NOW') {
        addPregnancyCheckbox('checked');
    }
    else {
        addPregnancyCheckbox();
    }

    function addPregnancyCheckbox(asChecked) {
        var html = '<input type=checkbox id="currentlyPregnant" ' + asChecked + '><label for="currentlyPregnant">Yes</label>';

        $(html).appendTo('.Person-ti-DueDate span');
        $('#currentlyPregnant').on('change', function () {
            var $this, $fromRange, $toRange;
            $this = $(this);
            $fromRange = $this.siblings('input').eq(0);
            $toRange = $this.siblings('input').eq(1);
            if ($this.attr('checked')) {
                $fromRange.val('NOW');
                $toRange.val('*');
            } else {
                $fromRange.val('');
                $toRange.val('');
            }
        });
    }


    // --- BEGIN GROUP ACTIONS MODALS --- //

    // GROUP ACTIONS FIRST STEP MODAL
    function groupActions_buildFirstStepModal(e) {

        // get what bucket the user is in (e.g. 'unviewed', 'viewed', etc.)
        var aPath = document.location.pathname.split('/');
        var bucket = aPath[aPath.length - 1];

        //make the modal
        var modal = $(
            '<div id="modalContainer">' +
            '   <div id="ga_firstStepModal" class="gaModal">' +
            '       <div class="modalHeader">' +
            '           <h2>Group Actions</h2>' +
            '       </div>' +
            '       <div class="modalContent">' +
            '           <div class="options">' +
            '               <div>' +
            '                   <label for="talentselect">For</label>' +
            '                   <div class="input">' +
            '                       <select id="talentselect">' +
            '                          <option value="allInCurrentBucket">All Talent Results in "' + bucket + '"</option>' +
            '                          <option value="withPriority">All Results with Select Number of</option>' +
            '                       </select>' +
            '                       <div id="priorityCheckBoxes">' +
            '                           <input type="checkbox" ref="1" id="p1"/><label for="p1">1</label>' +
            '                           <input type="checkbox" ref="2" id="p2"/><label for="p2">2</label>' +
            '                           <input type="checkbox" ref="3" id="p3"/><label for="p3">3</label>' +
            '                           <input type="checkbox" ref="4" id="p4"/><label for="p4">4</label>' +
            '                           <input type="checkbox" ref="5" id="p5"/><label for="p5">5</label>' +
            '                       </div>' +
            '                   </div>' +
            '               </div>' +
            '               <div>' +
            '                   <label for="dothisselect">Do This</label>' +
            '                   <div class="input">' +
            '                       <select id="dothisselect">' +
            '                          <option value="">Choose Action</option>' +
            '                          <option value="moveToRole">Move Talent to Role</option>' +
            '                          <option value="sendMessage">Send Message</option>' +
            '                          <option value="changeSelectNumber">Change Select Number</option>' +
            '                       </select>' +
            '                   </div>' +
            '               </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="actions">' +
            '           <a class="button primaryaction continue disabled" href="#">Continue</a>' +
            '           <a class="button cancel" href="#">Cancel</a>' +
            '       </div>' +
            '   </div>' +
            '</div>'
            )
            .on("dialogclose", function () { modal.dialog("destroy").remove(); });

        var cancelButton = modal.find('.button.cancel')
        .on("click", function (event) {
            modal.dialog("close");
        });

        //variables to be used in the disabling / enabling of the Continue button
        var isActionSelected = false,
            prioritySelected = false, // is "All Talent with Priority of" selected from the drop down?
            priorityChecked = false, // is at least one priority checkbox checked?
            continueButton = modal.find('.button.continue'),
            selectedAction;

        function setPriorityChecked() {
            priorityChecked = modal.find('#priorityCheckBoxes :checkbox:checked').length > 0;

        }

        // show the priority checkboxes if "All Talent with Priority of" is selected
        var priorityCheckBoxes = modal.find('#priorityCheckBoxes')
        var talentSelect = modal.find('#talentselect')
        .on('change', function () {
            if (this.value === 'withPriority') {
                priorityCheckBoxes.show();
                groupActions.moveToRoleProps.prioritySelected = prioritySelected = true;


                setPriorityChecked()
            } else {
                priorityCheckBoxes.hide();
                prioritySelected = false;
            }
            toggleContinueButton();
        });

        // is an action selected?
        modal.find('#dothisselect')
        .on('change', function () {
            selectedAction = this.value;
            if (selectedAction) {
                isActionSelected = true;
            } else {
                isActionSelected = false;
            }
            toggleContinueButton();
        });

        // is at least priority checkbox checked?
        modal.find('#priorityCheckBoxes input').on('click', function () {
            setPriorityChecked()
            toggleContinueButton();
        });

        // check the variables set by the event handlers above
        // to determine if the continue button should be enabled.
        function toggleContinueButton() {
            continueButton.addClass('disabled');
            if (prioritySelected) {
                if (priorityChecked && isActionSelected) {
                    continueButton.removeClass('disabled');
                }
            } else {
                if (isActionSelected) {
                    continueButton.removeClass('disabled');
                }
            }
        }

        // handle continue button click
        continueButton.on('click', function () {
            if (!$(this).hasClass('disabled')) {
                var talentSelectValue = $(talentSelect).val();
                groupActions.moveToRoleProps.selectPriortyArr = $('#priorityCheckBoxes input:checkbox:checked').map(function () {
                    return $(this).attr('ref');
                }).get();
                 groupActions.selectivityID =  groupActions.moveToRoleProps.selectPriortyArr;  

                // TODO: add logic to grab talent selection from the "For" drop down
                switch (selectedAction) {
                   case 'moveToRole':
                        // console.log('Move the group to a different Role\nLaunch the moveToRole modal');
                        groupActions.handleMoveToRole();
                        break;
                       case 'sendMessage':
                        // console.log('Send the group a message\nLaunch the sendMessage modal');
                        groupActions_buildContactTalentModal();
                        break;
                        case 'changeSelectNumber':

                        // console.log('Change the select number of the group\nLaunch the changeSelectNumber modal');
                        groupActions_buildChangeSelectNumberModal();
                        break;
                }
            }
        });
        // now, actually create the modal using jqueryUI .dialog() method
        modal.dialog();

    }
    // END GROUP ACTIONS FIRST STEP MODAL


    // BUILD GROUP ACTIONS 'MOVE TO ROLE' MODAL
    function groupActions_buildMoveToRoleModal(roles) {
        // destroy the existing referring modal so we don't have modal-on-modal action
        $('#modalContainer').dialog('destroy').remove();
        // define the new modal
        var modal = $(
            '<div id="modalContainer">' +
            '   <div id="ga_moveToRoleModal" class="gaModal">' +
            '       <div class="modalHeader">' +
            '           <h2>Move to Role</h2>' +
            '       </div>' +
            '       <div class="modalContent centered">' +
            '           <div class="fieldset">' +
            '               <div>' +
            '                   <label for="roleselect">Move Talent to Role</label>' +
            '               </div>' +
            '               <div>' +
            '                   <select id="roleselect"></select>' +
            '               </div>' +
            '           </div>' +
            '           <div class="fieldset">' +
            '               <div>' +
            '                   <label>Priority</label>' +
            '               </div>' +
            '               <div>' +
            '                   <ol class="priority">' +
            '                       <li class="1 first">' +
            '                           <input type="radio" name="priority" value="1" id="priority1" checked="checked">' +
            '                           <label for="priority1">1</label>' +
            '                       </li>' +
            '                       <li class="2">' +
            '                           <input type="radio" name="priority" value="2" id="priority2">' +
            '                           <label for="priority2">2</label>' +
            '                       </li>' +
            '                       <li class="3">' +
            '                           <input type="radio" name="priority" value="3" id="priority3">' +
            '                           <label for="priority3">3</label>' +
            '                       </li>' +
            '                       <li class="4">' +
            '                           <input type="radio" name="priority" value="4" id="priority4">' +
            '                           <label for="priority4">4</label>' +
            '                       </li>' +
            '                       <li class="5 last">' +
            '                           <input type="radio" name="priority" value="5" id="priority5">' +
            '                           <label for="priority5">5</label>' +
            '                       </li>' +
            '                   </ol>' +
            '               </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="actions">' +
            '           <a class="button primaryaction moveToRole" href="#">Move to Role</a>' +
            '           <a class="button cancel" href="#">Cancel</a>' +
            '       </div>' +
            '   </div>' +
            '</div>'
            )
            .on("dialogclose", function () { modal.dialog("destroy").remove(); });

        var cancelButton = modal.find('.button.cancel')
        .on("click", function (event) {
            modal.dialog("close");
        });

        var moveToRoleButton = modal.find('.button.moveToRole')
        .on('click', function (e) {
            groupActions.moveToRole();
        });

        // Find and fill in the select list of roles
        var roleSelect = modal.find("#roleselect");

        var currentRole = $('.changeRoleMenu li.selected a').text();
        for (var roleId in roles) {
            var role = roles[roleId];
            console.log('role: ' + role.Id + ' | ' + role.Name + ' | ' + role);
            var option = $("<option/>")
            .attr("value", role.Id)
            .text(role.Name);

            if (currentRole == role.Name) {
                option.prop('disabled', true);
            }
            roleSelect.append(option);
        };
        // finally create the modal
        modal.dialog({ width: 550 });
    }
    // END GROUP ACTIONS 'MOVE TO ROLE' MODAL



    // BUILD GROUP ACTIONS 'CONTACT TALENT' MODAL
    function groupActions_buildContactTalentModal() {
        // destroy the existing referring modal so we don't have modal-on-modal action
        $('#modalContainer').dialog('destroy').remove();
        // define the new modal
        var modal = $(
            '<div id="modalContainer">' +
            '   <div id="ga_contactTalentModal" class="gaModal">' +
            '       <div class="modalHeader">' +
            '           <h2>Contact Talent</h2>' +
            '       </div>' +
            '       <div class="modalSubHeading">' +
            '           <ul class="options">' +
            '               <li><input type="checkbox" id="email" name="email" checked="checked"/> <label for="email">Send Email</label></li>' +
            '               <li><input type="radio" id="allowReplies_true" name="allowReplies" value="true" checked="checked"/> <label for="allowReplies_true">Allow Email Replies</label></li>' +
            '               <li><input type="radio" id="allowReplies_false" name="allowReplies" value="false"/> <label for="allowReplies_false">Don\'t Allow Email Replies</label></li>' +
            '           </ul>' +
            '       </div>' +
            '       <div class="modalContent" id="sendEmail">' +
            '           <div class="fieldset">' +
            '               <label>To</label>' +
            '               <span>Talent (Non-represented Talent)</span>' +
            '           </div>' +
            '           <div class="fieldset">' +
            '               <label for="from_email">From</label>' +
            '               <input type="text" name="from_email" id="from_email"/>' +
            '           </div>' +
            '           <div class="fieldset">' +
            '               <label for="subject_email">Subject</label>' +
            '               <span id="project-title"></span>' +
            '               <input type="text" name="subject_email" id="subject_email"/>' +
            '           </div>' +
            '           <div class="fieldset">' +
            '               <label for="message_email">Message</label>' +
            '               <textarea name="message_email" id="message_email" cols="40" rows="20"></textarea>' +
            '           </div>' +
            '       </div>' +
            '       <div class="modalSubHeading">' +
            '           <input type="checkbox" id="textMessage" name="textMessage"/> <label for="textMessage">Send Text Message</label>' +
            '       </div>' +
            '       <div class="modalContent" id="sendTextMessage">' +
            '           <div class="fieldset">' +
            '               <label>To</label>' +
            '               <span>Talent (Non-represented Talent)</span>' +
            '           </div>' +
            '           <div class="fieldset">' +
            '               <label for="from_textMessage">From</label>' +
            '               <input type="text" name="from_textMessage" id="from_textMessage"/>' +
            '           </div>' +
            '           <div class="fieldset">' +
            '               <label for="message_textMessage">Message</label>' +
            '               <textarea name="message_textMessage" id="message_textMessage" cols="40" rows="20"></textarea>' +
            '           </div>' +
            '       </div>' +
            '       <div class="actions">' +
            '           <a id="doSendMessage" class="button primaryaction doSendMessage" href="#">Send Message</a>' +
            '           <a class="button cancel" href="#">Cancel</a>' +
            '       </div>' +
            '   </div>' +
            '</div>'
            )
            .on("dialogclose", function () { modal.dialog("destroy").remove(); });

        var cancelButton = modal.find('.button.cancel')
        .on("click", function (event) {
            modal.dialog("close");
        });

        //Get current user's email address and put in the 'from' fiedl
        var modalContent_fromEmail = modal.find('input#from_email');
        var current_user_email = $("ul.searchResultList").data("useremail");
        modalContent_fromEmail.val(current_user_email);

        var allowReplies_true = modal.find('input#allowReplies_true')
        .on("click", function (event) {
            modalContent_fromEmail.attr('readonly', false).removeAttr("disabled").val(current_user_email);
        });

        var doSendMessage = modal.find('#doSendMessage')
        .on("click", function (event) {

            groupActions.sendMessage();
        });

        var allowReplies_false = modal.find('input#allowReplies_false')
        .on("click", function (event) {
            modalContent_fromEmail.attr('readonly', true).attr("disabled", "disabled").val('noreply@castingnetworks.com');
        });

        var modalContent_sendEmail = modal.find('div#sendEmail');
        var modalContent_sendTextMessage = modal.find('div#sendTextMessage');

        //Get Project Title and put in the subject line for email
        var project_title = $('#pageTitle h2').text();
        var modalContent_subjectProjectTitle = modal.find('span#project-title');
        modalContent_subjectProjectTitle.text($('#pageTitle h2').text());

        var subject_email = modal.find('input#subject_email')
        .on("change", function (event) {
            if (subject_email.val() != "") {
                modalContent_subjectProjectTitle.text(project_title + " : ");
            } else {
                modalContent_subjectProjectTitle.text(project_title);
            }
        });

        $(modalContent_sendTextMessage).hide();



        // show/hide the Send Email form based on the 'Send Email' checkbox's state
        var emailCheckbox = modal.find('input#email')
        .on('change', function () {
            if ($(this).attr('checked')) {
                $(modalContent_sendEmail).show();
                // enable the Send Email radio buttons and labels
                $(modal.find('input[name="allowReplies"]')).removeAttr('disabled');
                $(modal.find('label[for="allowReplies_true"]')).removeClass('disabled');
                $(modal.find('label[for="allowReplies_false"]')).removeClass('disabled');
            } else {
                $(modalContent_sendEmail).hide();
                // disable the Send Email radio buttons and labels
                $(modal.find('input[name="allowReplies"]')).attr('disabled', 'disabled');
                $(modal.find('label[for="allowReplies_true"]')).addClass('disabled');
                $(modal.find('label[for="allowReplies_false"]')).addClass('disabled');
            }
        });

        // show/hide the Send Text Message form based on the 'Send Text Message' checkbox's state
        var textMessageCheckbox = modal.find('input#textMessage')
        .on('change', function () {
            if ($(this).attr('checked')) {
                $(modalContent_sendTextMessage).show();
            } else {
                $(modalContent_sendTextMessage).hide();
            }
        });

        // finally create the modal
        modal.dialog({ width: 660 });
    }

    // END BUILD GROUP ACTIONS 'CONTACT TALENT' MODAL


    // BUILD GROUP ACTIONS 'CHANGE SELECT NUMBER' MODAL
    function groupActions_buildChangeSelectNumberModal() {
        // destroy the existing referring modal so we don't have modal-on-modal action
        $('#modalContainer').dialog('destroy').remove();
        // define the new modal
        var modal = $(
            '<div id="modalContainer">' +
            '   <div id="ga_changeSelectNumberModal" class="gaModal">' +
            '       <div class="modalHeader">' +
            '           <h2>Change Select Number</h2>' +
            '       </div>' +
            '       <div class="modalContent centered">' +
            '           <div class="fieldset">' +
            '               <div>' +
            '                   <input type="radio" name="action" value="change" id="change" checked> <label for="change">Change Select Number</label>' +
            '               </div>' +
            '               <div>' +
            '                   <ol class="priority">' +
            '                       <li class="1 first">' +
            '                           <input type="radio" name="priority" value="1" id="priority1">' +
            '                           <label for="priority1">1</label>' +
            '                       </li>' +
            '                       <li class="2">' +
            '                           <input type="radio" name="priority" value="2" id="priority2">' +
            '                           <label for="priority2">2</label>' +
            '                       </li>' +
            '                       <li class="3">' +
            '                           <input type="radio" name="priority" value="3" id="priority3">' +
            '                           <label for="priority3">3</label>' +
            '                       </li>' +
            '                       <li class="4">' +
            '                           <input type="radio" name="priority" value="4" id="priority4">' +
            '                           <label for="priority4">4</label>' +
            '                       </li>' +
            '                       <li class="5 last">' +
            '                           <input type="radio" name="priority" value="5" id="priority5">' +
            '                           <label for="priority5">5</label>' +
            '                       </li>' +
            '                   </ol>' +
            '               </div>' +
            '           </div>' +
            '           <div class="fieldset">' +
            '               <div>' +
            '                   <input type="radio" name="action" value="remove" id="remove"> <label for="remove">Remove Select Number from Talent</label>' +
            '               </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="actions">' +
            '           <a class="button primaryaction continue disabled" href="#">Continue</a>' +
            '           <a class="button cancel" href="#">Cancel</a>' +
            '       </div>' +
            '   </div>' +
            '</div>'
            )
        .on("dialogclose", function () { modal.dialog("destroy").remove(); });

        var cancelButton = modal.find('.button.cancel')
        .on("click", function (event) {
            modal.dialog("close");
        });

        var continueButton = modal.find('.button.continue')
        .on("click", function (event) {
            groupActions.changeSelect()
        });

        /// continueButton.addClass('disabled');
        var selectNumberInput = modal.find('ol.priority input')
        .on('click', function () {
            modal.find('input#change').attr('checked', 'checked');
            continueButton.removeClass('disabled');
        });

        var removeButton = modal.find('input#remove')
            .on("click", function (event) {
                continueButton.removeClass('disabled');
            });


        var changeButton = modal.find('input#change')
        .on("click", function (event) {
            if ($('input[name=priority]:checked').length != 0) {
                continueButton.removeClass('disabled');
            } else {
                continueButton.addClass('disabled');
            }

        });

        // finally create the modal
        modal.dialog({ width: 550 });
    }



    $("#markViewedBtn").on("click", function () {
        //disable all pagination events during this action.
        $("span.perpage select").unbind();
        $("span.pagenum select").unbind();
        $("a.srchbtn").unbind();
        displayProcessingModal();
        $(".talentresult").result("markViewed", function () {
            location.reload();
        });
    })

    if ($("form[method='post']").attr("action").indexOf("submissions") != -1) {
        $("#Person_ti_Active_1").prop("checked", true);
        //Adds new 'add more talent' tile for better UX
        $("li.addSubmission").css("display", "block");
    }

    //'add more talent' tile opens Search Drawer when clicked
    $(".addSubmission").on("click", toggleSideDrawer);

    $('a.logout').after('<div class="contentViewToggle"></div>');
    $("#sideDrawer .searchToggle").on("click", toggleSideDrawer);
    $(".displayOptionsMenu li").on("click", toggleResultDisplayOption);
    $(".searchForm select[name=roleId]").on("change", updateSearchFormAction).on("blur", updateSearchFormAction);
    $('.expander > label').live("click", expander);
    $('.Search-Location-Basic > label').live("click", expander);
    $("#submitAll").on("click", buildSubmitAllModal);
    $("#unsubmitAll").on("click", buildSubmitAllModal);
    $("#agentEmailTalent").on("click", buildAgentEmailTalent);
    $("#printCallList").on("click", openPrintCallListWindow);
    $("a.autofill").on("click", autofillRoleCriteria);
    $("a.advanced").on("click", navigateToAdvancedSearchCriteria);
    $(".sendSelects").on("click", showSendSelectsModal);


    function closeSubmissionCompleteModal() {
        var url = $(".ui-dialog iframe").data("redirectUrl");

        $(".ui-dialog iframe").dialog("close");

        if (url.indexOf('http') >= 0 || url.indexOf('doPostBack') >= 0) {
            window.location.href = url;
        }
        else {
            window.location.href = window.location.protocol + "//" + window.location.host + url;
        }
    }


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
