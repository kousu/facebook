// ==UserScript==
// @name         Facebook "Likes" Remover
// @namespace    http://jferg.net
// @version      1.0.23
// @description  Remove "Like" feature from Facebook: removes the buttons, the like counters, and notifications/tickers about them
//               
//               Likes are a shallow form of interaction:
//               if one genuinely enjoys something, they can always take the time to comment. Otherwise Likes
//               are just an easy, lazy-brained way to let algorithms think for you and give yourself FOMO.
//               Those who like liking need not install :)
//               Unfortunately, does not currently remove Like buttons embedded on other sites.
//               
//               Requires a UserScript holster like GreaseMonkey (Firefox) or TamperMonkey (Chrome).
//               Load this in. If you are viewing this on GitHub, just click the 'Raw' link: Grease/TamperMonkey
//               will notice the file extension and offer to install it.
//
// @author       J. Ferguson & kousu
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js
// @require      https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
// @match        https://*.facebook.com/*
// @match        http://*.facebook.com/*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

// wrap waitForKeyElements with error handling; without this a single mistake will take down the whole handler, because it runs inside a loop that resets itself.
// I should try to get this error handling rolled into the original, probably.
// XXX I don't know why but it seems that (under Greasemonkey?) using "function waitForKeyElements()" to swap *breaks*: it causes waitForKeyElements_ === waitForKeyElements which is bullllshit 
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

// praise the gods of accessibility, all Like buttons and related elements have a CSS class set to some fixed value
// This will set up a listener for link elements as they load dynamically
waitForKeyElements (".UFILikeLink, .uiLikePageButton, .fbPhotosPhotoLike, .PageLikeButton, .UFILikeSentenceText, .UFICommentLikeIcon, .UFICommentLikeButton, .UFILikeSentenceText, ._53ab, .ego_like, .socialContext", function(n) { n.remove(); });

//ego_section == suggested pages on media viewers
//.socialContext == the "xxx other friends like this" that's on suggested pages

// Kill the little gray "2 Likes" bit that appear under *some* posts
// this doesn't have handy CSS to grab onto
// the _2u_j is just the class that happened to be attached to these the last time I saw them.
// TODO: use regular expressions instead ('\d+ Likes')? Will that drastically lag the whole thing?
waitForKeyElements("span._2u_j", function(n) {
    n = n.get()[0]; // get out of jQuery
    if(n.textContent.indexOf("Likes") != -1) {
        n.remove();
    }
    
});

// kill notifications
waitForKeyElements ("li", function(n) {
    // what we're looking for look like
    // <li class="_3sod _3soe hidden_elem" data-gt="{&quot;notif_type&quot;:&quot;like&quot;,&quot;context_id&quot;:&quot;10153897669733770&quot;,&quot;alert_id&quot;:&quot;1455155772193465&quot;,&quot;unread&quot;:1,&quot;from_uids&quot;:{&quot;1007227487&quot;:1007227487}}" style="opacity: 0; transition-duration: 0ms;">
    var _n = n.get()[0]; // get out of jQuery
    if(_n.dataset && _n.dataset.gt) {
       var metadata = JSON.parse(_n.dataset.gt);
       if(metadata.notif_type) {
           // there's more than one type of 'like' notification:
           // we've observed at least:
           // {"notif_type": 'like'}
           // {"notif_type": 'like_tagged'}
           // {"notif_type": "group_highlights","subtype": "highlights_friend_liker_commenter"}
           // This is a guess, but probably all of them will contain the word "like" in,
           // so if we just drop any notification like that we should be good.
           if(metadata.notif_type.indexOf("like") != -1 || metadata.subtype.indexOf("like") != -1) {
               n.remove();
           }
       }
    }
});

// "<a href="/events/345435435435/permalink/345435435435/?comment_tracking=%7B%22tn%22%3A%22O%22%7D" data-ft="{&quot;tn&quot;:&quot;O&quot;}" data-comment-prelude-ref="action_link_bling" aria-label="12 likes " rel="ignore"><span class="_2u_j">12 Likes</span></a>"
waitForKeyElements("a", function(n) {
    var _n = n.get()[0]; // get out of jQuery
    if(_n.dataset && _n.dataset['comment-prelude-ref'] && _n.dataset['comment-prelude-ref'].value.indexOf("like")!=-1) {
       n.remove();
    }
});

// kill the ticker feed
// it is not labelled so cleanly as the others two cases
// the best we can do is screen-scrape for the word "like"
waitForKeyElements(".fbFeedTickerStory", function(n) {
    var v = $(n).find(".tickerFeedMessage");
    // The inner element of a like ticker looks like
    // "<span class="fwb">Sundry Nightshade</span> likes Brady Zilborn Bennett's post in Matrixology."
    // The quickest way I know to catch this is to coerce to a string and search:
    v = v.get()[0].innerHTML;
    if(v.indexOf("likes")!=-1 && v.indexOf('<span class="fwb">')==0) {
        n.remove();
    }
});
