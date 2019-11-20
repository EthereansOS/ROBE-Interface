var remixFunctionalities = {
    showCode(event, arg) {
        window.remix.call('fileManager', 'setFile', 'browser/RobeCode.sol', arg);
    }
};

ScriptLoader.load({
    scripts: [window.location.protocol + '//unpkg.com/@remixproject/plugin'],
    callback: async function() {
        try {
            window.remix = remixPlugin.createIframeClient();
            await remix.onload();
            remix.on('solidity', 'compilationFinished', function() {
                $.publish('solidity/compiled', arguments);
            });
            $.subscribe('editor/show', remixFunctionalities.showCode);
        } catch (e) {
            console.error(e);
            alert(e.message || e);
        }
    }
});