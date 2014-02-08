(function($) {
	window.stop=function(e){e.preventDefault();e.stopPropagation();};
    var methods = {
        init : function(options) {
            var $this = $(this),
            	defaultOpt = {
            		pageClass: ".page",
            		autostart: true,
                    title: "",
                    roles:[]
            	};
            $.fn.extend(defaultOpt, options);
            $.data(this[0],"options", defaultOpt);
            $(this).find(defaultOpt.pageClass).hide();
            $this.flow("initFeatures");
            if(!hasHash() && defaultOpt.autostart && options.mainFlow.length > 0){
            	$this.flow("start");
            }else if(hasHash()){
                $this.flow("setDisplay",location.hash.substring(1));
            }
            $this.flow("bindHistoryEvents", $this);
            $this.flow("initTemplates", defaultOpt);
            function hasHash(){
                return location.href.indexOf("#") != -1;
            }
            
        },
        bindHistoryEvents:function($this){
            var $this = $(this),
                options =   $.data(this[0],"options");
            if(options.enableHashStates){
                $(window).bind("hashchange", function(e){
                    var state = e.fragment;
                    $this.flow("setDisplay",state);
                    
                });
            }
        },
        initTemplates: function(options){
            if(options.templates){
                var len = 0,i=0;
           
                len = options.templates.length;
                for(; i < len ; i++){
                    var template = options.templates[i];
                    template.engine = template.engine || "handlebars";
                    if(template.engine === "handlebars"){
                        template.template = Handlebars.compile($("#"+template.id).html());
                    }
                }
            }
        },
        initFeatures: function(){
        	var $this = $(this),
        		options =   $.data(this[0],"options"), 
        		len = 0,i=0;
            if(options.features){
                $(".flow-feature").hide();
                len = options.features.length;
                for(; i < len ; i++){
                	var feature = options.features[i];
                    feature.elem = $("#"+feature.id);
                    feature.elem.show();
                	feature.elem.data("position",feature.elem.position());
                	feature.elem.hide();
                	feature.hidden = true;
                }
            }
        },
        start:function(){
        	$(this).flow("setDisplay",0);
        },
        setDisplay: function(index){
        	var $this = $(this),
        		options =   $.data(this[0],"options"), 
        		toShow = options.mainFlow[getIndex(index)];
            index = getIndex(index);
            if(index < 0) return;
        	toShow.display = $("#"+toShow.id);
        	if(options.actual){
                $(".flow-feature").removeClass(options.actual.id);
        		options.actual.onexit && options.actual.onexit(toShow);
        		$this.flow("hide",options.actual);
        	}
        	if(toShow.condition && !toShow.condition()){
        		toShow = options.mainFlow[toShow.alternate];
        	}
        	if(toShow.next){
        		if(typeof toShow.next == "string"){
        			toShow.display.find(toShow.next).unbind("click.flow").bind("click.flow",function(e){
        				e.preventDefault();
        				e.stopPropagation();
        				$this.flow("setDisplay", index+1);
        			});
        		}
        	}
            if(options.navigation && options.navigation.length){
                var i = 0, len = options.navigation.length, nav, canNavigate, link, isSelected;
                for(;i < len;i++){
                    nav = options.navigation[i];
                    
                    if(hasPermission(nav) && !isSelected){
                        $(nav.link).unbind("click.flow").bind("click.flow",{index : nav.target},function(e){
							e.preventDefault();
							e.stopPropagation();
							if(!$(this).hasClass("selected")){
								$this.flow("setDisplay",e.data.index);
								$(this).addClass("selected").siblings().removeClass("selected");


							}
						});
						if(nav.target == toShow.navSelection || nav.target == toShow.id){
							$(nav.link).addClass("selected").siblings().removeClass("selected");
						}
                    }else if(!isSelected){
                        link.addClass("disabled").removeClass("selected");
                    }
                }
            }
            $(".flow-feature").addClass(toShow.id);
        	$this.flow("showFeatures",false,toShow.hideFeatures);
        	$this.flow("showFeatures",true,toShow.showFeatures);
        	$this.flow("setTriggers",toShow);
        	toShow.beforeshow && toShow.beforeshow(toShow);
        	options.actual = toShow;


            if(options.enableHashStates){
                 
                var state = "#"+toShow.id, data = toShow.history.data || null, title = "", second = "",
                data =  $.fn.extend(data, {toShow: toShow.id}),
                second = toShow.history.title || toShow.id,
                title = $.trim(options.title); + " " + title;
                $.bbq.pushState(state)
            }
            if(!toShow.content){
                $this.flow("show",toShow);
            }else{
                $this.flow("loadContent",toShow);
            }
        	function getIndex(id){
        		if($.isNumeric(index)){ return index;}
        		var flow = options.mainFlow, i = 0, ilen = flow.length;  
        		for(;i < ilen;i++){
        			if(options.mainFlow[i].id == id){
        				return i;
        			} 
        		}
        		console.log("No existe id: "+id);
        		return -1;        		 
        	}
            function hasPermission(navigation){
                var navroles = navigation.roles,
                    useroles = options.roles, navlen, userlen,
                    i = 0, j = 0;
                    userlen = (useroles ? useroles.length : 0);
                    navlen = (navroles ? navroles.length : 0);
				
                if(!navlen){
                    return true;
                }else{
                    if(navroles[0] === "*"){
                        return true;
                    }else if(!userlen){
                        return false;
                    }else{
                        for(; i < userlen ; i++){
                            for(; j < userlen ; j++){
                                if(useroles[i] === navroles[j]){
                                    return true;
                                }
                            }
                        }
                        return false;
                    }
                }
            }
        	return $this;
        },
        loadContent: function(toShow){
            var $this = $(this),
                options =   $.data(this[0],"options"),
                url = toShow.content.url;
                if(!url) url = routes.route(toShow.content.route, options.env);

            if(toShow.content.format == "json"){
                $.ajax({ 
                   type: "GET",
                   dataType: "json",
                   url: url,
                   success: function(data){
                    if(!toShow.content.handler){
                        $this.flow("fill",toShow, data);
                    }else{
                        toShow.content.handler(toShow, data);
                        $this.flow("show",toShow);
                    }
                   }
                });
            }
            //TODO: Other formats
        },
        fill: function(toShow, data){
            var $this = $(this);
            template = $this.flow("getTemplate",toShow.content.template);
            toShow.display.html(template.template(data));
            $this.flow("show",toShow);
        },
        show: function(toShow){
        	var $this = $(this),
        		options =   $.data(this[0],"options"),
        		transition = toShow.inTransition || options.defaultInTransition || "none";
        	if(typeof transition == "string"){
        		if(transition == "fade"){
        			toShow.display.fadeIn(500, function(){toShow.onshow && toShow.onshow(toShow); });
        		}else{
        			toShow.display.show();
        			toShow.onshow && toShow.onshow(toShow); 
        		}
        	}else{
        		//TODO
        	}
        },
        hide: function(toHide){
        	var $this = $(this),
        		options =   $.data(this[0],"options"),
        		transition = toHide.outTransition || options.defaultOutTransition || "none";
        	if(typeof transition == "string"){
        		transition == "fade" ? toHide.display.fadeOut() : toHide.display.hide() ;
        	}else{
        		//TODO
        	}
        },
        showFeatures: function(show, obj){ //show: boolean
        	var $this = $(this);
        	if(obj){
	        	if($.isArray(obj)){
	        		$.each(obj, function(i, feat){
	        			$this.flow("showFeature",show,$this.flow("getFeature",feat));
	        		});
	        	}else{
	        		$this.flow("showFeature",show,$this.flow("getFeature",obj));
	        	}
	        }
        },
        getFeature: function(id){
            var $this = $(this),
                options =   $.data(this[0],"options"),
                features = options.features, len = features.length, i = 0, f;
            for(; i < len ; i++){
                f = features[i];
                if(id == f.id){
                    return f;
                }
            }
            return null;                
        },
        getTemplate: function(name){
            var $this = $(this),
                options =   $.data(this[0],"options"),
                templates = options.templates, len = templates.length, i = 0, t;
            for(; i < len ; i++){
                t = templates[i];
                if(name == t.name){
                    return t;
                }
            }
            return null;                
        },
        showFeature: function(show, f){
        	var $this = $(this);
        	if(show){
        		if(f.hidden){
	        		if(!f.show) f.elem.show();
	        		if(f.show == "fade" ) f.elem.fadeIn();
	        		else{
		   				$this.flow("animate", f.elem, f.show, 500);
	        		}
	        		f.hidden = false;
        		}
        	}else{
        		if(!f.hidden){
	        		if(!f.hide) f.elem.hide();
	        		if(f.hide == "fade" ) f.elem.fadeOut();
	        		else{
	        			$this.flow("animate", f.elem ,f.hide, 500);
	        		}
	        		f.hidden = true;
	        	}
        	}
        },
        setTriggers: function(toShow){
        	var $this = $(this);
        	if($.isArray(toShow.trigger)){
        		$.each(toShow.trigger,function(i,trigger){
        			setTrigger(trigger);
        		});
        	}else if($.isPlainObject(toShow.trigger)){
        		setTrigger(toShow.trigger);
        	}
        	function setTrigger(trigger){
                if(!trigger.action){
                    trigger.action = "click";
                }
        		if(!$.isFunction(trigger.behavior)){
        			if(typeof trigger.behavior === "string"){
        				var tokens = trigger.behavior.split(":");
        				if(tokens.length == 2){
        					if(tokens[0] == "go"){
        						toShow.display.find(trigger.selector).unbind(trigger.action+".flow").bind(trigger.action+".flow",function(e){
        							stop(e);
        							$this.flow("setDisplay",tokens[1]);
        						});
        					}
        				}
        			}
        		}else{
        			toShow.display.find(trigger.selector).unbind(trigger.action+".flow").bind(trigger.action+".flow",{actual:toShow},trigger.behavior);
        		}
        	}
        },
        animate: function(elem,mode,speed){
        	var wh = $(window).height(), position = elem.data("position");
        	speed = speed || 500;
        	if(mode == "bottom-down"){
        		elem.css("top",position.top);
        		elem.show().animate({top:wh},speed);
        	}
        	if(mode == "bottom-up"){
        		elem.css("top",wh);
        		elem.show().animate({top:position.top},500);
        	}
        },
    	status: function(){
    		var $this = $(this),
        		options =   $.data(this[0],"options");
	   		return {
    			index: $(this).find(".page").index($(this).find(".page:visible")),
    			actual: options.actual
    		};
    	},
        onStateChange: function(e){
            console.log(e, History.getState());
        },
        roles: function(){
            var $this = $(this),
                options =  $this.data("options"),
                roles = options.roles,
                len = arguments.length, i = 0, roletoadd;
            if(len){
            	for(; i < len ; i++){
            		roletoadd = arguments[i];
            		if($.isArray(roletoadd)){
            			addRoleArray(roletoadd);
            		}else{
            			addRole(roletoadd);
            		}
            	}
                options.roles = roles;
            }else{
                return options.roles; 
            }
            function addRoleArray(rolesarray){
            	var i =0, lenarray = rolesarray.length;
            	for(; i < lenarray ; i++){
            		addRole(rolesarray[i]);
            	}
            }
            function addRole(role){
            	 if(typeof role === "string"){
            	 	if(!hasRole(role)){
            	 		roles.push(role);
            	 	}
            	 }
            }
            function hasRole(role){
            	var i=0, len = roles.length;
            	for(; i < len ; i++){
            		if(roles[i] == role){
            			return true;
            		}
            	}
            	return false;
            }
        }
    };

    $.fn.flow = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.modal');
        }
    };
})(jQuery);