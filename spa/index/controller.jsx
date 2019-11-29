var IndexController = function (view) {
    var context = this;
    context.view = view;

    context.viewers = {
        'editor': [
            'text',
            'json',
            'sql'
        ],
        'image': [
            'image'
        ]
    }

    context.split = function split(content) {
        var data = window.web3.fromUtf8(content);
        var inputs = [];
        var defaultLength = parseInt(context.view.singleTokenLength.value) - 2;
        if (data.length <= defaultLength) {
            inputs.push(data);
        } else {
            while (data.length > 0) {
                var length = data.length < defaultLength ? data.length : defaultLength;
                var piece = data.substring(0, length);
                data = data.substring(length);
                if (inputs.length > 0) {
                    piece = '0x' + piece;
                }
                inputs.push(piece);
            }
        }
        return inputs;
    };

    context.mint = async function mint(address, inputs) {
        var robe = window.web3.eth.contract(window.context.IRobeAbi).at(address);
        var rootTokenId = undefined;
        for (var i in inputs) {
            var input = inputs[i = parseInt(i)];
            context.view.emit('message', "Minting " + (i + 1) + " of " + inputs.length + " tokens", "info");
            var method = robe['mint' + (i === inputs.length - 1 ? 'AndFinalize' : '')];
            method = i === 0 ? method['bytes'] : method['uint256,bytes'];
            var args = [
                method
            ];
            i > 0 && args.push(rootTokenId)
            args.push(input);
            var txReceipt = await window.waitForReceipt(await window.blockchainCall.apply(window, args));
            rootTokenId = rootTokenId === undefined ? decodeAbiParameters(['uint256'], txReceipt.logs[0].topics[1]) : rootTokenId;
        }
        return rootTokenId;
    };

    context.checkForCompilationOK = function checkForCompilationOK(data) {
        if (!data || !data.errors || !data.errors.length || data.errors === 0) {
            return true;
        }
        for (var i in data.errors) {
            var error = data.errors[i];
            if (error.type !== 'Warning') {
                return false;
            }
        }
        return true;
    };

    context.load = async function load(address, rootTokenId) {
        var robe = window.web3.eth.contract(window.context.IRobeAbi).at(address);
        rootTokenId = await window.blockchainCall(robe.getRoot, rootTokenId);
        var chain = await window.blockchainCall(robe.getChain, rootTokenId);
        var chains = [];
        for (var i in chain) {
            var content = await window.blockchainCall(robe.getContent, chain[i].toNumber());
            chains.push(i === '0' ? content : content.substring(2));
        }
        var code = chains.join('');
        code = window.web3.toUtf8(code).trim();
        return code;
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

    context.onView = async function onView(code, rootTokenId) {
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
        context.view.setState({ content: context['render' + viewer](code, type, extension, rootTokenId) }, function () {
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

    context.renderImage = function renderImage(code, type) {
        return '<img src="' + code + '"' + (type.indexOf('svg') !== -1 ? ' width="180"' : '') + '/>';
    };

    context.renderEditor = function renderEditor(code, type, extension, rootTokenId) {
        var text = code.substring(code.indexOf(',') + 1);
        text = atob(text).trim();
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