var SolidityComparator = function() {

    fetch('https://ethereum.github.io/solc-bin/bin/list.json').then(response => response.text()).then(json => window.solidityCompilers = JSON.parse(json));

    return {

        cleanBytecode(bytecode) {
            return bytecode.substring(0, bytecode.length - 86) + bytecode.substring(bytecode.length - 22);
        },

        retrieveBytecode(address) {
            return new Promise((ok, ko) => web3.eth.getCode(web3.toChecksumAddress(address), (error, data) => error ? ko(error) : ok(data)));
        },

        getSolcVersion(bytecode) {
            var version = bytecode.substring(bytecode.length - 10, bytecode.length - 4);
            var first = version.substring(0, 2);
            var second = version.substring(2, 4);
            var third = version.substring(4);
            first = window.web3.toDecimal("0x" + first);
            second = window.web3.toDecimal("0x" + second);
            third = window.web3.toDecimal("0x" + third);
            return window.solidityCompilers.releases[first + "." + second + "." + third];
        },

        async compile(source, compilerVersion) {
            var input = {
                language: 'Solidity',
                sources: {
                    'Code.sol': {
                        content: source
                    }
                },
                settings: {
                    outputSelection: {
                        '*': {
                            '*': ['evm.deployedBytecode']
                        }
                    }
                }
            };
            var solcjs = await new Promise(function(resolve) {
                ScriptLoader.load({
                    scripts: [
                        'https://ethereum.github.io/solc-bin/bin/' + compilerVersion
                    ],
                    callback() {
                        resolve(solcWrapper(window.Module));
                    }
                });
            });
            var output = JSON.parse(solcjs.compile(JSON.stringify(input))).contracts['Code.sol'];
            var bytecodes = {};
            Object.keys(output).map(key => bytecodes[key] = '0x' + output[key].evm.deployedBytecode.object);
            return bytecodes;
        },

        compareBytecodes(retrievedBytecode, compiledBytecodes) {
            retrievedBytecode = this.cleanBytecode(retrievedBytecode);
            var keys = Object.keys(compiledBytecodes);
            for(var i in keys) {
                var key = keys[i];
                if(retrievedBytecode === this.cleanBytecode(compiledBytecodes[key])) {
                    return key;
                }
            }
            return undefined;
        },

        async compare(addr, sourceFile) {
            var addrBytecode = await this.retrieveBytecode(addr);
            var solcVersion = this.getSolcVersion(addrBytecode);
            return this.compareBytecodes(addrBytecode, await this.compile(sourceFile, solcVersion)) !== undefined;
        }
    };
}();