/*
Copyright (c) 2012 mileskabal.com
Licensed under a Creative Commons
Attribution - NonCommercial - ShareAlike 3.0 Unported License

Author: Miles
Version: 1
Date: 17th November 2012
http://creativecommons.org/licenses/by-nc-sa/3.0/
http://www.mileskabal.com
*/
String.prototype.addslashes = function(){return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');};

var oSubsonic;
var milesPlaylist;
var milesPlaylistEmpty = true;
var posFolder = 0;
var posFolderId = new Array();
var activeSearch = false;
var offsetSongSearch = 0;
var offsetAlbumSearch = 0;
var offsetAlbumList = 0;
var albumListLabel = new Array();
albumListLabel['newest'] = 'Recently added';
albumListLabel['frequent'] = 'Most played';
albumListLabel['recent'] = 'Recently played';
albumListLabel['random'] = 'Random';
albumListLabel['highest'] = 'Highest';
albumListLabel['starred'] = 'Starred';

$(document).ready(function(){
	
	//if we have already the settings in localStorage else we init the settings
	if(localStorage['pass'] && localStorage['user'] && localStorage['server']){
		connectSubsonic();
	}
	else{
		initConfig();
	}
	
	$("#a_bouton").live("click", function(){
		saveConfig();
	});
	
	$("#menu ul li a.listfile").live("click", function(){ 
		root = false;
		if($(this).data('root') == '1'){
			root = true;
		}
		listFile($(this).data('id'),$(this).data('name'),root);
	}); 
	$("#musicFolders .folderContent div.dir a.isdir, #musicFolders #albumsearch div.dir a.isdir").live("click", function(){ 
		listFile($(this).data('id'),$(this).data('title'),false);
	});
	$("#breadcrumb ul li.link a").live("click", function(){ 
		if($(this).data('extra')){			
			if($(this).data('id') == 'albumlist'){
				activeSearch = false;
				offsetAlbumList=0;
				albumList($(this).data('extra'),offsetAlbumList);
			}
			if($(this).data('id') == 'search'){
				activeSearch = false;
				search($(this).data('extra'));
			}
			if($(this).data('id') == 'playlist'){
				activeSearch = false;
				showPlaylist();
			}
		}
		else{
			root = false;
			if($(this).data('root') == '1'){
				root = true;
			}
			listFileBc($(this).data('pos'),$(this).data('id'),$(this).data('name'),root);
		}
	}); 
	$("#musicFolders .soundContent ul li a.milesSound, #musicFolders ul li a.milesSoundPlaylist").live("click", function(){ 
		addPlaylist($(this).data('id'));
	});
	$("#musicFolders .soundContent .albumsound a.playall").live("click", function(){ 
		playAll();
	});
	$("#musicFolders .soundContent .albumsound a.addall").live("click", function(){ 
		addAll();
	});
	$("#musicFolders .soundContent div.content a.playplaylistsound").live("click", function(){ 
		playPlaylistSound($(this).data('id'));
	});
	$("#musicFolders .soundContent div.content a.addplaylistsound").live("click", function(){ 
		addPlaylistSound($(this).data('id'));
	});
	$("#musicFolders .soundContent div.content a.deleteplaylistsound").live("click", function(){ 
		deletePlaylistSound($(this).data('id'));
	});
	
	$("#menu ul li a.showplaylist").live("click", function(){ 
		showPlaylist();
	});
	$("#mymodal a.saveplaylist").live("click", function(){ 
		savePlaylist();
	});
	$("a#offsetalbum").live("click", function(){ 
		searchMoreAlbum($(this).data('query'));
	});
	$("a#offsetsong").live("click", function(){ 
		searchMoreSong($(this).data('query'));
	});
	
	
	$("#menu ul li a.albumlist").live("click", function(){ 
		offsetAlbumList=0;
		albumList($(this).data('type'),offsetAlbumList);
	});
	$("a#offsetalbumlist").live("click", function(){ 
		albumList($(this).data('type'),offsetAlbumList);
	});
	
	
	$("#player div.togglelist a.popupplaylist").click(function(){ 
		popupPlaylist();
	});
	$("#player div.togglelist a.playlistlink").click(function(){ 
		togglelist();
	});
	$("#player div.togglelist a.settings").click(function(){ 
		if(!activeSearch){
			initConfig();
		}
	});
	$('input#searchquery').focus(function() {
		searchActive();
	});
	$('input#searchquery').blur(function() {
		searchDesactive();
	});
	
});

//Function init config
function initConfig(){
	activeSearch = true;
	$('#musicFolders .content').html(htmlConfig());
	breadcrumb('config','Setting',false);
}

//Function config
function htmlConfig(){
	var html = '';
	var user = '';if(localStorage['user']){user=localStorage['user'];}
	var server = '';if(localStorage['server']){server=localStorage['server'];}
	html += '<div class="contentbar configContent">';
	html += '<div class="header">Settings</div>';
	html += '<div class="content">';
	html += '<p><span>Server : </span><input type="text" id="input_server" value="'+server+'" /></p>';
	html += '<p><span>User : </span><input type="text" id="input_user" value="'+user+'" /></p>';
	html += '<p><span>Pass : </span><input type="password" id="input_password" /></p>';
	html += '<p><a id="a_bouton" class="bouton">save</a></p>';
	html += '<div class="clear"></div>';
	html += '</div>';
	html += '</div>';
	return html;
}

//Function save config
function saveConfig(){
	var pass = hexEncode($("#input_password").val());
	var user = $("#input_user").val();
	var server = $("#input_server").val();
	if(pass != ''){localStorage['pass'] = pass};
	localStorage['user'] = user;
	localStorage['server'] = server;
	$('#musicFolders .content').html('settings saved');	
	connectSubsonic();
	activeSearch = false;
}

//Function to encode to hexadecimal
function hexEncode(n) {
    for (var u = "0123456789abcdef", i = [], r = [], t = 0; t < 256; t++)
        i[t] = u.charAt(t >> 4) + u.charAt(t & 15);
    for (t = 0; t < n.length; t++)
        r[t] = i[n.charCodeAt(t)];
    return r.join("")
}

//Connexion  à Subsonic
function connectSubsonic(){
	activeSearch = false;
	if(oSubsonic == null || oSubsonic == undefined){
		oSubsonic = new Subsonic(localStorage['server'],localStorage['user'],localStorage['pass']);
		init();
	}
	else{
		if(oSubsonic.ping() == 'failed'){
			oSubsonic = new Subsonic(localStorage['server'],localStorage['user'],localStorage['pass']);
			init();
		}
	}
}

//Interface Initialisation
function init(){
	var menu = oSubsonic.init();
	$('#menu ul').append(menu);
	milesPlaylist = new jPlayerPlaylist(
		{jPlayer: "#jquery_jplayer_1", cssSelectorAncestor: "#jp_container_1"},
		[],
		{ playlistOptions:{enableRemoveControls: true}, swfPath: "Jplayer.swf", supplied: "mp3"}
	);
	milesPlaylistEmpty = false;
	loader(false);
}

//function to display several album list (random, newest, highest, frequent, recent, alphabeticalByName, alphabeticalByArtist, starred)
function albumList(type){
	loader(true);
	var list = oSubsonic.albumlist(type,offsetAlbumList);
	if(offsetAlbumList == 0){
		$('#musicFolders .content').html(list);
		breadcrumb('albumlist',albumListLabel[type],1,type);
	}
	else{
		$('#musicFolders .content .folderContent .content div#div_offsetalbumlist').before(list);
	}
	offsetAlbumList++;
	loader(false);
	activeSearch = false;
}

//Function to display popup in order to save current playlist
function popupPlaylist(){
	activeSearch = true;
	playlistlisting = oSubsonic.popupplaylist();
	$.modal(
		playlistlisting,
		{
		  overlayClose:true,
		  onOpen: function (dialog) {
			dialog.overlay.fadeIn('fast', function () {
			  dialog.data.hide();
			  dialog.container.fadeIn('fast', function () {
				dialog.data.slideDown('fast');
			  });
			});
		  },
		  onClose: function () {
			if(posFolderId[posFolder-1] != undefined){
				if(posFolderId[posFolder-1][1] != 'config'){
					activeSearch = false;
				}
			}
			else{
				activeSearch = false;
			}
			$.modal.close();
		  }
		}
	);
}

//Function to save playlist from popup
function savePlaylist(){
	if(milesPlaylist['playlist'].length){
		
		var param = '';
		var value = '';
		if($('#selectplaylist').val() != ''){
			param = 'playlist';
			value = $('#selectplaylist').val();
		}
		if($('#inputplaylist').val() != ''){
			param = 'name';
			value = $('#inputplaylist').val();
		}
		
		if(param != ''){
		  var songid = '';
		  for(var i=0;i<milesPlaylist['playlist'].length;i++){
		  	songid += '&songId='+milesPlaylist['playlist'][i]['id'];
		  }
		  
		  save = oSubsonic.saveplaylist(songid,param,value);
		  if(save != 'ok'){
			alert(save);
		  }
		}
		else{
			alert('empty name field or no playlist selected');
		}
	}
	else{
		alert('no file in current playlist');
	}
	$.modal.close();
	if(posFolderId[posFolder-1] != undefined){
		if(posFolderId[posFolder-1][1] != 'config'){
			activeSearch = false;
		}
	}
	else{
		activeSearch = false;
	}
}

//Function to delete a playlist
function deletePlaylistSound(id){
 if (confirm("It will remove permanently the playlist, are you sure ?")){ 
	del = oSubsonic.deletePlaylist(id);
	if(del != 'ok'){
		alert(del);
	}
	else{
		$('#content_playlist_'+id).remove();
	}
 }
}

//Function in order to move song in the current playlist
$(function() {
	$( "#ulplaylistlist" ).sortable({
		update: function(event, ui) {
			
			var newplaylist = [];
			var newcurrent = 0;
			$("#ulplaylistlist li a.jp-playlist-item").each(function(i){
				if($(this).hasClass('jp-playlist-current')){
					newcurrent = i;
				}
				newplaylist.push(milesPlaylist['playlist'][$(this).data('index')]);
			});
			milesPlaylist['current'] = newcurrent;
			milesPlaylist['playlist'] = newplaylist;
			milesPlaylist._refresh();
			$("#ulplaylistlist li a.jp-playlist-item").eq(newcurrent).addClass('jp-playlist-current');
			$("#ulplaylistlist li").eq(newcurrent).addClass('jp-playlist-current');
		}
	});
	$( "#ulplaylistlist" ).disableSelection();
});

//Hide/Display loader
function loader(val){
  if(val){
	$('#loader').css('display','block');
  }
  else{
	$('#loader').css('display','none');
  }
}

//Display subsonic's playlist in main view
function showPlaylist(){
  loader(true);
  playlist = oSubsonic.playlists();
  $('#musicFolders .content').html(playlist);
  breadcrumb('playlist','Playlists',true,'playlist');
  loader(false);
}

//Display subsonic's playlist detail
function detailPlaylist(id){
  loader(true);
  playlist = oSubsonic.playlist(id);
  $('#playlist_'+id).parent().find('.content').html(playlist);
  $('#playlist_'+id).parent().find('.content').slideToggle();
  loader(false);
}

//listFile for browsing in main view
function listFile(id,name,root){
  loader(true);
  musicFolder = oSubsonic.listFile(id);
  $('#musicFolders .content').html(musicFolder);
  breadcrumb(id,name,root);
  loader(false);
  activeSearch = false;
}

//listFile for browsing from breadcrumb
function listFileBc(pos,id,name,root){
  var diff = posFolder - pos;
  for(var i=0;i<=diff;i++){
    posFolderId.pop();
  }
  posFolder = posFolderId.length;
  listFile(id,name,root);
}

//Make the breadcrumb
function breadcrumb(id,name,root,extra){
  if(root){
    posFolder = 1;
    if(extra){
		posFolderId = new Array([posFolder,id,name,extra]);		
	}
	else{
		posFolderId = new Array([posFolder,id,name]);
	}
  }
  else{
    posFolder++;
    posFolderId.push([posFolder,id,name]);
  }
  var bc = '';
  bc += '<ul>';
  for(var i=0;i<posFolderId.length;i++){
    var posfold = posFolderId[i][0];
    var idfold = posFolderId[i][1];
    var namefold = posFolderId[i][2];
    var rootbool = '0';
    var extradata = '';
    if(i==0){rootbool = '1';}
    if(posFolderId[i][3]){extradata = ' data-extra="'+posFolderId[i][3]+'"';}
    if(i != posFolderId.length-1){
		bc += '<li class="link">';
		bc += '<a href="#" data-pos="'+posfold+'" data-id="'+idfold+'" data-name="'+namefold.addslashes()+'" data-root="'+rootbool+'"'+extradata+'>';
		bc += namefold; 
		bc += '</a>';
		bc += '</li>';
	}
	else{
		bc += '<li><span>';
		bc += namefold; 
		bc += '</span></li>';
	}
  }
  bc += '</ul>';
  $('#breadcrumb').html(bc);
}

//Make playlist from displayed sound in main view
function makePlaylist(playlistid){
  var selector = 'a.milesSound';
  if(playlistid){
    selector = '#content_playlist_'+playlistid+' a.milesSoundPlaylist';
  }
  var playlist = [];
  $('#musicFolders .content '+selector).each(function(){
    playlist.push({
      title:$(this).data('title'),
      artist:$(this).data('artist'),
      album:$(this).data('album'),
      genre:$(this).data('genre'),
      track:$(this).data('track'),
      id:$(this).data('id'),
      duration:$(this).data('duration'),
      poster:$(this).data('poster'),
      mp3:$(this).data('url')
    });
  });
  if(playlist.length){
    return playlist;
  }
  else{
    return false;
  }
}

//Play all selected sounds and replace 
function playAll(){
  var playlist;
  if(playlist = makePlaylist()){
    if(milesPlaylistEmpty){
      milesPlaylistEmpty = false;
    }
    else{
      milesPlaylist.remove();
      $("#jquery_jplayer_1").jPlayer("destroy");
    }
    milesPlaylist = new jPlayerPlaylist(
      {jPlayer: "#jquery_jplayer_1", cssSelectorAncestor: "#jp_container_1"},
      playlist,
      { playlistOptions:{autoPlay: true, enableRemoveControls: true}, swfPath: "Jplayer.swf", supplied: "mp3"}
    );
  }
}

//add all selected sounds in playlist or create a playlist if there is not current playlist
function addAll(){
  if(milesPlaylistEmpty){
    var playlist;
    if(playlist = makePlaylist()){
      milesPlaylist = new jPlayerPlaylist(
        {jPlayer: "#jquery_jplayer_1", cssSelectorAncestor: "#jp_container_1"},
        makePlaylist(),
        { playlistOptions:{enableRemoveControls: true},swfPath: "Jplayer.swf", supplied: "mp3"}
      );
      milesPlaylistEmpty = false;
    }
  }
  else{
    $('#musicFolders .content a.milesSound').each(function(){
      // milesPlaylist.add({
      milesPlaylist['playlist'].push({
        title:$(this).data('title'),
        artist:$(this).data('artist'),
        album:$(this).data('album'),
        genre:$(this).data('genre'),
        track:$(this).data('track'),
        id:$(this).data('id'),
        duration:$(this).data('duration'),
        poster:$(this).data('poster'),
        mp3:$(this).data('url')
      });
    });
	milesPlaylist._refresh();
	$("#ulplaylistlist li a.jp-playlist-item").eq(milesPlaylist['current']).addClass('jp-playlist-current');
	$("#ulplaylistlist li").eq(milesPlaylist['current']).addClass('jp-playlist-current');
  }
}

function playPlaylistSound(id){
  var playlist;
  if(playlist = makePlaylist(id)){
    if(milesPlaylistEmpty){
      milesPlaylistEmpty = false;
    }
    else{
      milesPlaylist.remove();
      $("#jquery_jplayer_1").jPlayer("destroy");
    }
    milesPlaylist = new jPlayerPlaylist(
      {jPlayer: "#jquery_jplayer_1", cssSelectorAncestor: "#jp_container_1"},
      playlist,
      { playlistOptions:{autoPlay: true, enableRemoveControls: true}, swfPath: "Jplayer.swf", supplied: "mp3"}
    );
  }
}

function addPlaylistSound(id){
  if(milesPlaylistEmpty){
    var playlist;
    if(playlist = makePlaylist(id)){
      milesPlaylist = new jPlayerPlaylist(
        {jPlayer: "#jquery_jplayer_1", cssSelectorAncestor: "#jp_container_1"},
        makePlaylist(id),
        { playlistOptions:{enableRemoveControls: true},swfPath: "Jplayer.swf", supplied: "mp3"}
      );
      milesPlaylistEmpty = false;
    }
  }
  else{
    $('#musicFolders .content #content_playlist_'+id+' a.milesSoundPlaylist').each(function(){
      // milesPlaylist.add({
      milesPlaylist['playlist'].push({
        title:$(this).data('title'),
        artist:$(this).data('artist'),
        album:$(this).data('album'),
        genre:$(this).data('genre'),
        track:$(this).data('track'),
        id:$(this).data('id'),
        duration:$(this).data('duration'),
        poster:$(this).data('poster'),
        mp3:$(this).data('url')
      });
    });
	milesPlaylist._refresh();
	$("#ulplaylistlist li a.jp-playlist-item").eq(milesPlaylist['current']).addClass('jp-playlist-current');
	$("#ulplaylistlist li").eq(milesPlaylist['current']).addClass('jp-playlist-current');
  }
}

function addPlaylist(sound){
  var $sound = $('#sound_'+sound);
  if(milesPlaylistEmpty || !milesPlaylist['playlist'].length){
	milesPlaylist.remove();
    $("#jquery_jplayer_1").jPlayer("destroy");
    milesPlaylist = new jPlayerPlaylist(
      {jPlayer: "#jquery_jplayer_1", cssSelectorAncestor: "#jp_container_1"},
      [{
          title:$sound.data('title'),
          artist:$sound.data('artist'),
          album:$sound.data('album'),
          genre:$sound.data('genre'),
          track:$sound.data('track'),
          id:$sound.data('id'),
          duration:$sound.data('duration'),
          poster:$sound.data('poster'),
          mp3:$sound.data('url')
        }],
      { playlistOptions:{autoPlay: true, enableRemoveControls: true}, swfPath: "Jplayer.swf", supplied: "mp3"}
    );
  }
  else{
    // milesPlaylist.add({
    milesPlaylist['playlist'].push({
      title:$sound.data('title'),
      artist:$sound.data('artist'),
      album:$sound.data('album'),
      genre:$sound.data('genre'),
      track:$sound.data('track'),
      id:$sound.data('id'),
      duration:$sound.data('duration'),
      poster:$sound.data('poster'),
      mp3:$sound.data('url')
    });
	milesPlaylist._refresh();
	$("#ulplaylistlist li a.jp-playlist-item").eq(milesPlaylist['current']).addClass('jp-playlist-current');
	$("#ulplaylistlist li").eq(milesPlaylist['current']).addClass('jp-playlist-current');
  }
  milesPlaylistEmpty = false;
}

function displaySound(id){
  // milesPlaylist['playlist'][id]['track']
  // milesPlaylist['playlist'][id]['genre']
  // milesPlaylist['playlist'][id]['duration']
  var cover = '<img src="'+milesPlaylist['playlist'][id]['poster']+'" />';
  var current = milesPlaylist['playlist'][id]['title']+' - '+milesPlaylist['playlist'][id]['artist']+' - '+milesPlaylist['playlist'][id]['album'];
  $('.coverart').html(cover);
  $('.currentsong').html(current);
}

//Switch to disable play/pause space key when you enter search
function searchDesactive(){
activeSearch = false;
}
function searchActive(){
activeSearch = true;
}

//function to launch a search
function search(optionnal){
	offsetSongSearch = 0;
	offsetAlbumSearch = 0;
	loader(true);
	reponse = '';
	var query = $('#searchquery').val();
	if(optionnal){query = optionnal}
	reponse = oSubsonic.search(query);
	if(reponse != ''){
		$('#musicFolders .content').html(reponse);
		breadcrumb('search','Search for : '+query,true,query);
		offsetSongSearch = 1;
		offsetAlbumSearch = 1;
		$("#menu ul li").removeClass('active');
	}
	else{
		alert('no result');
	}
	loader(false);
}

//function to launch for more songs for search result
function searchMoreSong(query){
	loader(true);
	reponse = '';
	reponse = oSubsonic.searchmoresong(query,offsetSongSearch);
	if(reponse != ''){
		$('#musicFolders .content ul.listingSong').append(reponse);
		offsetSongSearch++;
	}
	else{
		$('#offsetsong').html('no more result');
	}
	loader(false);
}

//function to launch for more albums for search result
function searchMoreAlbum(query){
	loader(true);
	reponse = oSubsonic.searchmorealbum(query,offsetAlbumSearch);
	reponse = '';
	if(reponse != ''){
		$('#musicFolders .content #albumsearch').append(reponse);
		offsetAlbumSearch++;
	}
	else{
		$('#offsetalbum').html('no more result');
	}
	loader(false);
}

//fold/unfold listing (albums or songs)
$(".contentbar .header").live("click", function(){
	if($(this).data('id')){
		if($(this).parent().find('.content').html() == ''){
			detailPlaylist($(this).data('id'));
		}
		else{
			$(this).parent().find('.content').slideToggle();
		}
	}
	else{
		$(this).parent().find('.content').slideToggle();
	}
});

//Menu animation and toggleclass
$("#menu ul li:not(.separator)").live("click", function(){
	$("#menu ul li").removeClass('active');
	$(this).addClass('active');
});
$("#menu ul li:not(.separator)").live("mouseover", function(){
	$(this).stop().animate({ paddingLeft: "10px" }, 200);
});
$("#menu ul li:not(.separator)").live("mouseout", function(){
	$(this).stop().animate({ paddingLeft: "5px" }, 200);
});


function togglelist(){
	$(".togglelist a.playlistlink").toggleClass('closed');
	$("div.jp-playlist").toggle();
	$("#main").toggleClass('noright');
}
function togglefolder(){
	$("div#menu").toggle();
	$("#main").toggleClass('noleft');
}

function destroy(){
  milesPlaylist.remove();
  milesPlaylistEmpty = true;
  $("#jquery_jplayer_1").jPlayer("destroy");
}

function playpause(){
  if(!milesPlaylistEmpty){
    if($("#jquery_jplayer_1").data("jPlayer").status.paused){
      milesPlaylist.play();
    }
    else{
      milesPlaylist.pause();
    }
  }
}

function volup(){
  if(!milesPlaylistEmpty){
    var volume = $("#jquery_jplayer_1").data("jPlayer").options.volume;
    if(volume < 0.9){
      $("#jquery_jplayer_1").jPlayer("volume",volume+0.1);
    }
  }
}
function voldown(){
  if(!milesPlaylistEmpty){
    var volume = $("#jquery_jplayer_1").data("jPlayer").options.volume;
    if(volume > 0.1){
      $("#jquery_jplayer_1").jPlayer("volume",volume-0.1);
    }
  }
}
function backfolder(){
  if(posFolder > 1){
    $('ul li.link a').eq(posFolder-2).click();
  }
}

//JWERTY
jwerty.key('space',function(){
if(!activeSearch){
  playpause();
}
}); 
jwerty.key('↑',function(){
if(!activeSearch){
  volup();
}
}); 
jwerty.key('↓',function(){
if(!activeSearch){
 voldown();
} 
}); 
jwerty.key('→',function(){
if(!activeSearch){
  if(!milesPlaylistEmpty){
    milesPlaylist.next();
  }
}
}); 
jwerty.key('←',function(){
if(!activeSearch){
  if(!milesPlaylistEmpty){
    milesPlaylist.previous();
  }
}
});
jwerty.key('a',function(){
if(!activeSearch){
  addAll();
}
});
jwerty.key('p',function(){
if(!activeSearch){
  playAll();
}
});
jwerty.key('d',function(){
if(!activeSearch){
  destroy();
}
});
jwerty.key('h',function(){
if(!activeSearch){
  togglelist();
}
});
jwerty.key('f',function(){
if(!activeSearch){
  togglefolder();
}
});
jwerty.key('s',function(){
if(!activeSearch){
  popupPlaylist();
}
});
jwerty.key('backspace',function(){
if(!activeSearch){
  backfolder();
}
});
jwerty.key('enter',function(){
if(activeSearch){
  search();
}
});

