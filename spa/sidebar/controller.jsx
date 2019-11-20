var SidebarController = function (view) {
    var context = this;
    context.view = view;

    context.is = /contract( )*(\w)+( )*is( )*(\w)+( )*(,( )*(\w)+)*( )*{/gim;

    context.dataLength = 15000;

    context.onCompiled = async function onCompiled(file, sourceData, contextData, compilationData) {
        if (!context.checkForCompilationOK(compilationData)) {
            return;
        }
        var metadata = compilationData.contracts[file];
        metadata = metadata[Object.keys(metadata)[0]];
        metadata = metadata.metadata;
        metadata = JSON.parse(metadata);
        delete metadata.sources;
        delete metadata.output;
        metadata = JSON.stringify(metadata);

        var pragma = compilationData.sources[Object.keys(compilationData.sources)[0]];
        pragma = pragma.ast.nodes;
        for (var i in pragma) {
            var literal = pragma[i];
            if (literal.nodeType === "PragmaDirective") {
                pragma = "pragma " + literal.literals.join('').split('solidity').join('solidity ') + ";";
                break;
            }
        }

        var texts = [];
        Object.keys(sourceData.sources).map(key => {
            var content = sourceData.sources[key].content;
            var split = content.split('pragma');
            content = split[split.length > 1 ? 1 : 0];
            content = content.substring(content.indexOf(';') + 1);
            split = content.split('import');
            if (split.length > 1) {
                content = "";
                for (var i in split) {
                    var elem = split[i];
                    if (elem.trim() === '') {
                        continue;
                    }
                    elem = elem.substring(elem.indexOf(';') + 1).trim();
                    content += elem + '\n';
                }
            }
            texts.push(content.trim());
        });

        var text = '';
        var i = 0;
        while (i < texts.length) {
            var t = texts[i];
            if (!t.match(context.is)) {
                text += (t + '\n\n');
                texts.splice(i, 1);
            } else {
                i++;
            }
        }
        while (texts.length > 0) {
            i = 0;
            while (i < texts.length) {
                var t = texts[i];
                if (t.match(context.is)) {
                    var exec = context.is.exec(t);
                    exec = exec[0].split(' is ')[1].split(' {').join('').trim().split(',');
                    var found = true;
                    for (var z in exec) {
                        exec[z] = exec[z].trim();
                        var contractRegex = new RegExp("contract( )*" + exec[z] + "({| is| )", "gim");
                        var interfaceRegex = new RegExp("interface( )*" + exec[z] + "({| is| )", "gim");
                        if (!text.match(contractRegex) && !text.match(interfaceRegex)) {
                            found = false;
                            break;
                        }
                    }
                    if (found) {
                        text += (t + '\n\n');
                        texts.splice(i, 1);
                    } else {
                        i++;
                    }
                } else {
                    i++;
                }
            }
        }
        text = text.trim();

        text = ('//' + metadata + '\n\n' + pragma + '\n\n' + text).trim();

        context.view.setState({name: file, contract: text});
    };

    context.mint = async function mint(address) {
        var robe = window.web3.eth.contract(window.context.IRobeAbi).at(address);
        var data = window.web3.fromUtf8(context.view.state.contract);
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
        var rootTokenId = undefined;
        for(var i in inputs) {
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
        code = window.web3.toUtf8(code);
        context.renderCode(code);
    };

    context.renderCode = function renderCode(code) {
        var metadata = undefined;
        if(code.indexOf('//') === 0) {
            metadata = JSON.parse(code.split("\n")[0]);
            code = code.substring(code.indexOf('\n'));
        }
        console.log(metadata);
        code = code.trim();
        context.view.emit('editor/show', code);
    };

    context.onCode = async function onCode(code) {
        context.view.setState({name: 'Gigi', contract: code});
    };
};