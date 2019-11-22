var Index = React.createClass({
    requiredScripts: [
        "spa/loader.jsx",
        "spa/messages.jsx"
    ],
    onChange(e) {
        e && e.preventDefault(true) && e.stopPropagation(e);
        var file = e.target.files[0];
        var _this = this;
        this.setState({ fileName: null, pieces: null }, function () {
            var extension;
            try {
                extension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase();
            } catch (e) {
            }
            if (!extension) {
                return alert("Cannot retrieve file extension");
            }

            var mimeType;
            try {
                mimeType = window.context.supportedFileExtensions[extension];
            } catch (e) {

            }
            if (!mimeType) {
                return alert("Unsupported file extension (." + extension + ")");
            }
            _this.emit('loader/toggle');
            var reader = new FileReader();
            reader.addEventListener("load", function () {
                var result = reader.result;
                result = "data:" + mimeType + result.substring(result.indexOf(";"));
                var split = _this.controller.split(result);
                _this.setState({ fileName: file.name, pieces: split }, function () {
                    _this.emit('loader/toggle', false);
                });
            }, false);
            reader.readAsDataURL(file);
        });
    },
    upload(e) {
        e && e.preventDefault(true) && e.stopPropagation(true);
        if (!this.state || !this.state.pieces || !this.state.pieces.length || this.state.pieces.length === 0) {
            return;
        }
        this.emit('loader/toggle');
        var _this = this;
        this.controller.mint(window.context.defaultRobeTokenAddress, this.state.pieces).then(rootTokenId => {
            _this.rootTokenId.value = rootTokenId.toString();
            this.emit('loader/toggle', false);
        }).catch(e => _this.emit('message', e.message || e, "error"));
    },
    load(e) {
        e && e.preventDefault(true) && e.stopPropagation(true);
        var type = e.target.innerHTML;
        var rootTokenId;
        try {
            rootTokenId = parseInt(this.rootTokenId.value);
        } catch (e) {
        }
        if (isNaN(rootTokenId)) {
            return alert("You must specify a rootTokenId First");
        }
        this.emit('loader/toggle');
        this.emit("message", "Loading Content...", "info");
        var _this = this;
        this.controller.load(window.context.defaultRobeTokenAddress, rootTokenId).then(code => {
            _this.emit("message", "Performing " + type + "...", "info");
            return _this.controller['on' + type](code);
        }).catch(e => _this.emit("message", e.message || e, "error"))
    },
    render() {
        var accept = "." + Object.keys(window.context.supportedFileExtensions).join(', .');
        return ([
            <Loader />,
            <Messages />,
            <article className="Main">
                <section className="MainAll">
                    <section className="MainTitle">
                        <img src="./assets/img/ROBE.gif" />
                        <h1>ROBE</h1>
                        <h4>An ERC-721 Improvement to Decentralize stuff</h4>
                    </section>
                </section>
                <section className="MainInsert">
                    <h5>With ROBE you can <span className="WOOW1">decentralize every file</span> like code (HTML, JS, SVG...) or even images, documents, and more...<span className="WOOW2">by storing it on-chain</span> in a <span className="WOOW3"> series of chained NFTs </span> and use it for your app or Dapp just download it when you need directly from the Ethereum chain</h5>
                    <section className="MainActions">
                        <section className="MainActionsDe">
                            <h6>Decentralize Your File</h6>
                            <input type="file" onChange={this.onChange} accept={accept}></input>
                            <button onClick={this.upload} disabled={!this.state || !this.state.pieces || !this.state.pieces.length || this.state.pieces.length === 0}>Decentralize {this.state && this.state.pieces && (" (" + this.state.pieces.length + " Txs)")}</button>
                            <p>File supported in this demo:<br />{accept}</p>
                        </section>
                        <section className="MainActionsLo">
                            <h6>Load an Existing File</h6>
                            <input type="number" placeholder="NFT ID" min="0" ref={ref => this.rootTokenId = ref}></input>
                            <section className="LoadedFile">
                                <button onClick={this.load}>Download</button>
                            </section>
                        </section>
                    </section>
                </section>
                <section className="MainDesc">
                    <p>ROBE is an Open-Source protocoll to use ERC-721 (Non-Fungible Tokens) in a smart way to decentralize things like coding files, SVG based image, Text and more...</p>
                    <p>This new standard is designed to improve the modern Dapps Decentralization, by revoming as much needs as we can the usage of Centralized Servers or IPFS for the front-end part and even for some coded files.</p>
                    <p>this protocoll allows developer to create chained NFTs for every code page or SVG based Image they needs. Once published in the Blockchain, developers can call the code, decoded it using our decoder published on IPFS (Hoping to be introduced in Metamask or in some browser in the future) and use it for their Dapps or Apps</p>
                    <p>The most exiting things about this protocoll is to start thinking about the Front-End as a future DAOs based decision, by the community and not by a well-known organization. In fact this protocoll can adress a big point of failure in Dapps today, the possibility to shut down a Dapp by shutting down his centralized parts (DNS, Front-End). We hope to see a future of Dapps powered by ROBE and ENS to be totally unstoppable.</p>
                    <p>ROBE is a base layer in our DFO Standard, a Flexible Standard to build DAO without the needs of a well known organization, more at https://dfohub.com</p>
                </section>
            </article>
        ]);
    }
});