var IndexController = function(view) {
    var context = this;
    context.view = view;

    context.dataLength = 15000;

    context.split = function split(content) {
        var data = window.web3.fromUtf8(content);
        var inputs = [];
        var defaultLength = context.dataLength - 2;
        if(data.length <= defaultLength) {
            inputs.push(data);
        } else {
            while(data.length > 0) {
                var length = data.length < defaultLength ? data.length : defaultLength;
                var piece = data.substring(0, length);
                data = data.substring(length);
                if(inputs.length > 0) {
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
        for(var i in inputs) {
            context.view.emit('message', "Minting " + i + " of " + inputs.length + " tokens", "info");
            var input = inputs[i = parseInt(i)];
            var method = robe['mint' + (i === inputs.length - 1 ? 'AndFinalize' : '')];
            method = i === 0 ? method['bytes'] : i > 0 && i > inputs.length - 1 ? method['uint256,bytes'] : method;
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
        for(var i in chain) {
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
        for(var i in keys) {
            if(window.context.supportedFileExtensions[keys[i]] == type) {
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
        setTimeout(function() {
            document.body.removeChild(a);
        }, 300);
    };
};