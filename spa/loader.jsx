var Loader = React.createClass({
    getDefaultSubscriptions() {
        return {
            'loader/toggle' : this.onToggle
        };
    },
    onToggle(visible) {
        this.setState({visible: (visible === true || visible === false) ? visible : this.state && this.state.visible ? !this.state.visible : true});
    },
    render() {
        return(
            <div className="MainLoader" style={{"display" : this.state && this.state.visible ? "block" : "none"}}>
                <figure>
                <img src="./assets/img/RobeLoader.gif" />
                </figure>
            </div>
        );
    }
});