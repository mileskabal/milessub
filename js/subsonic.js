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
function Subsonic(hostInit,userInit,pwdInit){
	var host;
	var user;
	var pwd;
	var version;
	var client;
	
	this.ping = function(){
		var url = this.makeUrl('ping','&f=json');
		var ping = this.getJson(url);
		var json = jQuery.parseJSON(ping);
		var status = json['subsonic-response']['status'];
		return status;
	}
	
	this.init = function(){
		var retour='';
		var getjson = this.getJson(this.getIndexes());
		var json = jQuery.parseJSON(getjson);
		var folders = json['subsonic-response']['indexes']['index'];
		var folder = new Array();
		$.each(folders, function() {
			if(this['artist']['id']){
				folder.push(this['artist']);
			}
			else{
				folder = folder.concat(this['artist']);
			}
		});	
		retour = '';
		$.each(folder, function() {
		  retour += '<li>';
		  retour += '<a href="#" class="listfile" data-id="'+this['id']+'" data-name="'+this['name']+'" data-root="1">'+this['name']+'</a>';
		  retour += '</li>';
		});
		return retour;
	}
	
	this.getJson = function(url){
		var retour = $.ajax({async: false,type: "GET",url: url,}).responseText;
		return retour;
	}
	
	this.makeUrl = function(selector,params){
		var url = this.host+'/rest/'+selector+'.view?u='+this.user+'&p=enc:'+this.pwd+'&v='+this.version+'&c='+this.client
		if(params){
			url += params;
		}
		return url;
	}
	
	this.getIndexes = function(id){
		var get = '';
		if(id) get = '&musicFolderId=' + id;
		url = this.makeUrl('getIndexes','&f=json'+get);
		return url; 
	}
	
	this.getMusicDirectory = function(id){
		var url = this.makeUrl('getMusicDirectory','&f=json&id='+id);
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		var array = json['subsonic-response']['directory']['child'];
		if(array['id']){array = new Array(array);}
		return array;
	}
	
	this.getAlbumList = function(type,offset){
		//random, newest, highest, frequent, recent, alphabeticalByName, alphabeticalByArtist, starred
		var url = this.makeUrl('getAlbumList','&f=json&size=20&type='+type+'&offset='+(20*offset));
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		if(json['subsonic-response']['albumList'].toString() == ''){
			var array = new Array();
		}
		else{
			var array = json['subsonic-response']['albumList']['album'];
		}
		return array;
	}
	
	this.getPlaylists = function(){
		var url = this.makeUrl('getPlaylists','&f=json');
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		var array = json['subsonic-response']['playlists']['playlist'];
		if(array['id']){array = new Array(array);}
		return array;
	}
	
	this.getPlaylist = function(id){
		var url = this.makeUrl('getPlaylist','&f=json&id='+id);
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		var array = json['subsonic-response']['playlist']['entry'];
		if(array['id']){array = new Array(array);}
		return array;
	}
	
	this.createPlaylist = function(songid,nameOrId,create){
		var param = '';
		if(create){
			param += '&name='+nameOrId;
		}
		else{
			param += '&playlistId='+nameOrId;			
		}
		param += songid;
		
		var url = this.makeUrl('createPlaylist','&f=json'+param);
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		var statut = json['subsonic-response']['status'];
		return statut;
	}
	
	this.deletePlaylist = function(id){
		var url = this.makeUrl('deletePlaylist','&f=json&id='+id);
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		var statut = json['subsonic-response']['status'];
		return statut;
	}
	
	this.getSearch = function(query){
		var url = this.makeUrl('search2','&f=json&query='+query+'&artistCount=0');
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		var array = json['subsonic-response']['searchResult2'];
		return array;
	}
	
	this.getSearchMoreSong = function(query,offset){
		var url = this.makeUrl('search2','&f=json&query='+query+'&songOffset='+(offset*20)+'&artistCount=0&albumCount=0');
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		var array = json['subsonic-response']['searchResult2'];
		return array;
	}
	
	this.getSearchMoreAlbum = function(query,offset){
		var url = this.makeUrl('search2','&f=json&query='+query+'&albumOffset='+(offset*20)+'&artistCount=0&songCount=0');
		var getjson = this.getJson(url);
		var json = jQuery.parseJSON(getjson);
		var array = json['subsonic-response']['searchResult2'];
		return array;
	}
	
	this.stream = function(id){
		url = this.makeUrl('stream','&id='+id+'&random='+Math.floor(Math.random() * 100000));
		return url;
	}
  
	this.cover = function(id,size){
		thesize = '70';
		if(size){
			thesize = size;
		}
		url = this.makeUrl('getCoverArt','&id='+id+'&size='+thesize);
		return url;
	}
	
	this.listFile = function(id){
		$this = this;
		var retour = '';
		var listing = this.getMusicDirectory(id);
		var listResult = new Array();
        listResult['dir'] = false;
        listResult['video'] = false;
        listResult['sound'] = false;
        var htmlDir = '';
		var htmllist = '';
		var htmlvideo = '';
		var albumName = '';
		var artistName = '';
		var albumCover = '';
		var cpt = 0;
		
		checkalbum = false;
		recTest = '';
		$.each(listing, function() {
			if(!this['isDir'] && !this['isVideo']){
			  checkalbum = true;
			  if(recTest != ''){
				if(recTest == this['album']){
				  checkalbum = true;
				}
				else{
				  checkalbum = false;
				  return false;
				}
			  }
			  else{
				recTest = this['album'];
			  }
			}
			else{
			  checkalbum = false;
			  return false;
			}
		});
		
		
		checkartist = false;
		recTest = '';
		$.each(listing, function() {
			if(!this['isDir'] && !this['isVideo']){
			  checkartist = true;
			  if(recTest != ''){
				if(recTest == this['artist']){
				  checkartist = true;
				}
				else{
				  checkartist = false;
				  return false;
				}
			  }
			  else{
				recTest = this['artist'];
			  }
			}
			else{
			  checkartist = false;
			  return false;
			}
		});
		
		
		htmllist += '<ul class="listingSong">';

		$.each(listing, function() {
			if(this['isDir']){
			  var cover = '';
			  if(this['coverArt']){
				cover = $this.cover(this['coverArt'],'100');
			  }
			  else{
				cover = $this.cover('','100');
			  }
			  title = this['title'];
			  title = title.toString().replace(' - ','<br />'); 
			  
			  htmlDir += '<div class="dir" style="background:;margin-right:10px;margin-bottom:10px;float:left;width:140px;height:140px;border-right:1px solid #009BE3;border-bottom:1px solid #009BE3;font-size:0.9em;line-height:12px;">';
			  htmlDir += '<a href="#" data-id="'+this['id']+'" data-title="'+this['title']+'" class="isdir">';
			  htmlDir += '<img src="'+cover+'" alt="" width="100" height="100" /><br />';
			  htmlDir += title;
			  htmlDir += '</a>';
			  htmlDir += '</div>';
			  listResult['dir'] = true;
			}
			else{
			  if(this['isVideo']){
				htmlvideo += this['title']+'<br />';
				listResult['video'] = true;
			  }
			  else{
				cover = '';
				album = '';
				genre = '';
				duration = '';
				track = '';
				sound = $this.stream(this['id']);
				if(this['album']){
				  album = this['album'];
				}
				if(this['genre']){
				  genre = this['genre'];
				}
				if(this['duration']){
				  duration = this['duration'];
				}
				if(this['track']){
				  track = this['track'];
				}
				if(this['coverArt']){
				  cover = $this.cover(this['coverArt']);
				}
				else{
				  cover = $this.cover();
				}
				
				cpt++;
				if(cpt % 2){
					laclasse = "even";
				}
				else{
					laclasse = "odd";
				}
				
				htmllist += '<li class="'+laclasse+'"><a ';
				htmllist += 'data-id="'+this['id']+'" ';
				htmllist += 'data-artist="'+this['artist']+'" ';
				htmllist += 'data-title="'+this['title'].toString().replace('"','&#34;')+'" ';
				htmllist += 'data-album="'+album+'" ';
				htmllist += 'data-genre="'+genre+'" ';
				htmllist += 'data-duration="'+duration+'" ';
				htmllist += 'data-track="'+track+'" ';
				htmllist += 'data-url="'+sound+'" ';
				htmllist += 'data-poster="'+cover+'" ';
				htmllist += 'id="sound_'+this['id']+'" ';
				htmllist += 'class="milesSound">';
				if(checkalbum){
				  if(track != ''){
					afftrack = track;
					if(afftrack < 10){ afftrack = '0'+afftrack;}
					htmllist += '<span class="track">'+afftrack+'</span>';
				  }
				  else{
					affcpt = cpt;
					if(cpt < 10){ affcpt = '0'+cpt;}
					htmllist += '<span class="track">'+affcpt+'</span>';
				  }
				  if(!checkartist){
					htmllist += '<span class="artist">'+this['artist']+'</span> - ';
				  }
				}
				else{
				  htmllist += '<span class="artist">'+this['artist']+'</span> - ';
				}
				
				htmllist += '<span class="title">'+this['title']+'</span>';
				htmllist += '</a></li>';
				
				if(!listResult['sound']){
				  if(checkalbum){
					albumName =  album;
					if(checkartist){
					  artistName =  this['artist'];
					}
					else{
					  artistName =  'Various Artist';
					}
					
					if(this['coverArt']){
					  albumCover = $this.cover(this['coverArt'],200);
					}
					else{
					  albumCover = $this.cover('',200);
					}
					
				  }
				  else{
					  albumCover = $this.cover('',200);
				  }
				}
				listResult['sound'] = true;
			  }
			}
		});

		htmllist += '</ul>';
		
		
		if(listResult['dir']){
			retour += '<div class="contentbar folderContent">';
			retour += '<div class="header">Dossiers</div>';
			retour += '<div class="content">';
			retour += htmlDir;
			retour += '<div class="clear"></div>';
			retour += '</div>';
			retour += '</div>';
		}

		if(listResult['sound']){
			if(!listResult['dir'] && !listResult['video'] && checkalbum){
			  retour += '<div class="contentbar soundContent">';
			  retour += '<div class="header">'+artistName+' - '+albumName+'</div>';
			  retour += '<div class="content">';
			  retour += '<div class="cover"><img src="'+albumCover+'" /><br />'+artistName+'<br />'+albumName+'</div>';
			  retour += '<div class="albumsound"><p><a href="#" class="playall">Tout jouer</a> - <a href="#" class="addall">Tout ajouter</a></p>';
			  retour += htmllist;
			  retour += '</div>';
			  retour += '</div>';
			  retour += '</div>';
			}
			else{
			  retour += '<div class="contentbar soundContent">';
			  retour += '<div class="header">Sons</div>';
			  retour += '<div class="content">';
			  retour += '<div class="cover"><img src="'+albumCover+'" /></div>';
			  retour += '<div class="albumsound"><p><a href="#" class="playall">Tout jouer</a> - <a href="#" class="addall">Tout ajouter</a></p>';
			  retour += htmllist;
			  retour += '</div>';
			  retour += '</div>';
			  retour += '</div>';
			}
		}

		if(listResult['video']){
			retour += '<div class="contentbar videoContent">';
			retour += '<div class="header">Videos</div>';
			retour += '<div class="content">';
			retour += htmlvideo;
			retour += '</div>';
			retour += '</div>';
		}
		
		return retour;

	}
	
	this.playlists = function(){
		var retour = '';
		playlist = this.getPlaylists();
		$.each(playlist, function() {
			retour += '<div class="contentbar soundContent" id="content_playlist_'+this['id']+'">';
			retour += '<div class="header" id="playlist_'+this['id']+'" data-id="'+this['id']+'">'+this['name']+'</div>';
			retour += '<div class="content" style="display:none">';
			retour += '</div>';
			retour += '</div>';
		});
		return retour;
	}
	
	this.playlist = function(id){
		$this = this;
		playlist = this.getPlaylist(id);
		var cpt=0;
		var htmllist = '';
		htmllist += '<p><a href="#" class="playplaylistsound" data-id="'+id+'">Tout jouer</a> - <a href="#" class="addplaylistsound" data-id="'+id+'">Tout ajouter</a> - <a href="#" class="deleteplaylistsound" data-id="'+id+'">Delete Playlist</a></p>';
		htmllist += '<ul class="listingSong">';
		$.each(playlist, function() {
			album = '';
			genre = '';
			duration = '';
			track = '';
			sound = $this.stream(this['id']);
			if(this['album']){
			  album = this['album'];
			}
			if(this['genre']){
			  genre = this['genre'];
			}
			if(this['duration']){
			  duration = this['duration'];
			}
			if(this['track']){
			  track = this['track'];
			}
			if(this['coverArt']){
			  cover = $this.cover(this['coverArt']);
			}
			else{
			  cover = $this.cover();
			}

			cpt++;
			if(cpt % 2){
				laclasse = "even";
			}
			else{
				laclasse = "odd";
			}

			htmllist += '<li class="'+laclasse+'"><a ';
			htmllist += 'data-id="'+this['id']+'" ';
			htmllist += 'data-artist="'+this['artist']+'" ';
			htmllist += 'data-title="'+this['title'].toString().replace('"','&#34;')+'" ';
			htmllist += 'data-album="'+album+'" ';
			htmllist += 'data-genre="'+genre+'" ';
			htmllist += 'data-duration="'+duration+'" ';
			htmllist += 'data-track="'+track+'" ';
			htmllist += 'data-url="'+sound+'" ';
			htmllist += 'data-poster="'+cover+'" ';
			htmllist += 'id="sound_'+this['id']+'" ';
			htmllist += 'class="milesSoundPlaylist">';
			htmllist += '<span class="artist">'+this['artist']+'</span> - ';
			htmllist += '<span class="title">'+this['title']+'</span>';
			if(album != ''){
			  htmllist += ' - <span class="album">'+album+'</span>';
			}
			htmllist += '</a></li>';
		});
		htmllist += '</ul>';
		
		return htmllist;
	}
	
	this.popupplaylist = function(){
		var retour = '';
		playlist = this.getPlaylists();
		retour += '<div id="mymodal">';
		retour += '<h2>Save Playlist</h2>';
		retour += '<p>&nbsp;</p>';
		retour += '<p><input type="text" id="inputplaylist" placeholder="new Playlist"/></p>';
		retour += '<p><select id="selectplaylist">';
		retour += '<option value=""> -- Choose Playlist -- </option>';
		$.each(playlist, function() {
			retour += '<option value="'+this['id']+'">'+this['name']+'</option>';
		});
		retour += '</select></p>';
		retour += '<p>&nbsp;</p>';
		retour += '<p><a href="#" class="saveplaylist bouton">ok</a></p>';
		retour += '</div>';		
		return retour;
	}
	
	this.saveplaylist = function(songid,param,value){
		var create = true;
		if(param == 'name'){
			create = true;
		}
		if(param == 'playlist'){
			create = false;
		}
		var reponse = this.createPlaylist(songid,value,create);
		return reponse;
	}
	
	this.search = function(query){
		var retour = '';
		$this = this;
		result = this.getSearch(query);

		if(result['album']){
			retour +=  '<div class="contentbar">';
			retour +=  '<div class="header">Albums</div>';
			retour +=  '<div class="content">';
			var htmlDir = '';
			var array = result['album'];
			if(result['album']['id']){
				array = new Array(result['album']);
			}
			$.each(array, function() {
				var cover = '';
				if(this['coverArt']){
					cover = $this.cover(this['coverArt'],'100');
				}
				else{
					cover = $this.cover('','100');
				}
				var title = this['title'];
				title = title.toString().replace(' - ','<br />'); 

				htmlDir += '<div class="dir" style="background:;margin-right:10px;margin-bottom:10px;float:left;width:140px;height:140px;border-right:1px solid #009BE3;border-bottom:1px solid #009BE3;font-size:0.9em;line-height:12px;">';
				htmlDir += '<a href="#" data-id="'+this['id']+'" data-title="'+this['title']+'" class="isdir">';
				htmlDir += '<img src="'+cover+'" alt="" width="100" height="100" /><br />';
				htmlDir += title;
				htmlDir += '</a>';
				htmlDir += '</div>';
			});
			retour +=  '<div id="albumsearch">';
			retour +=  htmlDir;
			retour +=  '</div>';
			retour +=  '<div class="clear"></div>';
			if(array.length >= 20){
				retour +=  '<a href="#" data-query="'+query+'" id="offsetalbum">more</a>';
			}
			retour +=  '</div>';
			retour +=  '</div>';
		}
		if(result['song']){
			retour +=  '<div class="contentbar soundContent">';
			retour +=  '<div class="header">Songs</div>';
			retour +=  '<div class="content">';
			
			var cpt=0;
			var htmllist = '';
			htmllist += '<ul class="listingSong">';
			var array = result['song'];
			if(result['song']['id']){
				array = new Array(result['song']);
			}
			$.each(array, function() {
				album = '';
				genre = '';
				duration = '';
				track = '';
				cover = '';
				sound = $this.stream(this['id']);
				if(this['album']){
				  album = this['album'];
				}
				if(this['genre']){
				  genre = this['genre'];
				}
				if(this['duration']){
				  duration = this['duration'];
				}
				if(this['track']){
				  track = this['track'];
				}
				if(this['coverArt']){
				  cover = $this.cover(this['coverArt']);
				}
				else{
				  cover = $this.cover();
				}
				
				cpt++;
				if(cpt % 2){
					laclasse = "even";
				}
				else{
					laclasse = "odd";
				}
				
				htmllist += '<li class="'+laclasse+'"><a ';
				htmllist += 'data-id="'+this['id']+'" ';
				htmllist += 'data-artist="'+this['artist']+'" ';
				htmllist += 'data-title="'+this['title'].toString().replace('"','&#34;')+'" ';
				htmllist += 'data-album="'+album+'" ';
				htmllist += 'data-genre="'+genre+'" ';
				htmllist += 'data-duration="'+duration+'" ';
				htmllist += 'data-track="'+track+'" ';
				htmllist += 'data-url="'+sound+'" ';
				htmllist += 'data-poster="'+cover+'" ';
				htmllist += 'id="sound_'+this['id']+'" ';
				htmllist += 'class="milesSound">';
				htmllist += '<span class="artist">'+this['artist']+'</span> - ';
				htmllist += '<span class="title">'+this['title']+'</span>';
				if(album != ''){
				  htmllist += ' - <span class="album">'+album+'</span>';
				}
				htmllist += '</a></li>';
			});
			htmllist += '</ul>';
			retour +=  htmllist;
			if(result['song'].length >= 20){
			  retour +=  '<a href="#" data-query="'+query+'" id="offsetsong">more</a>';
			}
			retour +=  '<div class="clear"></div>';
			retour +=  '</div>';
			retour +=  '</div>';
		}
		return retour;
	}
	
	this.searchmoresong = function(query,offset){
		var retour = '';
		result = this.getSearchMoreSong(query,offset);
		if(result['song']){
			var cpt=0;
			var array = result['song'];
			if(result['song']['id']){
				array = new Array(result['song']);
			}
			$.each(array, function() {
				album = '';
				genre = '';
				duration = '';
				track = '';
				cover = '';
				sound = $this.stream(this['id']);
				if(this['album']){
				  album = this['album'];
				}
				if(this['genre']){
				  genre = this['genre'];
				}
				if(this['duration']){
				  duration = this['duration'];
				}
				if(this['track']){
				  track = this['track'];
				}
				if(this['coverArt']){
				  cover = $this.cover(this['coverArt']);
				}
				else{
				  cover = $this.cover();
				}
				
				cpt++;
				if(cpt % 2){
					laclasse = "even";
				}
				else{
					laclasse = "odd";
				}
				
				retour += '<li class="'+laclasse+'"><a ';
				retour += 'data-id="'+this['id']+'" ';
				retour += 'data-artist="'+this['artist']+'" ';
				retour += 'data-title="'+this['title'].toString().replace('"','&#34;')+'" ';
				retour += 'data-album="'+album+'" ';
				retour += 'data-genre="'+genre+'" ';
				retour += 'data-duration="'+duration+'" ';
				retour += 'data-track="'+track+'" ';
				retour += 'data-url="'+sound+'" ';
				retour += 'data-poster="'+cover+'" ';
				retour += 'id="sound_'+this['id']+'" ';
				retour += 'class="milesSound">';
				retour += '<span class="artist">'+this['artist']+'</span> - ';
				retour += '<span class="title">'+this['title']+'</span>';
				if(album != ''){
				  retour += ' - <span class="album">'+album+'</span>';
				}
				retour += '</a></li>';
			});
		}
		return retour;
	}
	
	this.searchmorealbum = function(query,offset){
		var retour = '';
		result = this.getSearchMoreAlbum(query,offset);
		if(result['album']){
			var array = result['album'];
			if(result['album']['id']){
				array = new Array(result['album']);
			}
			$.each(array, function() {
				var cover = '';
				if(this['coverArt']){
					cover = $this.cover(this['coverArt'],'100');
				}
				else{
					cover = $this.cover('','100');
				}
				var title = this['title'];
				title = title.toString().replace(' - ','<br />'); 

				retour += '<div class="dir" style="background:;margin-right:10px;margin-bottom:10px;float:left;width:140px;height:140px;border-right:1px solid #009BE3;border-bottom:1px solid #009BE3;font-size:0.9em;line-height:12px;">';
				retour += '<a href="#" data-id="'+this['id']+'" data-title="'+this['title']+'" class="isdir">';
				retour += '<img src="'+cover+'" alt="" width="100" height="100" /><br />';
				retour += title;
				retour += '</a>';
				retour += '</div>';
			});
		}
		return retour;
	}
	
	this.albumlist = function(type,offset){
		
		$this = this;
		var list = this.getAlbumList(type,offset);
		var empty = true;
		var retour = '';
		if(offset == 0){
			retour += '<div class="contentbar folderContent">';
			retour += '<div class="header">'+albumListLabel[type]+'</div>';
			retour += '<div class="content">';
		}
		$.each(list, function() {
			empty = false;
			var cover = '';
			if(this['coverArt']){
				cover = $this.cover(this['coverArt'],'100');
			}
			else{
				cover = $this.cover('','100');
			}
			title = this['title'];
			title = title.toString().replace(' - ','<br />'); 

			retour += '<div class="dir" style="background:;margin-right:10px;margin-bottom:10px;float:left;width:140px;height:140px;border-right:1px solid #009BE3;border-bottom:1px solid #009BE3;font-size:0.9em;line-height:12px;">';
			retour += '<a href="#" data-id="'+this['id']+'" data-title="'+this['title']+'" class="isdir">';
			retour += '<img src="'+cover+'" alt="" width="100" height="100" /><br />';
			retour += title;
			retour += '</a>';
			retour += '</div>';
		});
		if(offset == 0){
			if(empty){
				retour += 'no result';
			}
			else{
				retour += '<div class="dir" style="background:;margin-right:10px;margin-bottom:10px;float:left;width:140px;height:140px;border-right:1px solid #009BE3;border-bottom:1px solid #009BE3;font-size:0.9em;line-height:12px;" id="div_offsetalbumlist">';
				retour += '<a href="#" id="offsetalbumlist" data-type="'+type+'">';
				retour += 'more';
				retour += '</a>';
				retour += '</div>';
			}
			retour += '<div class="clear"></div>';
			retour += '</div>';
			retour += '</div>';
		}
		return retour;
	}
	
	this.host = hostInit;
	this.user = userInit;
	this.pwd = pwdInit;
	this.version = '1.7.0';
	this.client = this.user+':milesSub';
}
