// ==UserScript==
// @name        Facebook FOMO blocker
// @namespace   http://mydickonfacebooksdick.net
// @version      1.1.1
// @description Facebook is a master of making you have Fear Of Missing Out. This removes the most eregious pushers of that drug. 
// @author       kousu@kousu.ca
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// @require      https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
// @match        https://*.facebook.com/*
// @match        http://*.facebook.com/*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

// wrap waitForKeyElements with error handling; without this a single mistake will take down the whole handler
//      for the entire page, instead of just for the element it crashes on, because it has to reschedule itself
//      with setInterval() every iteration.
// I should try to get this error handling rolled into the original, probably.
// XXX I don't know why but it seems that (under Greasemonkey?) using
//     "function waitForKeyElements()" instead of "var waitForKeyElements = function()" causes
//     waitForKeyElements_ === waitForKeyElements which is bullllshit.
var waitForKeyElements_ = waitForKeyElements;
var waitForKeyElements = function(selector, func) {
  return waitForKeyElements_(selector, function(n) {
    try {
      return func(n);
    } catch(e) {
      console.error("'" + selector + "'" + " handler failed: " + e);
    }
  });
}

if(waitForKeyElements_ === waitForKeyElements) {
    console.error("you fucked up!");
    throw "you fucked up";
}

// Works as of 2016-02-12

// kill the ad/suggested groups/trending news sidebar
waitForKeyElements ("div#rightCol", function(n) {
  n = n.get()[0]; // get out of jQuery
  if(n.attributes.role.value == "complementary") {
    // we should have n.attributes["aria-label"].value == "Reminders, people you may know, and ads" too, but I worry that checking for that will break too easily. What happens if you set the language to French?
    n.remove();
  }
});


//._53ab == the "xxx talking about this" and "xxx like this" in the search results dropdown
// This probably isn't a very stable name to grab onto. It seems to be the result of some kind of optimizing web compiler.
waitForKeyElements("._53ab", function(n) {
  n.remove();
});

// kill suggested pages that appear under comments on media viewers
waitForKeyElements(".ego_section", function(n) {
  n.remove();
});

// kill the page ticker
waitForKeyElements("div#pagelet_ticker", function(n) {
  n.remove();
});

// fill the space it took up with the main feed
waitForKeyElements ("div#contentArea", function(n) {
  n = n.get()[0]; // get out of jQuery
  if(n.attributes.role.value == "main") {
    n.style.width = "100%";
  }
});

// kill pokes
waitForKeyElements ("li", function(n) {
    // what we're looking for look like
    // <li class="_3sod _3soe hidden_elem" data-gt="{&quot;notif_type&quot;:&quot;poke&quot;,&quot;context_id&quot;:&quot;10153897669733770&quot;,&quot;alert_id&quot;:&quot;1455155772193465&quot;,&quot;unread&quot;:1,&quot;from_uids&quot;:{&quot;1007227487&quot;:1007227487}}" style="opacity: 0; transition-duration: 0ms;">
    var _n = n.get()[0]; // get out of jQuery
    if(_n.dataset && _n.dataset.gt) {
       var metadata = JSON.parse(_n.dataset.gt);
       if(metadata.notif_type) {
           if(metadata.notif_type.indexOf("poke") != -1) {
               n.remove();
           }
       }
    }
});
