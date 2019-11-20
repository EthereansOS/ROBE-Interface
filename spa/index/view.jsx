var Index = React.createClass({
    requiredModules: [
        'spa/sidebar',
        'spa/editor'
    ],
    render() {
        return (
            <div>
                <div>
                    <div>
                        <div>
                            <Sidebar/>
                        </div>
                        <div>
                            <Editor/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});