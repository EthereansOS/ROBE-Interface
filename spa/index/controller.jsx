var IndexController = function (view) {
    var context = this;
    context.view = view;

    context.viewers = {
        'editor': [
            'text'
        ]
    }

    context.split = function split(code, singleTokenLength) {
        return window.split(code, singleTokenLength);
    }

    context.mint = function mint(chunks, tokenId, start) {
        return window.mint(chunks, undefined, false, function(newTokenId) {
            context.view.tokenId && (context.view.tokenId.value = newTokenId);
        }, tokenId, start);
    };

    context.loadContent = function loadContent(tokenId) {
        return window.loadContent(tokenId, undefined, true);
    };

    context.loadContentMetadata = function loadContentMetadata(tokenId) {
        return window.loadContentMetadata(tokenId);
    };

    context.onDownload = async function onDownload(code) {
        var type = code.substring(5, code.indexOf(';'));
        var keys = Object.keys(window.context.supportedFileExtensions);
        var extension;
        for (var i in keys) {
            if (window.context.supportedFileExtensions[keys[i]] == type) {
                extension = keys[i];
                break;
            }
        }
        var a = document.createElement('a');
        a.download = "robeFile." + extension;
        a.href = code;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            context.view.emit('loader/toggle', false);
            context.view.emit('message', "Your Robe Token can be now downloaded!", 'success');
            document.body.removeChild(a);
        }, 300);
    };

    context.onView = async function onView(code, tokenId) {
        var type = code.substring(5, code.indexOf(';'));
        var keys = Object.keys(window.context.supportedFileExtensions);
        var extension;
        for (var i in keys) {
            if (window.context.supportedFileExtensions[keys[i]] == type) {
                extension = keys[i];
                break;
            }
        }
        var viewer = undefined;
        var viewers = Object.keys(context.viewers);
        for (var i in viewers) {
            var key = viewers[i];
            var types = context.viewers[key];
            for (var z in types) {
                if (type.indexOf(types[z]) !== -1) {
                    viewer = key;
                    break;
                }
            }
            if (viewer) {
                break;
            }
        }
        if (!viewer) {
            context.onDownload(code);
            return;
        }
        viewer = viewer[0].toUpperCase() + viewer.substring(1);
        context.view.setState({ content: context['render' + viewer](code, type, extension, tokenId) }, function () {
            context.view.emit('message', '');
            context.view.viewerContent.innerHTML = context.view.state.content;
            var cycleChildren = function(children) {
                if(!children) {
                    return;
                }
                for(var i in children) {
                    var child = children[i];
                    child.onload && child.onload.apply(child);
                    cycleChildren(child.children);
                }
            }
            cycleChildren(context.view.viewerContent.children);
        });
    };

    context.renderEditor = function renderEditor(code, type, extension, tokenId) {
        var text = code.substring(code.indexOf(',') + 1);
        text = atob(text).trim();
        if(!text.split('\n').join('').split('\r').join('').split(' ').join('').split('\t').join('').toLowerCase().indexOf('pragmasolidity') === -1) {
            return context.onDownload(code);
        }
        var name = "view_" + new Date().getTime();
        var funct = function (e, elem) {
            $.unsubscribe(name, funct);
            monaco.editor.create(elem, {
                language: extension, 
                value: text, 
                readOnly: true, 
                theme: 'vs-dark', 
                minimap: {
                    enabled: false
                }
            });
        };
        $.subscribe(name, funct);
        var html = '<div onload="$.publish(\'' + name + '\', this);" style="width:800px;height:600px;border:1px solid grey;text-align:left;"></div>';
        if(type.indexOf('html') !== -1) {
            html = '<div><iframe class="IFrame" src="' + code + '"></iframe><div>' + html + "</div>"
        }
        return html;
    };
};