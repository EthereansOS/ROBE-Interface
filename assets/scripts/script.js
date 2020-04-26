window.voidEthereumAddress = '0x0000000000000000000000000000000000000000';
window.voidEthereumAddressExtended = '0x0000000000000000000000000000000000000000000000000000000000000000';
window.descriptionWordLimit = 300;
window.urlRegex = /(https?:\/\/[^\s]+)/g;
window.base64Regex = /data:([\S]+)\/([\S]+);base64,/gs;

window.Main = async function Main() {
    await window.loadContext();
    if (!await window.blockchainSetup()) {
        return;
    }
    window.onEthereumUpdate();
    window.choosePage();
};

window.newContract = function newContract(abi, address) {
    if (!address) {
        return new window.web3.eth.Contract(abi);
    }
    window.contracts = window.contracts || {};
    var key = address.toLowerCase();
    return window.contracts[key] || (window.contracts[key] = new window.web3.eth.Contract(abi, address));
};

window.blockchainSetup = async function blockchainSetup() {
    if (typeof window.ethereum === 'undefined') {
        return;
    }
    try {
        window.ethereum.autoRefreshOnNetworkChange && (window.ethereum.autoRefreshOnNetworkChange = false);
        window.ethereum.on && window.ethereum.on('networkChanged', window.onEthereumUpdate);
        window.ethereum.on && window.ethereum.on('accountsChanged', window.onEthereumUpdate);
        return window.onEthereumUpdate(0);
    } catch (e) {
        throw 'An error occurred while trying to setup the Blockchain Connection: ' + (e.message || e + '.');
    }
};

window.onEthereumUpdate = function onEthereumUpdate(millis) {
    return new Promise(function(ok) {
        setTimeout(async function() {
            if (!window.networkId || window.networkId !== await window.web3.eth.net.getId()) {
                delete window.contracts;
                window.web3 = new window.Web3Browser(window.web3.currentProvider);
                window.networkId = await window.web3.eth.net.getId();
                var network = window.context.ethereumNetwork[window.networkId];
                if (network === undefined || network === null) {
                    return alert('This network is actually not supported!');
                }
                $.publish('ethereum/update');
            }
            try {
                window.walletAddress = (await window.web3.eth.getAccounts())[0];
            } catch (e) {}
            $.publish('ethereum/ping');
            return ok(window.web3);
        }, !isNaN(millis) ? millis : 550);
    });
};

window.getNetworkElement = function getNetworkElement(element) {
    var network = window.context.ethereumNetwork[window.networkId];
    if (network === undefined || network === null) {
        return;
    }
    return window.context[element + network];
};

window.loadContext = async function loadContext() {
    var x = await fetch('data/context.json');
    window.context = await x.text();
    window.context = JSON.parse(window.context);
};

window.choosePage = function choosePage() {
    var page = undefined;
    try {
        page = window.location.pathname.split('/').join('');
        page = page.indexOf('.html') === -1 ? undefined : page.split('.html').join('');
    } catch (e) {}
    page = (page || 'index') + 'Main';

    try {
        var maybePromise = window[page] && window[page]();
        maybePromise && maybePromise.catch && maybePromise.catch(console.error);
    } catch (e) {
        console.error(e);
    }
};

window.getData = function getData(root, checkValidation) {
    if (!root) {
        return;
    }
    var data = {};
    var children = root.children().find('input,select,textarea');
    children.length === 0 && (children = root.children('input,select,textarea'));
    children.each(function(i, input) {
        var id = input.id || i;
        input.type && input.type !== 'checkbox' && (data[id] = input.value.split(' ').join(''));
        input.type === 'number' && (data[id] = parseInt(data[id]));
        input.type === 'number' && isNaN(data[id]) && (data[id] = parseInt(input.dataset.defaultValue));
        input.type === 'checkbox' && (data[id] = input.checked);
        !input.type || input.type === 'hidden' && (data[id] = $(input).val());
        if (checkValidation) {
            if (!data[id]) {
                throw "Data is mandatory";
            }
            if (input.type === 'number' && isNaN(data[id])) {
                throw "Number is mandatory";
            }
        }
    });
    return data;
};

window.setData = function setData(root, data) {
    if (!root || !data) {
        return;
    }
    var children = root.children().find('input,select,textarea');
    children.length === 0 && (children = root.children('input,select,textarea'));
    children.each(function(i, input) {
        var id = input.id || i;
        input.type && input.type !== 'checkbox' && $(input).val(data[id]);
        input.type && input.type === 'checkbox' && (input.checked = data[id] === true);
    });
};

window.getAddress = async function getAddress() {
    await window.ethereum.enable();
    return (window.walletAddress = (await window.web3.eth.getAccounts())[0]);
};

window.getSendingOptions = function getSendingOptions(transaction) {
    return new Promise(async function(ok, ko) {
        if(transaction) {
            var address = await window.getAddress();
            return transaction.estimateGas({
                from: address,
                gasPrice: window.web3.utils.toWei("13", "gwei")
            }, 
            function(error, gas) {
                if(error) {
                    return ko(error);
                }
                return ok({
                    from: address,
                    gas
                });
            });
        }
        return ok({
            from: window.walletAddress || null,
            gas: window.gasLimit || '7900000'
        });
    });
};

window.createContract = async function createContract(abi, bin) {
    var args = [];
    if (arguments.length > 2) {
        for (var i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
    }
    return await window.sendBlockchainTransaction(window.newContract(abi).deploy({
        data: bin,
        arguments: args
    }));
};

window.blockchainCall = async function blockchainCall(call) {
    var args = [];
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
    }
    var method = (call.implementation ? call.get : call.new ? call.new : call).apply(call, args);
    return await (method._method.stateMutability === 'view' || method._method.stateMutability === 'pure' ? method.call(await window.getSendingOptions()) : window.sendBlockchainTransaction(method));
};

window.sendBlockchainTransaction = function sendBlockchainTransaction(transaction) {
    return new Promise(async function(ok, ko) {
        (transaction = transaction.send ? transaction.send(await window.getSendingOptions(transaction), err => err && ko(err)) : transaction).on('transactionHash', transactionHash => {
            var timeout = async function() {
                var receipt = await window.web3.eth.getTransactionReceipt(transactionHash);
                if (!receipt || !receipt.blockNumber || parseInt(await window.web3.eth.getBlockNumber()) <= (parseInt(receipt.blockNumber) + (window.context.transactionConfirmations || 0))) {
                    return window.setTimeout(timeout, window.context.transactionConfirmationsTimeoutMillis);
                }
                return transaction.catch(ko).then(ok);
            };
            window.setTimeout(timeout);
        });
    });
};

window.indexMain = function indexMain() {
    window.Boot();
};

window.loadContent = async function loadContent(tokenId, ocelotAddress, raw) {
    var metadata = await window.loadContentMetadata(tokenId, ocelotAddress);
    var chains = [];
    var ocelot = window.newContract(window.context.OcelotAbi, (!ocelotAddress || ocelotAddress === window.voidEthereumAddress) ? window.getNetworkElement('defaultOcelotTokenAddress') : ocelotAddress);
    for (var i = 0; i < metadata[0]; i++) {
        var content = await window.blockchainCall(ocelot.methods.content, tokenId, i);
        chains.push(i === 0 ? content : content.substring(2));
    }
    var value = chains.join('');
    value = window.web3.utils.toUtf8(value).trim();
    value = raw ? value : Base64.decode(value.substring(value.indexOf(',')));
    var regex = new RegExp(window.base64Regex).exec(value);
    !raw && regex && regex.index === 0 && (value = Base64.decode(value.substring(value.indexOf(','))));
    return value;
};

window.loadContentMetadata = async function loadContentMetadata(tokenId, ocelotAddress) {
    var ocelot = window.newContract(window.context.OcelotAbi, (!ocelotAddress || ocelotAddress === window.voidEthereumAddress) ? window.getNetworkElement('defaultOcelotTokenAddress') : ocelotAddress);
    var metadata = await window.blockchainCall(ocelot.methods.metadata, tokenId);
    metadata[0] = parseInt(metadata[0]);
    metadata[1] = parseInt(metadata[1]) * 2 + 4;
    return metadata;
};

window.split = function split(content, length) {
    var regex = new RegExp(window.base64Regex).exec(content);
    content = regex && regex.index === 0 ? content : ('data:text/plain;base64,' + Base64.encode(content));
    var data = window.web3.utils.fromUtf8(content);
    var inputs = [];
    var defaultLength = (length || window.context.singleTokenLength) - 2;
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

window.mint = async function mint(inputs, ocelotAddress, silent, firstChunkCallback, tokenId, start) {
    var ocelot = window.newContract(window.context.OcelotAbi, ocelotAddress || (!ocelotAddress || ocelotAddress === window.voidEthereumAddress) ? window.getNetworkElement('defaultOcelotTokenAddress') : ocelotAddress);
    inputs = (typeof inputs).toLowerCase() === 'string' ? window.split(inputs) : inputs;
    for (var i = start || 0; i < inputs.length; i++) {
        var input = inputs[i];
        !silent && $.publish('message', "Minting " + (i + 1) + " of " + inputs.length + " tokens", "info");
        var method = ocelot.methods['mint' + (i === inputs.length - 1 ? 'AndFinalize' : '') + (i === 0 ? '' : ('(uint256,bytes)'))];
        var args = [
            method
        ];
        i > 0 && args.push(tokenId)
        args.push(input);
        var txReceipt = await window.blockchainCall.apply(window, args);
        if(!tokenId) {
            tokenId = parseInt(txReceipt.events.Minted.returnValues.tokenId);
            firstChunkCallback && firstChunkCallback(tokenId);
        }
    }
    return tokenId;
};

window.onload = function() {
    Main().catch(function(e) {
        return alert(e.message || e);
    });
};