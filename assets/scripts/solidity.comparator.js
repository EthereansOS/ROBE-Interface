var SolidityComparator = function() {
    return {

        reformatMetadata(metadata, source) {
            var input = {};
            input['settings'] = metadata['settings'];
            var fileName = Object.keys(input['settings']['compilationTarget'])[0];
            var contractName = input['settings']['compilationTarget'][fileName];
            delete input['settings']['compilationTarget'];

            input['sources'] = {};
            input['sources'][fileName] = { 'content': source }
            input['language'] = metadata['language']
            input['settings']['metadata'] = input['settings']['metadata'] || {}
            input['settings']['outputSelection'] = input['settings']['outputSelection'] || {}
            input['settings']['outputSelection'][fileName] = input['settings']['outputSelection'][fileName] || {}
            input['settings']['outputSelection'][fileName][contractName] = ['evm.deployedBytecode']

            return {
                input: input,
                fileName: fileName,
                contractName: contractName
            }
        },

        cleanBytecode(bytecode) {
            return bytecode.substring(0, bytecode.length - 86) + bytecode.substring(bytecode.length - 22);
        },

        retrieveBytecode(address) {
            return new Promise((ok, ko) => web3.eth.getCode(web3.toChecksumAddress(address), (error, data) => error ? ko(error) : ok(data)));
        },

        compile(source) {
            var _this = this;
            return new Promise(async function(ok, ko) {
                try {
                    var metadata = JSON.parse(source.split('\n')[0].trim().substring(2));
                    var reformatted = _this.reformatMetadata(metadata, source);
                    var input = reformatted.input;
                    var fileName = reformatted.fileName;
                    var contractName = reformatted.contractName; 
                    var solcjs = await new Promise(function(resolve) {
                        ScriptLoader.load({
                            scripts: [
                                'https://ethereum.github.io/solc-bin/bin/soljson-v' + metadata['compiler']['version'] + '.js'
                            ],
                            callback() {
                                resolve(solcWrapper(window.Module));
                            }
                        });
                    });
                    var output = JSON.parse(solcjs.compile(JSON.stringify(input)));
                    return ok('0x' + output['contracts'][fileName][contractName]['evm']['deployedBytecode']['object']);
                } catch(e) {
                    return ko(e);
                }
            });
        },

        compare(addr, sourceFile) {
            var _this = this;
            return new Promise(async function(ok, ko) {
                try {
                    return ok(_this.cleanBytecode(await _this.retrieveBytecode(addr)) === _this.cleanBytecode(await _this.compile(sourceFile)));
                } catch(e) {
                    return ko(e);
                }
            });
        }
    };
}();