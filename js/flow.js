/* Flow v0.6 */
(function() {
    var root = this,
        options = {
            pageClass: 'flow-page',
            featureClass: 'flow-feature',
            pageTag: 'article',
            autostart: true,
            title: '',
            roles: [],
            id: 'flow-container',
            flow: []
        }, el,
        Flow = root.Flow = {},
        stopActionFlag = false;

    // Metodos y atributos publicos
    Flow.stopAction = stopAction;
    Flow.setup = setup;
    Flow.start = start;
    Flow.roles = roles;
    Flow.hasRole = hasRole;
    Flow.removeRole = removeRole;
    Flow.prevStop = prevStop;
    Flow.setDisplay = setDisplay;
    Flow.status = status;
    Flow.getTemplate = getTemplate;
    Flow.setTriggers = setTriggers;
    Flow.env = env;
    Flow.locale = locale;
    Flow.hasPermission = hasPermission;
    Flow.getHashParams = getHashParams;
    Flow.get = get;
    Flow.set = set;
    Flow.bind = bind;
    Flow.unbind = unbind;
    Flow.trigger = trigger;
    Flow.util = {
        parse: parse,
        json: json,
        prevStop: prevStop,
        authFinished: authFinished
    };

    function setup(op) {
        $.fn.extend(options, op);
        el = $('#' + options.id);
        el.find('.' + options.pageClass).hide();
        initPages();
        initLoading();
        initFeatures();
        bindHistoryEvents();
        initTemplates();
        if (Behaviors.initializa) {
            Behaviors.initializa();
        } else if (options.initialize) {
            options.initialize();
        }
        if (options.flow.length > 0) {
            if (hasHash()) {
                $(window).trigger('hashchange');
            } else if (options.autostart) {
                Flow.start();
            }
        }
    }

    function start() {
        Flow.setDisplay(options.flow[0].id);
    }

    function setDisplay(state) {
        $.bbq.pushState(state, 2);
    }

    function status() {
        return {
            index: el.find('.' + options.pageClass)
                .index(el.find('.' + options.pageClass + ':visible')),
            actual: options.actual
        };
    }

    function getTemplate(name) {
        return searchArray(options.templates, name, 'name');
    }

    function setTriggers(toShow) {
        if ($.isArray(toShow.trigger)) {
            $.each(toShow.trigger, function(i, trigger) {
                setTrigger(trigger, toShow);
            });
        } else if ($.isPlainObject(toShow.trigger)) {
            setTrigger(toShow.trigger, toShow);
        }
    }

    function env() {
        return options.env;
    }

    function locale() {
        if (arguments.length) {
            Flow.options.locale = arguments[0];
        } else {
            return options.locale;
        }
    }

    function initPages() {
        var len = options.flow.length,
            i = 0,
            page, obj, access;
        for (; i < len; i++) {
            obj = options.flow[i];
            access = Flow.hasPermission(obj.roles);
            page = addPage(obj);
            setSubflow(obj);
            initNavigation(obj, access);
            obj.display = page;
        }
    }

    function initLoading() {
        if (options.loading) {
            $('#' + options.id)
            .append($('<div id="flow-loading" class="flow-loading"><img src="' +
                options.loading + '" /></div>'));
        }
    }

    function addPage(obj) {
        var page = $('#' + obj.id),
            id = page.attr('id');
        if (!page.length) {
            page = $('<' + options.pageTag + '></' + options.pageTag + '>')
                .addClass(options.pageClass).prop('id', obj.id).hide();
            $('#' + options.id).append(page);
        }
        page.addClass(id).attr('id', options.pageClass + '-' + id);
        return page;
    }

    function setSubflow(flow) {
        var subflow = flow.subflow,
            len,
            i = 0,
            obj, page;
        if (subflow && $.isArray(subflow)) {
            len = subflow.length;
            for (; i < len; i++) {
                obj = subflow[i];
                obj.parent = flow.id;
                obj.id = obj.parent + '.' + obj.id;
                options.flow.push(obj);
                page = addPage($('#' + obj.id));
                obj.display = page;
            }
        }
    }

    function initNavigation(page, canAccess) {
        if (options.navigation && page.navigation) {
            var classes = [],
                classesStr = '';
            if (page.disabled) {
                classes.push('disabled');
            }
            if (!canAccess) {
                classes.push('restricted');
            }
            if (classes.length) {
                classesStr = ' class="' + classes.join(' ') + ' ';
            }
            $(options.navigation)
            .append('<li id="nav-' + page.id + '"' + classesStr +
                '"><a href="#' + page.id + '">' +
                page.navigation.label + '</a></li>');
        }
    }

    function loadContent(toShow, query) {
        var c = toShow.content;
        var url = c.url;
        if (toShow.beforeloadcontent) {
            toShow.beforeloadcontent(toShow);
        }

        if (c.handler) {
            c.handler(toShow, query);
            if (options.actual.id != toShow.id) {
                return;
            }
            show(toShow);
            Flow.setTriggers(toShow);
            if (options.aftershowpage) {
                options.aftershowpage(toShow);
            }
        } else {
            if (options.loading) {
                $('#flow-loading').show();
            }
            if (!url) {
                url = Routes.get(c.route, query);
            }
            if (c.format == 'json') {
                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: url,
                    success: function(data) {
                        if (options.actual.id != toShow.id) {
                            return;
                        }
                        if (toShow.onloadcontent) {
                            toShow.onloadcontent(data);
                        }
                        fill(toShow, data);
                        if (options.loading) {
                            $('#flow-loading').hide();
                        }
                    },
                    error: function(x) {
                        if (x.status == 404) {
                            if (toShow.parent) {
                                Flow.setDisplay('#' + toShow.parent);
                            }
                        }
                        if (options.loading) {
                            $('#flow-loading').hide();
                        }
                    }
                });
            }
        }
    }

    function fill(toShow, data) {
        template = Flow.getTemplate(toShow.content.template);
        toShow.display.html(template.template(data));
        show(toShow);
        Flow.setTriggers(toShow);
        if (options.aftershowpage) {
            options.aftershowpage(toShow);
        }
    }

    function show(toShow) {
        var transition = toShow.inTransition ||
            options.defaultInTransition || 'none';
        if (typeof transition === 'string') {
            if (transition === 'fade') {
                toShow.display.fadeIn(500,function() {
                    if (toShow.onshow) {
                        toShow.onshow(toShow);
                    }
                });
            } else {
                toShow.display.show();
                if (toShow.onshow) {
                    toShow.onshow(toShow);
                }
            }
        } else {
            //TODO
        }
    }

    function hide(toHide) {
        var transition = toHide.outTransition ||
            options.defaultOutTransition || 'none';
        if (typeof transition === 'string') {
            if (transition === 'fade') {
                toHide.display.fadeOut();
            } else {
                toHide.display.hide();
            }
        } else {
            //TODO
        }
    }

    function setTrigger(trigger, toShow) {
        if (!trigger.action) {
            trigger.action = 'click';
        }
        if (!$.isFunction(trigger.behavior)) {
            if (typeof trigger.behavior === 'string') {
                var tokens = trigger.behavior.split(':');
                if (tokens.length == 2) {
                    if (tokens[0] == 'go') {
                        toShow.display
                            .find(trigger.selector)
                            .unbind(trigger.action + '.flow')
                            .bind(trigger.action + '.flow', function(e) {
                            prevStop(e);
                            Flow.setDisplay('#' + tokens[1]);
                        });
                    }
                }
            }
        } else {
            toShow.display
                .find(trigger.selector)
                .unbind(trigger.action + '.flow')
                .bind(trigger.action + '.flow', {
                actual: toShow
            }, trigger.behavior);
        }
    }

    function showFeatures(show, obj) { //show: boolean
        if (obj) {
            if ($.isArray(obj)) {
                $.each(obj, function(i, feat) {
                    showFeature(show, getFeature(feat));
                });
            } else {
                showFeature(show, getFeature(obj));
            }
        }
    }

    function showFeature(show, f) {
        if (f === null) { return; }
        if (show) {
            if (f.hidden) {
                if (!f.show) {
                    f.elem.show();
                }
                if (f.show == 'fade') {
                    f.elem.fadeIn();
                } else {
                    animate(f.elem, f.show, 500);
                }
                f.hidden = false;
            }
        } else {
            if (!f.hidden) {
                if (!f.hide) {
                    f.elem.hide();
                }
                if (f.hide == 'fade') {
                    f.elem.fadeOut();
                } else {
                    animate(f.elem, f.hide, 500);
                }
                f.hidden = true;
            }
        }
    }

    function getFeature(id) {
        return searchArray(options.features, id, 'id');
    }

    function initFeatures() {
        var len = 0,
            i = 0;
        options.features = [];
        $('.flow-feature').hide().each(function(i, elem) {
            elem = $(elem);
            var feature = {
                id: elem.attr('id'),
                elem: elem,
                hidden: true
            };
            feature.elem.show();
            feature.elem.data('position', feature.elem.position());
            feature.elem.hide();
            options.features.push(feature);
        });
    }

    function prevStop(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function hasHash() {
        return location.href.indexOf('#') != -1;
    }

    function bindHistoryEvents() {
        $(window).bind('hashchange', onhashchange);
    }

    function onhashchange(e) {
        var state = e.fragment,
            params = $.deparam.fragment(),
            index,
            toShow,
            hasPermission;
        index = getIndex(getRealhash(params));
        if (index < 0) {
            index = 0;
        }
        toShow = options.flow[index];

        if (Behaviors.authorize &&
            Behaviors[toShow.id] &&
            Behaviors[toShow.id].onauthorize) {
            unbind('authFinished');
            bind('authFinished', function() {
                checkPermission(toShow, params);
            });
            callFunction(Behaviors, 'authorize',
                Behaviors[toShow.id].onauthorize,
                Behaviors[toShow.id].onunauthorize);
        } else {
            checkPermission(toShow, params);
        }
    }

    function checkPermission(toShow, params) {
        var hasPermission = Flow.hasPermission(toShow.roles),
            isDisabled = toShow.disabled;

        if (hasPermission && !isDisabled) {
            showDisplay({
                toShow: toShow,
                query: params.params
            });
        } else {
            console.error('NOT Authorized!');
            callBehaviorsFunction(toShow, 'onunauthorized');
        }
    }

    function getRealhash(params) {
        if (!params.hash) {
            return location.hash.substring(1);
        } else {
            return params.hash.substring(1);
        }
    }

    function hasQuery(state) {
        return state.indexOf('=') != -1;
    }

    function showDisplay(parameters) {
        var toShow = parameters.toShow,
            second, title;
        if (toShow.navigation) {
            refreshNavigation(toShow);
        }
        // Ocultamos el acutal
        if (options.actual) {
            $('body, .' + options.featureClass).removeClass(options.actual.id);
            if (options.actual.onexit) {
                options.actual.onexit(options.actual);
            }
            hide(options.actual);
        }

        $('body,.' + options.featureClass).addClass(toShow.id);
        showFeatures(false, toShow.hideFeatures);
        showFeatures(true, toShow.showFeatures);
        callBehaviorsFunction(toShow, 'beforeshow');
        if (stopActionFlag) {
            stopActionFlag = false;
            return;
        }
        options.actual = toShow;

        if (toShow.title) {
            second = toShow.title || '';
            title = $.trim(options.title + ' ' + second);
            document.title = title;
        }

        if (!toShow.content) {
            show(toShow);
            Flow.setTriggers(toShow);
            if (options.aftershowpage) {
                options.aftershowpage(toShow);
            }
            $(window).scrollTop(0);
        } else {
            loadContent(toShow, parameters.query);
        }
    }

    function refreshNavigation(toShow) {
        var link, isDisabled;
        if (toShow.navigation.label) {
            link = $(options.navigation + ' #nav-' + toShow.id)
                .not('.disabled')
                .addClass('selected')
                .siblings()
                .removeClass('selected');
        }
    }

    function initTemplates() {
        if (options.templates) {
            var len = 0,
                i = 0;
            len = options.templates.length;
            for (; i < len; i++) {
                var template = options.templates[i];
                template.engine = template.engine || 'handlebars';
                if (template.engine === 'handlebars') {
                    template.template = Handlebars
                        .compile($('#' + template.id).html());
                }
            }
        }
    }

    function getIndex(id) {
        if ($.isNumeric(id)) {
            return id;
        }
        var i = 0,
            ilen = options.flow.length;
        for (; i < ilen; i++) {
            if (options.flow[i].id == id) {
                return i;
            }
        }
        console.log('No existe id: ' + id);
        return -1;
    }

    function hasPermission(navroles) {
        var useroles = options.roles,
            navlen, userlen,
            i = 0,
            j = 0;
        userlen = (useroles ? useroles.length : 0);
        navlen = (navroles ? navroles.length : 0);

        if (!navlen) {
            return true;
        } else {
            if (navroles[0] === '*') {
                return true;
            } else if (!userlen) {
                return false;
            } else {
                for (; i < userlen; i++) {
                    for (; j < userlen; j++) {
                        if (useroles[i] === navroles[j]) {
                            return true;
                        }
                    }
                }
                return false;
            }
        }
    }

    function getHashParams(hash, params) {
        params = {
            hash: hash,
            params: params
        };
        return $.param.fragment(hash, params);
    }

    function searchArray(arr, id, compareField, returnField) {
        if (arr) {
            var len = arr.length,
                i = 0,
                obj;
            for (; i < len; i++) {
                obj = arr[i];
                if (id == obj[compareField]) {
                    if (returnField) {
                        return obj[returnField];
                    }
                    return obj;
                }
            }
        }
        return null;
    }

    function animate(elem, mode, speed) {
        var wh = $(window).height(),
            position = elem.data('position');
        speed = speed || 500;
        if (mode == 'bottom-down') {
            elem.css('top', position.top);
            elem.show().animate({
                top: wh
            }, speed);
        }
        if (mode == 'bottom-up') {
            elem.css('top', wh);
            elem.show().animate({
                top: position.top
            }, 500);
        }
    }

    function roles() {
        var len = arguments.length,
            i = 0,
            roletoadd;
        if (len) {
            for (; i < len; i++) {
                roletoadd = arguments[i];
                if ($.isArray(roletoadd)) {
                    addRoleArray(roletoadd);
                } else {
                    addRole(roletoadd);
                }
            }
        }
        return options.roles;
    }

    function removeRole(role) {
        var array = options.roles;
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] === role) {
                array.splice(i, 1);
            }
        }
    }

    function addRoleArray(rolesarray) {
        var i = 0,
            lenarray = rolesarray.length;
        for (; i < lenarray; i++) {
            addRole(rolesarray[i]);
        }
    }

    function addRole(role) {
        if (typeof role === 'string') {
            if (!hasRole(role)) {
                options.roles.push(role);
            }
        }
    }

    function hasRole(role) {
        var i = 0,
            len = options.roles.length;
        for (; i < len; i++) {
            if (options.roles[i] == role) {
                return true;
            }
        }
        return false;
    }

    function callBehaviorsFunction(toShow, functionName) {
        var scope = Behaviors[toShow.id];
        callFunction(scope, functionName, toShow);
    }
    function callFunction(scope, functionName) {
        var newargs = Array.prototype.slice.call(arguments, 2);
        if (hasFunction(scope, functionName)) {
            scope[functionName].apply(this, newargs);
        }
    }
    function hasFunction(scope, functionName) {
        try {
            return $.isFunction(scope[functionName]);
        } catch (e) {
            return false;
        }
    }

    function parse(el) {
        var obj = {};
        $(el)
            .find('input[type=text], select, textarea,' +
                'input[type=radio]:checked, input[type=checkbox]:checked')
            .each(function(i) {
                var $el = $(this),
                    dataField = $el.attr('data-field');
                if (typeof dataField !== 'undefined' && dataField !== false) {
                    obj[dataField] = $el.val();
                } else {
                    obj[$el.prop('id')] = $el.val();
                }
            });
        return obj;
    }

    function stopAction() {
        var len = arguments.length;
        if (len) {
            if (typeof arguments[0] === 'boolean') {
                stopActionFlag = arguments[0];

            }
        }
        return stopActionFlag;
    }

    function set(key, value) {
        el.data(key, value);
    }

    function get(key) {
        return el.data(key);
    }

    function bind(eventName, callback, data) {
        $(root).bind(eventName, callback, data);
    }
    function unbind(eventName) {
        $(root).unbind(eventName);
    }
    function trigger(eventName) {
        $(root).trigger(eventName);
    }

    function authFinished() {
        trigger('authFinished');
    }

    function json(options) {
        options.type = options.method || 'GET';
        var opts = {
            url: options.url,
            async: true,
            type: options.method,
            dataType: 'json',
            success: options.success,
            error: options.error
        }, sep = '?';
        if (options.url.indexOf('?') > -1) {
            sep = '&';
        }
        options.url += sep + 't=' + new Date().getTime();
        opts.url = options.url;
        if (options.data) {
            opts.data = JSON.stringify(options.data);
        }
        if (options.error) {
            opts.error = options.error;
        }
        $.support.cors = true;
        $.ajax(opts);
    }
}).call(this);

(function() {
    var root = this,
        Routes = root.Routes = {},
        route = '/';
    Routes.get = function(route, replacements) {
        var routes, env = Flow.env(),
            url;
        if (env) {
            routes = Routes[env];
        } else {
            routes = Routes;
        }
        ulr = getBase(routes) + routes.routes[route];
        if (replacements && $.isPlainObject(replacements)) {
            for (var prop in replacements) {
                ulr = ulr.replace('{' + prop + '}', '' + replacements[prop]);
            }
        }
        return ulr;
    };
    Routes.routes = function(routes) {
        $.extend(Routes, {
            routes: routes
        });
    };
    Routes.route = function(route, environment) {
        environment = environment || 'development';
        return this.data[environment][route];
    };

    function getBase(routes) {
        return routes.base || '';
    }
}).call(this);

(function() {
    var root = this,
        Behaviors = root.Behaviors = {};
}).call(this);

(function() {
    var root = this,
        Handlers = root.Handlers = {};
}).call(this);

(function() {
    var root = this,
        Messages = root.Messages = {};

    Messages.get = function(msg) {
        var top, locale = Flow.locale();
        if (locale) {
            top = Messages[locale];
        } else {
            top = Messages;
        }
        return top[msg];
    };
}).call(this);
