var Editor = React.createClass({
    requiredScripts: [
        "assets/plugins/monaco-editor/min/vs/editor/editor.main.css",
        "assets/plugins/monaco-editor/min/vs/loader.js",
        "assets/plugins/monaco-editor/min/vs/editor/editor.main.nls.js",
        "assets/plugins/monaco-editor/min/vs/editor/editor.main.js"
    ],
    deploy(e) {
        e && e.preventDefault(true) && e.stopPropagation(true);
        var code = this.editor.getValue();
        this.emit('code', code, this.editor.getModel()._languageIdentifier.language);
    },
    getDefaultSubscriptions() {
        return {
            'editor/show' : this.setEditorContent
        }
    },
    setEditorContent(code, title) {
        this.editor.setValue(code);
    },
    createEditor(ref) {
        ref && (this.editor = monaco.editor.create(ref, {
            language: 'sol',
            readOnly: 'true',
            theme: 'vs-dark',
        }));
    },
    render() {
        return (
            <div>
                <div className="editor" ref={this.createEditor}>
                </div>
                <div>
                    <button onClick={this.deploy}>Deploy</button>
                </div>
            </div>
        );
    }
});