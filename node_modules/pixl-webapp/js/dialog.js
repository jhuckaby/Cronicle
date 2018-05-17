// Dialog Tools
// Author: Joseph Huckaby
// Released under the MIT License.

var Dialog = {
	
	active: false,
	clickBlock: false,
	
	showAuto: function(title, inner_html, click_block) {
		// measure size of HTML to create correctly positioned dialog
		var temp = $('<div/>').css({
			position: 'absolute',
			visibility: 'hidden'
		}).html(inner_html).appendTo('body');
		
		var width = temp.width();
		var height = temp.height();
		temp.remove();
		
		this.show( width, height, title, inner_html, click_block );
	},
	
	autoResize: function() {
		// automatically resize dialog to match changed content size
		var temp = $('<div/>').css({
			position: 'absolute',
			visibility: 'hidden'
		}).html( $('#dialog_main').html() ).appendTo('body');
		
		var width = temp.width();
		var height = temp.height();
		temp.remove();
		
		var size = get_inner_window_size();
		var x = Math.floor( (size.width / 2) - ((width + 0) / 2) );
		var y = Math.floor( ((size.height / 2) - (height / 2)) * 0.75 );
		
		$('#dialog_main').css({
			width: '' + width + 'px',
			height: '' + height + 'px'
		});
		$('#dialog_container').css({
			left: '' + x + 'px',
			top: '' + y + 'px'
		});
	},
	
	show: function(width, height, title, inner_html, click_block) {
		// show dialog
		this.clickBlock = click_block || false;
		var body = document.getElementsByTagName('body')[0];
		
		// build html for dialog
		var html = '';
		if (title) {
			html += '<div class="tab_bar" style="width:'+width+'px;">';
				html += '<div class="tab active"><span class="content">'+title+'</span></div>';
			html += '</div>';
		}
		html += '<div id="dialog_main" style="width:auto; height:auto;">';
			html += inner_html;
		html += '</div>';
		
		var size = get_inner_window_size();
		var x = Math.floor( (size.width / 2) - ((width + 0) / 2) );
		var y = Math.floor( ((size.height / 2) - (height / 2)) * 0.75 );
		
		if ($('#dialog_overlay').length) {
			$('#dialog_overlay').stop().remove();
		}
		
		var overlay = document.createElement('div');
		overlay.id = 'dialog_overlay';
		overlay.style.opacity = 0;
		body.appendChild(overlay);
		$(overlay).fadeTo( 500, 0.75 ).click(function() {
			if (!Dialog.clickBlock) Dialog.hide();
		});
		
		if ($('#dialog_container').length) {
			$('#dialog_container').stop().remove();
		}
		
		var container = document.createElement('div');
		container.id = 'dialog_container';
		container.style.opacity = 0;
		container.style.left = '' + x + 'px';
		container.style.top = '' + y + 'px';
		container.innerHTML = html;
		body.appendChild(container);
		$(container).fadeTo( 250, 1.0 );
		
		this.active = true;
	},
	
	hide: function() {
		// hide dialog
		if (this.active) {
			$('#dialog_container').stop().fadeOut( 250, function() { $(this).remove(); } );
			$('#dialog_overlay').stop().fadeOut( 500, function() { $(this).remove(); } );
			this.active = false;
		}
	},
	
	showProgress: function(msg) {
		// show simple progress dialog (unspecified duration)
		var html = '';
		html += '<table width="300" height="120" cellspacing="0" cellpadding="0"><tr><td width="300" height="120" align="center" valign="center">';
		html += '<img src="images/loading.gif" width="32" height="32"/><br/><br/>';
		html += '<span class="label" style="padding-top:5px">' + msg + '</span>';
		html += '</td></tr></table>';
		this.show( 300, 120, '', html );
	}
	
};
