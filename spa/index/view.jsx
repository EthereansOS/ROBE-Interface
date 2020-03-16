var Index = React.createClass({
    getInitialState() {
        return {
            singleTokenLength: window.context.singleTokenLength
        };
    },
    requiredScripts: [
        "assets/plugins/monaco.editor/monaco.editor.min.js",
        "spa/loader.jsx",
        "spa/messages.jsx"
    ],
    onFileSelection(e) {
        e && e.preventDefault && e.preventDefault(true) && e.stopPropagation && e.stopPropagation(e);
        var file = e.currentTarget.files[0];
        var _this = this;
        this.setState({ fileName: null, chunks: null }, function () {
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
            _this.emit('loader/toggle', true);
            var reader = new FileReader();
            reader.addEventListener("load", function () {
                var result = reader.result;
                result = "data:" + mimeType + result.substring(result.indexOf(";"));
                _this.setState({ fileName: file.name, code: result, chunks: _this.controller.split(result, _this.state.singleTokenLength) }, function () {
                    _this.emit('loader/toggle', false);
                });
            }, false);
            reader.readAsDataURL(file);
        });
    },
    mint(e) {
        e && e.preventDefault && e.preventDefault(true) && e.stopPropagation && e.stopPropagation(true);
        if (!this.state || !this.state.chunks || !this.state.chunks.length || this.state.chunks.length === 0) {
            return;
        }
        this.emit('loader/toggle');
        var _this = this;
        _this.controller.mint(this.state.chunks, _this.state.tokenContinue, _this.state.tokenContinue !== undefined && _this.state.tokenContinue !== null && _this.state.metadata[0] || undefined).then(tokenId => {
            _this.tokenId.value = tokenId.toString();
            _this.emit('loader/toggle', false);
            _this.emit('message', "Your Robe Token has been successfully minted!", 'success');
        }).catch(e => _this.emit('message', e.message || e, "error"));
    },
    load(e) {
        e && e.preventDefault && e.preventDefault && e.preventDefault(true) && e.stopPropagation && e.stopPropagation(true);
        var type = (e.currentTarget && e.currentTarget.innerHTML) || e;
        var tokenId;
        try {
            tokenId = parseInt(this.tokenId.value);
        } catch (e) {
        }
        if (isNaN(tokenId)) {
            return alert("You must specify a tokenId First");
        }
        this.emit('loader/toggle');
        this.emit("message", "Loading Content...", "info");
        var _this = this;
        _this.controller.loadContent(tokenId).then(code => {
            _this.emit("message", "Performing " + type + "...", "info");
            return _this.controller['on' + type](code, tokenId);
        }).catch(e => _this.emit("message", e.message || e, "error"))
    },
    onSingleTokenLength(e) {
        e && e.preventDefault && e.preventDefault(true) && e.stopPropagation && e.stopPropagation(true);
        var singleTokenLength = parseInt(e.currentTarget.value) || window.context.singleTokenLength;
        this.singleTokenLengthTimeout && clearTimeout(this.singleTokenLengthTimeout);
        var _this = this;
        this.singleTokenLengthTimeout = setTimeout(function () {
            _this.setState({ singleTokenLength, chunks: (_this.state && _this.state.code && _this.controller.split(_this.state.code, singleTokenLength)) });
        }, 900);
    },
    onTokenContinue(e) {
        e && e.preventDefault && e.preventDefault(true) && e.stopPropagation && e.stopPropagation(true);
        var tokenContinue = parseInt(e.currentTarget.value);
        this.tokenContinueTimeout && clearTimeout(this.tokenContinueTimeout);
        var _this = this;
        this.tokenContinueTimeout = setTimeout(function () {
            if (isNaN(tokenContinue)) {
                return _this.setState({ tokenContinue: null, metadata: null });
            }
            _this.emit('message', 'Loading token metadata...', 'info');
            tokenContinue >= 0 && _this.controller.loadContentMetadata(tokenContinue).then(metadata => {
                var singleTokenLength = !metadata[2] ? metadata[1] : _this.state && _this.state.singleTokenLength;
                _this.setState({ singleTokenLength, tokenContinue, metadata, chunks: (_this.state && _this.state.code && _this.controller.split(_this.state.code, singleTokenLength)) }, function () {
                    _this.emit('message', '', 'info');
                    return metadata[2] && _this.emit('message', 'This token has been already finalized', 'error');
                });
            });
        }, 900);
    },
    componentDidMount() {
        var tokenId = "";
        try {
            tokenId = parseInt(window.location.search.toLowerCase().split("id=")[1]);
        } catch (e) {
        }
        this.tokenId.value = isNaN(tokenId) ? "" : tokenId.toString();
        if (!isNaN(tokenId)) {
            this.load('View');
        }
    },
    renderTransactionsText() {
        if (!this.state || !this.state.chunks) {
            return "";
        }
        var actualLength = (this.state && this.state.metadata && this.state.metadata[0]) || 0;
        return " (" + (this.state.chunks.length - actualLength) + "Txs)";
    },
    render() {
        var accept = "." + Object.keys(window.context.supportedFileExtensions).join(', .');
        return (
            <article className="Main">
                <Loader />
                <Messages />
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
                            <input type="file" onChange={this.onFileSelection} accept={accept}></input>
                            <button onClick={this.mint} disabled={!this.state || !this.state.chunks || !this.state.chunks.length || this.state.chunks.length === 0}>Decentralize {this.renderTransactionsText()}</button>
                            <p>Single Token Length</p>
                            <input type="number" min="3" ref={ref => ref && (ref.value = (this.state & this.state.singleTokenLength >= 3 ? this.state.singleTokenLength : "") || window.context.singleTokenLength)} onChange={this.onSingleTokenLength} disabled={this.state && this.state.tokenContinue !== undefined && this.state.tokenContinue !== null && this.state.tokenContinue >= 0} />
                            <p>File types supported:<br />{accept}</p>
                            <p>Continue for token</p>
                            <input type="number" min="0" ref={ref => ref && (ref.value = this.state && this.state.tokenContinue >= 0 ? this.state.tokenContinue : "")} onChange={this.onTokenContinue} />
                        </section>
                        <section className="MainActionsLo">
                            <h6>Load an Existing File</h6>
                            <input type="number" placeholder="NFT ID" min="0" ref={ref => this.tokenId = ref}></input>
                            <section className="LoadedFile">
                                <button onClick={this.load}>View</button>
                                <button onClick={this.load}>Download</button>
                            </section>
                        </section>
                    </section>
                </section>
                {this.state && this.state.content && <section className="MainEditor">
                    <div className="EditorView" ref={ref => this.viewerContent = ref}></div>
                </section>}
                <section className="MainDesc">
                    <p>ROBE is an Open-Source protocol to use ERC-721 (Non-Fungible Tokens) in a smart way, to decentralize things like coding files, images, Text and more...</p>
                    <p>This new standard is designed to improve the modern Dapps Decentralization, by revoming the the usage of Centralized Servers or IPFS for the front-end part and even for some files.</p>
                    <p>This protocol allows developers to create chained NFTs for every code page or files they needs. Once published in the Blockchain, developers can call the code, decoded it using our decoder published on IPFS (Hoping to be introduced in Metamask or in browsers in the future) and use it for their Dapps or Apps.</p>
                    <p>The most exciting things about this protocol is to start thinking about the Front-End as a future DAOs based decision, by the community and not by a well-known organization. In fact this protocol can adress a big point of failure in Dapps today, the possibility to shut down a Dapp by shutting down his centralized parts (DNS, Front-End). We hope to see a future of Dapps powered by ROBE and ENS to be totally unstoppable.</p>
                    <p>ROBE is a base layer in our DFO Standard, a Flexible Standard to build DAO without the needs of a well known organization, more at <a href="https://dfohub.com">https://dfohub.com</a></p>
                </section>
            </article>
        );
    }
});