'use strict';

angular.module('histViewer.main', ['ngRoute'])

	.config(['$routeProvider', function ($routeProvider) {
		$routeProvider.when('/main', {
			templateUrl: 'main/main.html',
			controller: 'MainCtrl'
		});
	}])

	.directive('timeline', function () {
		return {
			restrict: "E",
			replace: true,
			templateUrl: "timeline/timeline.html"
		};
	})

	.directive('bubble', function () {
		return {
			restrict: "E",
			replace: true,
			templateUrl: "bubble/bubble.html"
		}
	})

	.controller('MainCtrl', ['$scope', 'DatabaseControlService', '$location', function ($scope, DatabaseControlService, $location) {
		$scope.currentView = 'timeline';

		var totalTimelineEvents = [];

		var timelineEventLocations = [];
		var numberShownEvents = 0;

		$scope.generateTimeline = function (person) {
			$("#timelineContainer").empty(); //Delete any other timelines that are currently shown.
			timelineEventLocations = [];
			numberShownEvents = 0;
			$(".se-pre-con").show(); //Show the loading spinner
			$scope.person = person;
			DatabaseControlService.queryForWho(person).then(function () {//Load the data from the person selected
				var timelineEvents = DatabaseControlService.getQueryItems();
				if (totalTimelineEvents.length < 3) {
					totalTimelineEvents.push(timelineEvents);
				}
				createTimeline(totalTimelineEvents);
				$(".se-pre-con").fadeOut("slow"); //Hide the loading spinner
			});
		};

		//This function is called whenever a timeline event is clicked. The item variable is the html element clicked (div)
		function eventClick (item) {
			var itemId = item.currentTarget.id;
			var itemNum = parseInt(itemId.substr(itemId.indexOf("-") + 1));
			$location.path('/bubble/' + timelineEventLocations[itemNum-1].event.id);
			$scope.$apply();
		}

		//This function takes information that is calculated in the createTimeline function and dynamically adds an event circle and popup
		function drawEvent (event, yearGap, timelineHeight, minYear, maxYear, blankAreaOnSideOfTimeline) {
			var sectionMinYear;
			for (var i = minYear; i < maxYear; i += yearGap) {
				if (moment(event.when).year() >= i) { //
					sectionMinYear = i;
				}
			}
			numberShownEvents++;

			var sectionsSkipped = (sectionMinYear - minYear)/yearGap;

			var momentMin = moment("Jan 01 " + sectionMinYear + "");
			var momentMax = moment("Jan 01 " + (sectionMinYear + yearGap) + "");
			var momentEvent = moment(event.when);

			var percentDistBetween = ((momentEvent - momentMin)/(momentMax - momentMin));
			var xPos = blankAreaOnSideOfTimeline + (120 * sectionsSkipped) + (120 * percentDistBetween);

			var div = '<div class="eventCircle" id="event-' + numberShownEvents + '" style="top:' + (timelineHeight - 6) + 'px;left:' + (xPos - 7.5) + 'px;">';

			timelineEventLocations.push({numberShownEvents, xPos, timelineHeight, event});

			var innerdiv = '<div class="timelinePopup" ';
			if ((momentEvent.year() - minYear)/yearGap <= 2) { //Circle is within the first 2 timeline sections
				innerdiv += 'style="left:0;>"';
			}
			else if ((maxYear - momentEvent.year())/yearGap <= 2) { //Circle is within the last 2 timeline sections
				innerdiv += 'style="left:-300px;>"';
			}
			else { //Circle is in the middle of the timeline
				innerdiv += 'style="left:-150px;>"';
			}
			innerdiv += "</br>";//Dummy thing to make first line show.
			innerdiv += "<b>Who</b>: " + event.who + "</br>" + "<b>What</b>: " + event.what + "</br>" + "<b>When</b>: " + event.when + "</br>" + "<b>Where</b>: " + event.where;
			innerdiv += '</div>';

			div += innerdiv;
			div += '</div>';

			$("#scrolling-timeline").append(div);

			var curEvent = document.getElementById("event-" + numberShownEvents);
			curEvent.onclick = eventClick;
		}

		//This function draws text on the timeline space centered at the given coordinates
		function drawText(x, y, text) {
			var div = '<div style="position:absolute;height:12px;width:30px;font-size:12px;top:' + (y - 6) + 'px;left:' + (x - 15) + 'px;">' + text + '</div>';
			$("#scrolling-timeline").append(div);
		}

		//This function draws the lines for the timeline. It has the ability to draw lines between any two given points.
		function DrawLine(x1, y1, x2, y2) {
			if (y1 < y2) {
				var pom = y1;
				y1 = y2;
				y2 = pom;
				pom = x1;
				x1 = x2;
				x2 = pom;
			}

			var a = Math.abs(x1 - x2);
			var b = Math.abs(y1 - y2);
			var c;
			var sx = (x1 + x2) / 2;
			var sy = (y1 + y2) / 2;
			var width = Math.sqrt(a * a + b * b);
			var x = sx - width / 2;
			var y = sy;

			a = width / 2;

			c = Math.abs(sx - x);

			b = Math.sqrt(Math.abs(x1 - x) * Math.abs(x1 - x) + Math.abs(y1 - y) * Math.abs(y1 - y));

			var cosb = (b * b - a * a - c * c) / (2 * a * c);
			var rad = Math.acos(cosb);
			var deg = (rad * 180) / Math.PI;

			var htmlns = "http://www.w3.org/1999/xhtml";
			var div = document.createElementNS(htmlns, "div");
			div.setAttribute('style', 'border:2px solid black;width:' + width + 'px;height:0px;-moz-transform:rotate(' + deg + 'deg);-webkit-transform:rotate(' + deg + 'deg);position:absolute;top:' + y + 'px;left:' + x + 'px;');

			document.getElementById("scrolling-timeline").appendChild(div);

		}

		//This function returns the lowest date out of all of the events.
		function getMinDate(events) {
			var minDate;
			for (var i in events) {
				if (!minDate) {
					minDate = moment(events[i].when);
				}
				else if (moment(events[i].when) < minDate) {
					minDate = moment(events[i].when);
				}
			}
			return minDate;
		}

		//This function returns the highest date out of all the events.
		function getMaxDate(events) {
			var maxDate;
			for (var i in events) {
				if (!maxDate) {
					maxDate = moment(events[i].when);
				}
				else if (moment(events[i].when) > maxDate) {
					maxDate = moment(events[i].when);
				}
			}
			maxDate.add(1, 'years');
			return maxDate;
		}

		//This function is a helper function for the createTimelineImage in order to remove people from the totalTimelineEvents
		function removeFromTotalEvents (name) {
			var newTotalEvents = [];

			for (var i in totalTimelineEvents) {
				if (totalTimelineEvents[i][0].who != name) {
					newTotalEvents.push(totalTimelineEvents[i]);
				}
			}

			totalTimelineEvents = newTotalEvents;

			$("#timelineContainer").empty(); //Delete any other timelines that are currently shown.

			//Need to check if there is only one event in order to fix the name.
			if (totalTimelineEvents.length == 1) {
				createTimeline(totalTimelineEvents, false, totalTimelineEvents[0][0].who);
			}
			else {
				createTimeline(totalTimelineEvents);
			}
		}

		//This function creates the image and bubble to the left of the timelines
		function createTimelineImage(centerX, centerY, personName) {
			var div = $('<div />', {
				"class": 'timelineImage'
			});

			div.on("click", function(e){
				var curName = $(this).find('.timelineName').text();
				removeFromTotalEvents(curName);
			});

			var fa = '<i class="fa fa-user"></i>';

			div.append(fa);

			var person = '<p class="timelineName">';
			if (personName) {
				person += personName + '</p>';
			}
			else {
				person += $scope.person + '</p>';
			}

			div.append(person);

			var divWidth = 50;
			var divHeight = 50;
			div.css('left', centerX - divWidth );
			div.css('top', centerY - divHeight);

			$("#timelineDrawSpace").append(div);
		}

		//This function checks if there are several objects close together that may overlap eachother.
		function checkCloseObjects (events, yearGap, minYear, maxYear) {
			var arr = [];
			var needsAdjustment = false;
			for (var i = 0; i < (maxYear - minYear); i++) {
				arr[i] = 0;
			}

			for (var i in events) {
				var eventYear = moment(events[i].when).year();
				arr[(eventYear - minYear)] += 1;
				if (arr[(eventYear - minYear)] > 2) {
					needsAdjustment = true;
					break;
				}
			}
			if (needsAdjustment) {
				switch (yearGap) {
					case 10:
						yearGap = 5;
						break;
					case 5:
						yearGap = 2;
						break;
					case 2:
						yearGap = 1;
						break;
					default:
						yearGap = yearGap/2;
						break;
				}
			}

			return yearGap;
		}

		//This function calculates how much timelines need to be moved right or left in order for them to line up.
		function calculateEventSeparations(event1, event2, event3) {
			if (!event2) {
				return;
			}

			var minDate1, minDate2, minDate;

			if (event3) {
				var minDate3;

				minDate1 = getMinDate(event1);
				minDate2 = getMinDate(event2);
				minDate3 = getMinDate(event3);

				if (minDate1 < minDate2) {
					if (minDate1 < minDate3) {
						minDate = minDate1;
					}
					else {
						minDate = minDate3;
					}
				}
				else {
					if (minDate2 < minDate3) {
						minDate = minDate2;
					}
					else {
						minDate = minDate3;
					}
				}

				if (minDate.year() % 2 == 1) {
					minDate = minDate.subtract(1, 'years');
				}

				return [
					{
						"yearDiff": (minDate1.year() - minDate.year())
					},{
						"yearDiff": (minDate2.year() - minDate.year())
					},{
						"yearDiff": (minDate3.year() - minDate.year())
					}
				];
			}
			else {
				minDate1 = getMinDate(event1);
				minDate2 = getMinDate(event2);

				if (minDate1 < minDate2) {
					minDate = minDate1;
				}
				else {
					minDate = minDate2;
				}

				if (minDate.year() % 2 == 1) {
					minDate = minDate.subtract(1, 'years');
				}

				return [
					{
						"yearDiff": (minDate1.year() - minDate.year())
					},{
						"yearDiff": (minDate2.year() - minDate.year())
					}
				];
			}
		}

		//This function generates the timeline. It calls most other functions.
		function createTimeline(totalEvents, location, personName, gapBeginning, inYearGap) {
			if (totalEvents.length == 1) {
				var events = totalEvents[totalEvents.length - 1];
				var cont = $("#timelineContainer");
				var viewWidth = cont.width();
				var viewHeight = cont.height();
				var switchNum = (location ? location : 2);
				var midlineHeight;
				switch(switchNum) {
					case 1:
						midlineHeight = viewHeight / 4;
						break;
					case 2:
						midlineHeight = viewHeight / 2;
						break;
					case 3:
						midlineHeight = 3 *(viewHeight / 4);
						break;
					default:
						midlineHeight = viewHeight / 2;
						break;
				}

				//Calculate how many sections of 10 years are needed.
				var minDate = getMinDate(events);
				var maxDate = getMaxDate(events);

				var minYear = minDate.year();
				var maxYear = maxDate.year();

				var sectionsNeeded;
				var yearGap = 10;

				if (maxYear - minYear < 80) {
					yearGap = 5;
				}
				if (maxYear - minYear < 40) {
					yearGap = 2;
				}

				yearGap = checkCloseObjects(events, yearGap, minYear, maxYear);

				if (inYearGap) {
					yearGap = inYearGap;
				}

				if (minYear % yearGap != 0) {
					minYear -= (minYear % yearGap);
				}
				if (maxYear % yearGap != 0) {
					maxYear += (yearGap - (maxYear % yearGap));
				}

				sectionsNeeded = (maxYear - minYear)/yearGap;

				if (sectionsNeeded < 8 && !inYearGap) {
					//Expand the timeline
					switch (yearGap) {
						case 10:
							if (sectionsNeeded < 4) { //Need to expand to use the 2 year gap
								if (sectionsNeeded == 1) { //There were only 1 section need to expand to use the 1 year gap
									yearGap = 1;
									sectionsNeeded *= 10;
								}
								else {
									yearGap = 2;
									sectionsNeeded *= 5;
								}
							}
							else {
								yearGap = 5;
								sectionsNeeded *= 2;
							}
							break;
						case 5:
							if (sectionsNeeded == 1) { //There was only 1 section. Need to expand to use the 1 year gap
								yearGap = 1;
								sectionsNeeded *= 5;
							}
							else { //The timeline needs to be expanded and use the 2 year gap.
								yearGap = 2;
								sectionsNeeded *= (5/2);
							}
							break;
						case 2:
							sectionsNeeded *= 2;
							yearGap = 1;
							break;
					}
				}

				var blankAreaOnSideOfTimeline = 30;
				if (gapBeginning) {
					blankAreaOnSideOfTimeline += gapBeginning;
				}

				//Create a div for the timeline
				var timelineSpace = '<div id="timelineDrawSpace" class="timelineDrawSpace" style="width:' + (viewWidth - 110) + 'px"><div id="scrolling-timeline" class="scrolling-timeline" style="width:' + ((sectionsNeeded * 120) + (2 * blankAreaOnSideOfTimeline)) + 'px"></div></div>';

				cont.append(timelineSpace);

				if (personName) {
					createTimelineImage(410, midlineHeight, personName);
				}
				else  {
					createTimelineImage(410, midlineHeight);
				}

				//100px + 10px border to the left of the line for the picture.
				//Also has a 10px border on the right of the line to be visually pleasing.
				var lineWidth = blankAreaOnSideOfTimeline + (sectionsNeeded * 120);

				DrawLine(blankAreaOnSideOfTimeline, midlineHeight, lineWidth, midlineHeight);
				for (var i = 0; i <= sectionsNeeded; i++) {
					DrawLine((blankAreaOnSideOfTimeline + (120 * i)), (midlineHeight - 20), (blankAreaOnSideOfTimeline + (120 * i)), (midlineHeight + 20));
					drawText((blankAreaOnSideOfTimeline + (120 * i)), (midlineHeight + 28), "" + (minYear + (yearGap * i)) + "");
				}

				//Draw all of the events.
				for (var i in events) {
					drawEvent(events[i], yearGap, midlineHeight, minYear, maxYear, blankAreaOnSideOfTimeline);
				}
			}
			else if (totalEvents.length < 1) {

			}
			else {
				if (totalEvents.length == 2) {
					var event1 = totalEvents[0];
					var event2 = totalEvents[1];

					var values = calculateEventSeparations(event1, event2);

					createTimeline([event1], 2, event1[0].who, 120 * Math.floor(values[0].yearDiff/2), 2);
					createTimeline([event2], 1, event2[0].who, 120 * Math.floor(values[1].yearDiff/2), 2);
				}
				else {
					var event1 = totalEvents[0];
					var event2 = totalEvents[1];
					var event3 = totalEvents[2];

					var values = calculateEventSeparations(event1, event2, event3);

					createTimeline([event1], 2, event1[0].who, 120 * Math.floor(values[0].yearDiff/2), 2);
					createTimeline([event2], 1, event2[0].who, 120 * Math.floor(values[1].yearDiff/2), 2);
					createTimeline([event3], 3, event3[0].who, 120 * Math.floor(values[2].yearDiff/2), 2);
				}
			}
		}

		//This function generates the list of people on the list to the left.
		function generatePeople() {
			var people = [];
			var currentPerson = "";
			for (var i in $scope.allItems) {
				if (!currentPerson || $scope.allItems[i].who != currentPerson) {
					currentPerson = $scope.allItems[i].who;
					people.push(currentPerson);
				}
			}
			people = $.unique(people);
			$scope.people = people;
		}

		DatabaseControlService.ensureDataPopulated().then(function () {
			$scope.allItems = DatabaseControlService.getItems();
			generatePeople();
			$(".se-pre-con").fadeOut("slow");
		});

		//Create variables in order to access certain DOM elements
		var screen = document.getElementById("wholeScreen");
		var sideBar = document.getElementById("sideBar");
		var viewContainer = document.getElementById("viewContainer");
		var timelineContainer = document.getElementById("timelineContainer");
		var bubbleContainer = document.getElementById("bubbleContainer");
		var html = document.documentElement;

		//Get the dimensions of the screen.
		var height = html.clientHeight;
		var width = html.clientWidth;

		//Set dom elements to certain heights and widths depending on the screen dimensions
		screen.setAttribute("style", "height:" + height + "px;width:" + width + "px;");
		sideBar.setAttribute("style", "height:" + height + "px;width:" + 350 + "px;");
		viewContainer.setAttribute("style", "height:" + height + "px;width:" + (width - 350) + "px;");
		timelineContainer.setAttribute("style", "height:" + height + "px;width:" + (width - 350) + "px;");
		bubbleContainer.setAttribute("style", "height:" + height + "px;width:" + (width - 350) + "px;");

		//Function that does the above section whenever the screen is resized.
		window.onresize = function () {
			height = html.clientHeight;
			width = html.clientWidth;

			screen.setAttribute("style", "height:" + height + "px;width:" + width + "px;");
			sideBar.setAttribute("style", "height:" + height + "px;width:" + 350 + "px;");
			viewContainer.setAttribute("style", "height:" + height + "px;width:" + (width - 350) + "px;");
			timelineContainer.setAttribute("style", "height:" + height + "px;width:" + (width - 350) + "px;");
			bubbleContainer.setAttribute("style", "height:" + height + "px;width:" + (width - 350) + "px;");
		};
	}]);