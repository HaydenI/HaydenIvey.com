/*
	jQuery FlexiSlider plugin.
	Developed by Radoslav Georgiev
	c4xpl0siv3@gmail.com
	
	Version 0.01a
	
	Any distribution of this plugin is forbidden
	without exclusive developer permission.
*/

jQuery.fn.extend({ 
        disableSelection : function() { 
                return this.each(function() { 
                        this.onselectstart = function() { return false; }; 
                        this.unselectable = "on"; 
                        jQuery(this).css('user-select', 'none'); 
                        jQuery(this).css('-o-user-select', 'none'); 
                        jQuery(this).css('-moz-user-select', 'none'); 
                        jQuery(this).css('-khtml-user-select', 'none'); 
                        jQuery(this).css('-webkit-user-select', 'none'); 
                }); 
        } 
});

jQuery.fn.flexiSlider = function( o ) {  

	// Defaults. A pretty long list, check the documentation
	// for more details.
	var options = {
		start:                1,
		visible:              1,
		scroll:               true,
		auto:                 4,
		wrap:                 "both",
		autoAlign:            true,
		speed:                "slow",
		easing:               null,
		activeZoom:           1,
		inactiveZoom:         1,
		prevButton:           true,
		nextButton:           true,
		autoHideButtons:      true,
		dots:                 true,
		dotsThumbs:           true,
		dotsThumbsSize:       50,
		autoHideDots:         true,
		thumbnails:           true,
		thumbnailsSize:       80,
		scrollBar:            true,
		scrollData:           "current", // Or "Title" or null || "none",
		inlineCss:            true,
		prefix:               "fs-",
		adjustSpacing:        "width",
		showCaptions:         true,
		hideCaptions:         true,
		
		// Callbacks
		callbacks: {
			init:         null,
			itemFirstIn:  null,
			itemFirstOut: null,
			itemLastIn:   null,
			itemLastOut:  null,
			step:         null,
			itemActive:   null
		}
	};
	
	return this.each(function() {        
		// If options are passed to the plugin,
		// we'll merge them with our default settings
		if ( o ) { 
			$.extend( options, o );
		}
		
		switch(options.speed)
		{
			case "fast":   options.speed = 200; break;
			case "normal": options.speed = 400; break;
			case "slow":   options.speed = 600; break;
		}
		
		// Setting an item to be visible to the functions
		var obj = this;
		
		// A function that's going to add the prefix
		// to our classes
		function gC(clName) {
			return (options.prefix + clName);
		}
		
		// Creating most important variables
		var container, clip, list, state, currentItem, 
		sliderTimeout, scrollHandle, scrollTrack;
		
		// If the first item isn't on the left (different zooms)
		// this variable indicates the offset on the left side
		var offsetLeft = 0;
		
		// Setting state to init
		state = "INIT";
		currentItem = options.start;
		
		// Selecting what's passed - list or container		
		if( $(this).is("ul") ) {
			container = $(this).parent();
			list = $(this);
		} else {
			container = $(this);
			list = $(this).find("ul:eq(0)");
		}
		
		
		
		/* ================================= 
			Adding classes and wrapping 
		================================= */
		container.addClass( gC("container") );
		
		list.wrap("<div class='" + gC("clip-container") + "' />");
		list.wrap("<div class='" + gC("clip") + "' />");
		list.addClass( gC("list") );
		
		clip = $( "." + gC("clip"), container );
		
		var items = list.children("li");
		
		// Setting classes on elements
		var itemsCount = 0;
		items.each(function() {
			$(this).addClass( gC("item") );
			$(this).addClass( gC("item-" + (itemsCount+1)) );
			itemsCount++;
		});
		
		// Wrapping items content - the wrap is required for the zoom feature
		items.wrapInner("<div class='" + gC("item-inner") + "' />");
		
		
		
		
		/* ================================= 
			Adding controls 
		================================= */
		
		// Adding prev and next buttons
		if( options.nextButtton || options.prevButton ){
			// Buttons are wrapped in a container.
			container.append("<div class='" + gC("arrows") + "' />");
			var controls = container.find( "." + gC("arrows") );
			
			// Adding prev button and assigning click events
			if( options.prevButton ){
				controls.append("<a href='#' class='" + gC("prev") + "'>Prev</a>");
				controls.find( "."+gC("prev") ).bind('click', function() {
					obj.prev();
					return false;
				});
			}
			
			// Adding next button and assigning click events
			if( options.nextButton ){
				controls.append("<a href='#' class='" + gC("next") + "'>Next</a>");
				controls.find( "."+gC("next") ).bind('click', function() {
					obj.next();
					return false;
				});
			}
			
			// Setting hover behavior - controls show up only on hover
			if( options.autoHideButtons )
			{
				controls.hide();
				container.hover(function() {
					controls.fadeIn();
				}, function() {
					controls.fadeOut();
				});
			}
		}
		
		/* Adding scrollbar. The structure uses a few containers:
			- scrollbar: set backgrounds and padding on this one,
						 adding anything on inner ones could cause a bug
			- scrolltrack: the line where the drag goes
			- scrollhandle: the drag. Width is automatically set, but you can
			        		set your own in the css with !important. There's
			        		an inner span wich is used when the scroll extends
		*/
		if( options.scrollBar ) {
			container.append("<div class='" + gC("scrollbar") + "' />");
			var scroll = container.find( "." + gC("scrollbar") );
			
			scroll.append("<div class='" + gC("scrolltrack") + "' />");
			scrollTrack = container.find( "." + gC("scrolltrack") );
			
			scrollTrack.append("<div class='" + gC("scrollhandle") + "'><span></span></div>");
			scrollHandle = container.find( "." + gC("scrollhandle") );
			
			// Disabling selections so there would be no ugly effects when dragging
			scrollTrack.disableSelection();
			scrollHandle.disableSelection();
		}
		
		
		// Adding exxternal thumbnails
		if( options.thumbnails )
		{
			container.append("<div class='" + gC("thumbs") + "' />");
			var thumbnailsContainer = container.find( "." + gC("thumbs") );
			thumbnailsContainer.append("<ul />");
			
			items.each(function() {
				/*
				The thing for thumbnails is here - the first image in the
				slide is being dublicated and positioned in a thumbnail container
				*/
				var img = $("img:eq(0)", this);
				var imgW = img.width();
				var imgH = img.height();
				
				thumbnailsContainer.find("ul").append("<li><a href='#'><img src='" + img.attr("src") + "' /></a></li>");
				
				var imgDiffX = 0, imgDiffY = 0;
				if(imgW>imgH)
				{
					imgW = imgW/(imgH/options.thumbnailsSize);
					imgH = options.thumbnailsSize;
					imgDiffX = (imgW - imgH)/2;
				}
				else if(imgW<imgH)
				{
					imgH = imgH/(imgW/options.thumbnailsSize);
					imgW = options.thumbnailsSize;
					imgDiffY = (imgH - imgW)/2;
				}
				else
				{
					imgW = options.thumbnailsSize;
					imgH = options.thumbnailsSize;
				}
					
				thumbnailsContainer.find("img:last").css({
					width: imgW,
					height: imgH,
					left: -imgDiffX,
					top: -imgDiffY
				});
			});
			
			// Setting width and height, so we see
			// exactly as much as we want to.
			thumbnailsContainer.find("li").css({
				width: options.thumbnailsSize,
				height: options.thumbnailsSize,
				overflow: "hidden"
			});
				
			// This way the ima will be centered
			thumbnailsContainer.find("img").css({
				position: "relative"
			});
			
			// Assigning clicks on the thumbs
			thumbnailsContainer.find("a").bind("click", function() {
				var to = $(this).parent().index()+1;
				obj.scroll( to , "center" );
				return false;
			});
		}
		
		// Adding dots
		if( options.dots ){
			container.append("<div class='" + gC("dots") + "'><ul /></div>");
			var dotsContainer = container.find( "." + gC("dots") );
			var dotsUl = dotsContainer.find( "ul" );
			
			// The idea here is basically the same as on the thumbnails, just
			// the structure is a bit different.
			
			var i = 1;
			items.each(function() {
				
				dotsUl.append("<li><a href='#'>" + (i++) + "</a></li>");
				
				if( options.dotsThumbs )
				{
					var img = $("img:eq(0)", this);
					var imgW = img.width();
					var imgH = img.height();
					
					dotsUl.find("li:last a").append("<span class='thumb'><img src='"+img.attr("src")+"' /></span>");
					
					var imgDiffX, imgDiffY;
					if(imgW>imgH)
					{
						imgW = imgW/(imgH/options.dotsThumbsSize);
						imgH = options.dotsThumbsSize;
						imgDiffX = (imgW - imgH)/2;
					}
					else if(imgH>imgW)
					{
						imgH = imgH/(imgW/options.dotsThumbsSize);
						imgW = options.dotsThumbsSize;
						imgDiffY = (imgH - imgW)/2;
					}
					else 
					{
						imgH = options.dotsThumbsSize;
						imgW = options.dotsThumbsSize;
					}
					
					dotsUl.find("li:last .thumb img").css({
						width: imgW,
						height: imgH,
						left: -imgDiffX,
						top: -imgDiffY
					});
				}
				
			});//EOF each
			
			
			// Assigning clicks
			dotsContainer.find("a").click(function() {
				obj.scroll( $(this).parent().index()+1, "center" );
				return false;
			}).hover(function() {
				$(".thumb" ,this).css({ display:"block", opacity: 0 }).stop(true,true).animate({
					opacity:1,
					top:20
				});
			},function() {
				$(".thumb" ,this).stop(true,true).animate({
					opacity:0,
					top:40
				},function() {
					$(this).css({
						display: "none",
						opacity: 1
					})
				});
			});
			
			// Assigning container hover
			if( options.autoHideDots )
			{
				container.hover(function() {
					dotsContainer.fadeIn();
				}, function() {
					dotsContainer.fadeOut();
				});
			}
		}
		
		// Creating captions
		if( options.showCaptions )
		{
			items.each(function() {
				if( $(this).attr("title") )
				{
					var t = $(this).attr("title");
					$(this).attr("title", "");
					
					$(this).find("." + gC("item-inner")).append("<div class='"+gC("caption")+"'><p>" + t + "</p></div>");
				}
			});
			
			if( options.hideCaptions && options.activeZoom==options.inactiveZoom )
			{
				items.find("." + gC("caption")).each(function() {
					$(this).css({
						bottom: - $(this).outerHeight(true)
					})
				});
				
				items.hover(function() {
					$( "." + gC("caption"), this ).stop(true,true).animate({
						bottom: 0
					}, "fast");
				}, function(){
					$( "." + gC("caption"), this ).stop(true,true).animate({
						bottom: - $( "." + gC("caption"), this ).outerHeight(true)
					}, "fast");
				});
			}
		}
		
		// Adding inline CSS to the container, list and elements
		if( options.inlineCss )
		{
			clip.css({
				position: "relative",
				overflow: "hidden"
			});
			
			
			list.css({
				position:      "relative",
				"list-style":  "none",
				left:           0,
				top:            0
			});
			
			items.css({
				position: "relative",
				float: "left",
				display: "inline"
			});
			
			$("." + gC("item-inner"), container).css({
				position: "relative"
			});
		}
		
		// Creating a function which calculates element widths and so on
		this.resize = function() {
			var desiredElementWidth = Math.ceil( clip.width() / options.visible );
			var listWidth = 0;
			
			items.each(function() {
				var thisWidth = $(this).width();
				$(this).width(thisWidth);
				var thisMargin = $(this).outerWidth(true) - $(this).outerWidth();
				
				switch(options.adjustSpacing)
				{
					case "paddingBoth":
					{
						var thisMore = desiredElementWidth - thisMargin - thisWidth;
						$(this).css({
							paddingLeft: Math.round(thisMore/2),
							paddingRight: thisMore - Math.round(thisMore/2)
						});
					}
					break;
					case "paddingLeft":
					{
						var thisMore = desiredElementWidth - thisMargin - thisWidth;
						$(this).css({
							paddingRight: 0,
							paddingLeft:  thisMore
						})
					}
					break;
					case "paddingRight":
					{
						var thisMore = desiredElementWidth - thisMargin - thisWidth;
						$(this).css({
							paddingRight: paddingRight,
							paddingLeft:  0
						});
					}
					break;
					case "marginBoth":
					{
						var thisMore = desiredElementWidth - $(this).outerWidth();
						$(this).css({
							marginLeft: Math.round(thisMore/2),
							marginRight: thisMore - Math.round(thisMore/2)
						});
					}
					break;
					case "marginLeft":
					{
						var thisMore = desiredElementWidth - $(this).outerWidth();
						$(this).css({
							marginLeft: thisMore,
							marginRight: 0
						});
					}
					break;
					case "marginRight":
					{
						var thisMore = desiredElementWidth - $(this).outerWidth();
						$(this).css({
							marginRight: thisMore,
							marginLeft: 0
						});
					}
					break;
					case "width":
					{
						$(this).css({
							width: desiredElementWidth - thisMargin
						}).find("div:eq(0)").css({
							width: desiredElementWidth - thisMargin
						});
						
					}
					break;
				}
				
				listWidth += $(this).outerWidth(true);
				
			});	
			
			var listPadding;
			if(options.activeZoom != options.inactiveZoom)
			{
				if(options.visible%2)
				{
					offsetLeft = (options.visible-1)/2;
					listPadding = offsetLeft * items.eq(0).outerWidth(true);
				}
				else
				{
					listPadding = (options.visible)/2 * items.eq(0).outerWidth(true);
				}
			}
			else listPadding: 0;
			
			list.css({
				width: listWidth,
				paddingLeft: listPadding,
				paddingRight: listPadding
			});
			
			if(options.activeZoom > 1)
			{
				items.css({
					height: "auto"
				});
				var def = clip.height();
				var def = (options.activeZoom - 1) * items.height();
				items.css({
					paddingTop: def/2,
					paddingBottom: def/2,
					height: items.height()
				})
			}
			
			if(options.scrollBar)
			{				
				scrollHandle.css({
					width: scrollTrack.width()/(itemsCount-options.visible+1)
				});
			}
			
			state = 'INIT';
			obj.scroll(currentItem);
			
		} // EOF resize
		// Setting resize to work on window resize
		// so that everything would work even if the
		// slider is full width and calling it afterwards
		// for initial adjustments
		$(window).bind('resize', this.resize);
		
		var sliderImagesCount = $("img", container).size();
		$("img", container).load(function() {
			sliderImagesCount--;
			if(sliderImagesCount==0) obj.resize();
		});
		
		// Callbacks. 
		this.callback = function(callbackName, item) {
			// @param1: The callback, because the structure is the same for all
			// @param2: item to be passed. If not set - the current item
			
			if(typeof(item)=='undefined') item=currentItem;
			if(item<1) item = 1;
			if(item>items.size()) item = items.size();
			switch(callbackName)
			{
				case 'step':
					if( options.callbacks.step ) 
						options.callbacks.step(obj, items.eq(currentItem-1), currentItem, options, state);
				break;
				case "itemFirstIn": 
					if( options.callbacks.itemFirstIn ) 
						options.callbacks.itemFirstIn(obj, items.eq(item-1), item, options, state);
				break;
				case "itemFirstOut": 
					if( options.callbacks.itemFirstOut ) 
						options.callbacks.itemFirstOut(obj, items.eq(item-1), item, options, state);
				break;
				case "itemLastIn": 
					if( options.callbacks.itemLastIn ) 
						options.callbacks.itemLastIn(obj, items.eq(item-1), item, options, state);
				break;
				case "itemLastOut": 
					if( options.callbacks.itemLastOut ) 
						options.callbacks.itemLastOut(obj, items.eq(item-1), item, options, state);
				break;
				case "itemActive": 
					if( options.callbacks.itemActive ) 
						options.callbacks.itemActive(obj, items.eq(item-1), item, options, state);
				break;
			}
		};
		
		var defHeight = options.activeZoom > options.inactiveZoom ? items.height()*options.activeZoom : items.height()*options.inactiveZoom;
		this.zoom = function(item) {			
			items.each(function() {
				var itemInner = $( "." + gC("item-inner"), this );
				var t = $(this);
				
				var thisIsActive = $(this).index()+1 == item ? true : false;
				
				var myZoom = $(this).index()+1 == item ? options.activeZoom : options.inactiveZoom;
				var half = $(this).width() + (myZoom * $(this).width() - $(this).width())/2

				itemInner.stop().animate({
					width: myZoom * $(this).width(),
					top: ($(this).height() - $(this).height() * myZoom)/2,
					left: ($(this).width() - $(this).width() * myZoom)/2,
					fontSize: myZoom + "em"
				}, {
					duration: options.speed,
					step: function() {
						if( $(this).width() > half && thisIsActive )
							t.css({
								zIndex:2
							});
						else
							t.css({
								zIndex:1
							});
					},
					complete: function() {
						items.eq(item-1).find("." + gC("caption")).each(function() {
							$(this).show().css({ bottom: -1000 });
							$(this).css({ bottom: -$(this).outerHeight(true) });
							$(this).stop(true,true).animate({
								bottom: 0
							}, options.speed);
						});						
					}
				});
			}); // EOF Each
			
			if( options.showCaptions && options.hideCaptions && options.activeZoom!= options.inactiveZoom )
			{
				items.not(":eq(" + (item-1) + ")").find("." + gC("caption")).each(function() {
					$(this).stop(true,true).animate({
						bottom: -$(this).outerHeight(true)
					}, options.speed, function() {
						$(this).hide();
					});
				});
				items.eq(item-1).find("." + gC("caption")).each(function() {
					$(this).show().css({ bottom: -1000 });
					$(this).css({ bottom: -$(this).outerHeight(true) });
					$(this).stop(true,true).animate({
						bottom: 0
					}, options.speed);
				});
			}
		};
		
		// scroll() - scrolls to an item
		// @param1: int - position
		// @param2: string - alignment( left, center, right )
		this.scroll = function(item, align) {
			// Clearing timeouts
			clearTimeout(sliderTimeout);
			
			// If the slider is in init state we save the
			// old speed, set the current one to zero, so
			// there will be immidate effect and in the
			// end we return the old ones
			var oldSpeed, stateWasInit = false;
			
			// Checking the align parameter. This says which item shoud go
			// where.
			var item2bounce;
			switch(align)
			{
				case 'right':
				{
					item = item - (options.visible - 1) + offsetLeft;
				}
				break;
				case 'center':
				{
					var m = offsetLeft > 0 ? -1 :  options.visible-1;
					item = item - Math.round(options.visible/2) + 1 + offsetLeft;
					if( item > items.size() - m ) item=items.size() - m;
					if( item<1 ) item = 1;
				}
			}
			
			if( state == 'INIT')
			{
				oldSpeed = options.speed;
				options.speed = 0;
				stateWasInit = true;
			}			
			else if( state == 'SCROLLING')
			{
				item = currentItem;
			}
			else if(item == currentItem)
			{
				// If we are already there we don't do anything
				state = "WAITING";
				if(options.auto) sliderTimeout = setTimeout(obj.next, options.auto*1000);
				return false;			
			}
			
			// Calculating new position and getting the direction by comparing pixels
			var pos = -items.eq(item-1).position().left;
			
			// Setting the properties depending on direction
			var properties = {
				left: pos + parseInt(list.css("padding-left"))
			 };
			 
			var direction = properties.left < list.position().left ? "left" : "right";
			if( properties.left == list.position().left ) direction = 'none';
			
			
			// Animating the list
			list.stop().animate(properties, {
				// Options
				duration: options.speed, 
				easing: options.easing, 
				step: obj.callback("step"),
				complete: function() {
					currentItem = item;
					
					obj.callback("itemFirstIn", offsetLeft ? item-offsetLeft : item);
					obj.callback("itemLastIn", offsetLeft ? item-offsetLeft+options.visible-1 : item+options.visible-1);
					if( offsetLeft )
					{
						obj.callback("itemActive", item);

						if(direction == "left") 
						{
							if(item-offsetLeft-1>0) obj.callback("itemFirstOut", item-offsetLeft-1);
						}
						else
						{
							if(item + options.visible - offsetLeft - 1 < items.size()) obj.callback("itemLastOut", item + options.visible -offsetLeft );
						}
					}
					else
					{
						if(direction == "left") 
						{
							obj.callback("itemFirstOut", item-1);
						}
						else
						{
							obj.callback("itemLastOut", item + options.visible);
						}
					}
					
					
					if( options.dots )
					{
						container.find("." + gC("dots")).find("a").removeClass(gC("active"));
						if(offsetLeft)
						{
							container.find("." + gC("dots")).find("a").eq(currentItem-1).addClass( gC("active") );
						}
						else
						{
							for(var i=0; i<options.visible; i++ )
							container.find("." + gC("dots")).find("a").eq(currentItem+i-1).addClass( gC("active") );
						}
					}
					
					state = "WAITING";
				}
			});
			
			if( options.inactiveZoom != options.activeZoom )
				obj.zoom( item );
						
			
			// If there's a scroll, it needs some movements too
			var listMinLeft = offsetLeft * items.eq(0).outerWidth(true);
			var listMaxLeft = (itemsCount + offsetLeft - ( offsetLeft ? 2 : options.visible )) * items.eq(0).outerWidth(true);
			
			if( options.scrollBar )
			{
				stWidth = scrollTrack.width();
				shWidth = scrollHandle.width();
				scrollHandle.stop(true).animate({
					left: (-pos - listMinLeft)/listMaxLeft * (stWidth - shWidth)
				}, options.speed, options.easing);
			}
			
			// Is we were doing something in the 'INIT' state, we restore
			// the speed
			if( stateWasInit )
			{
				options.speed = oldSpeed;
			}
			
			// And set a timeout for the next time
			if(options.auto) sliderTimeout = setTimeout(obj.next, options.auto * 1000);
		}
		
		// next() - scrolls options.scroll elements
		this.next = function() {
			if(state == "WAITING")
			{
				state = "NEXT";
				
				var to = currentItem + options.scroll;
				
				var toAdd = options.activeZoom == options.inactiveZoom ? - options.visible + 1 : 0;
				var maxLast = itemsCount + toAdd;
				if(to > maxLast) 
				{
					if(currentItem!=maxLast) to = maxLast;
					else if( options.wrap=="both" || options.wrap=="right" ) to = 1;
				}
				
				obj.scroll(to, "left");
			}
		};
		
		// prev() - scrolls options.scroll elements back
		this.prev = function() {
			if(state == "WAITING")
			{
				state = "PREV";
				
				var to = currentItem - options.scroll;
				if(to<1)
				{
					var toAdd = options.activeZoom == options.inactiveZoom ? - options.visible + 1 : 0;
					if(currentItem!=1) to = 1;
					else if( options.wrap=="both" || options.wrap=="left" ) to = itemsCount + toAdd;
				}
				obj.scroll(to, "left");
			}
		}
		
		var prevPercent = 0;
		this.moveTo = function(percent) {
			var oldListX = list.position().left;
			
			var minListX = 0;
			var forbidden = options.visible;
			var maxListX = - ( itemsCount - ( offsetLeft ? offsetLeft : forbidden ) ) * items.eq(0).outerWidth(true);
			
			var newListX = maxListX * percent /100 - minListX;
			list.css({
				left: newListX
			});
			
			var direction = oldListX>newListX ? 1 : -1; 
			
			var activeItem = -1;
			var listCenter = clip.width()/2 - newListX  + (offsetLeft ? offsetLeft-1 : 0) * items.outerWidth(true) - parseInt(list.css("padding-left"));
			var itemWidth = items.outerWidth(true);

			for(var i = 0; i<itemsCount; i++)
			{
				var distThis = listCenter - (itemWidth*i + itemWidth/2);
				var distNext = distThis - itemWidth;
				
				if( Math.abs(distThis) < Math.abs(distNext) )
				{
					activeItem = i+1;
					break;
				}
			}
			if( !offsetLeft ) activeItem -= options.visible/2 - (options.visible%2)/2;
			
			currentItem = activeItem;
			
			if( options.activeZoom != options.inactiveZoom )
			{
				var percent = listCenter - items.eq(currentItem-1).position().left + itemWidth/2;
				percent = Math.abs( 2 * (percent/itemWidth) );
				if(percent>50) activeItem++;
				if(percent<-50) activeItem--;
				percent = 1 - Math.abs(percent);
				percent = options.inactiveZoom + Math.abs(options.activeZoom - options.inactiveZoom) * percent;
				
				
				items.each(function() {
					var itemInner = $( "." + gC("item-inner"), this );
					var t = $(this);
					
					var myZoom = $(this).index()+1 == activeItem ? percent: options.inactiveZoom;
					var half = $(this).width() + (myZoom * $(this).width() - $(this).width())/2
					
					itemInner.stop(true,true).animate({
						width: myZoom * $(this).width(),
						top: ($(this).height() - $(this).height() * myZoom)/2,
						left: ($(this).width() - $(this).width() * myZoom)/2,
						fontSize: myZoom + "em"
					}, {
						duration: options.speed,
						step: function() {
							if( $(this).parent().index() == activeItem-1 )
								$(this).parent().css({
									zIndex:2
								});
							else
								$(this).parent().css({
									zIndex:1
								});
						}
					});
				}); // EOF Each
			}
		};
		
		
		/*
			Scroll section
		*/
		if(options.scrollBar)
		{			
			// Initializing mousemovements
			var mouse = function(){
				this.left = 0;
				this.top = 0;
			}
			if (!document.all) document.captureEvents(Event.MOUSEMOVE);
		
			var dragEnabled = false;
			
			var startMouseX, startHandleL, prevPos;
			
			// Calculating handle's width
			scrollHandle.css({
				width: scrollTrack.width()/itemsCount
			});
			
			function moveScroll()
			{
				if(!dragEnabled) return;

				var offL = mouse.left - startMouseX;
				var newL = offL + startHandleL;
				
				if( newL < 0 ) newL = 0;
				if( newL + scrollHandle.width() > scrollTrack.width()) newL = scrollTrack.width() - scrollHandle.width();
				
				scrollHandle.css({
					left: newL
				});
				
				obj.moveTo( newL / (scrollTrack.width() - scrollHandle.width()) * 100 );
			}
			
			scrollHandle.bind('mousedown', function() {
				// Clear stuff first
				list.stop(true,true);
				clearTimeout(sliderTimeout);
				
				scrollHandle.addClass( gC("scrollhandle-down") );
				
				prevPos = list.position().left;
				
				if( options.activeZoom != options.inactiveZoom && options.showCaptions && options.hideCaptions )
				{
					container.find( "." + gC("caption") + ":visible" ).each(function() {
						$(this).stop(true,true).animate({
							bottom: -$(this).outerHeight(true)
						}, options.speed, function() {
							$(this).hide();
						});
					});
				}
				
				startMouseX = mouse.left;
				startHandleL = scrollHandle.position().left;
				
				dragEnabled = true;
				
				state = "SCROLLING";
			});
			
			$(document).bind('mouseup', function() {
				dragEnabled = false;
				
				scrollHandle.removeClass( gC("scrollhandle-down") );
				
				if(options.autoAlign) obj.scroll(currentItem);
				else if( options.auto ) sliderTimeout = setTimeout(obj.next, options.auto*1000);
				else state = "WAITING";
			});
			
			// Setting behavior on mousemove
			$(document).mousemove(function getMouseXY(e) {
			  if (document.all) {
				mouse.left = event.clientX + document.body.scrollLeft;
				mouse.top = event.clientY + document.body.scrollTop;
			  } else {  
				mouse.left = e.pageX;
				mouse.top = e.pageY;
			  }  
			  
			  if (mouse.left < 0){mouse.left = 0};
			  if (mouse.top < 0){mouse.top = 0};
			  
			  moveScroll();						  
			  
			  return true;
			});
			
			// Scrolltrack clicks - takes you to the right place
			scrollTrack.bind('click', function(e) {
				var x = e.clientX - scrollTrack.offset().left;
				
				var steps = offsetLeft ? items.size() : items.size() - options.visible + 1;
				var stepWidth = ( scrollTrack.width() ) / steps;
				
				x = x - x%stepWidth;
				
				state = "SCROLLING";
				currentItem = Math.round(x/stepWidth+1);
				obj.scroll();
				
				return false;
			});
			
		}
		/* EOScroll */
		
		
		// Final initializations
		this.scroll(options.start);
		this.resize();
		state = "WAITING";
		
		// Calling init callback
		if( options.callbacks.init != null )
			options.callbacks.init(obj);
		
	// End of each
	});

};