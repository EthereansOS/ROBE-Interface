var Sidebar = React.createClass({
    requiredScripts: [
        'assets/plugins/solc.wrapper.min.js',
        'assets/scripts/solidity.comparator.js'
    ],
    getDefaultSubscriptions() {
        return {
            'solidity/compiled': this.onCompiled,
            'code' : this.controller.onCode
        }
    },
    onCompiled() {
        this.controller.onCompiled.apply(this.controller, arguments);
    },
    deploy(e) {
        e && e.preventDefault(true) && e.stopPropagation(true);
        var address = this.robeAddress.value.trim();
        if (!window.isEthereumAddress(address)) {
            return alert('Please insert a valid ethereum address');
        }
        this.controller.mint(address);
    },
    load(e) {
        e && e.preventDefault(true) && e.stopPropagation(true);
        var address = this.robeAddress.value.trim();
        if (!window.isEthereumAddress(address)) {
            return alert('Please insert a valid ethereum address');
        }
        var rootTokenId = parseInt(this.robeId.value);
        if(isNaN(rootTokenId)) {
            return alert("Insert a valid number!");
        }
        this.controller.load(address, rootTokenId);
    },
    render() {
        return (
            <div>
                <div>
                    <div>
                        <div>
                            {this.state && this.state.name || "You must compile a Contract First"}
                        </div>
                    </div>
                    <div>
                        <div>
                            <label>The Robe Address</label>
                            <br />
                            <input type="text" ref={ref => this.robeAddress = ref} placeholder="Insert valid ethereum address" />
                        </div>
                    </div>
                    <div>
                        <div>
                            <button onClick={this.deploy}>Deploy</button>
                        </div>
                    </div>
                </div>
                <div>
                    <div>
                        <label>The Robe Root Token Id</label>
                        <br />
                        <input type="number" ref={ref => this.robeId = ref} min="0"/>
                    </div>
                </div>
                <div>
                    <div>
                        <button onClick={this.load}>Load</button>
                    </div>
                </div>
            </div>
        );
    }
});