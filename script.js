var _onPaste_StripFormatting_IEPaste = false;

function OnPaste_StripFormatting(elem, e) {

    if (e.originalEvent && e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData) {
        e.preventDefault();
        var text = e.originalEvent.originalEvent.clipboardData.getData('text/plain');
        window.document.execCommand('insertText', false, text);
    }
    else if (e.clipboardData && e.clipboardData.getData) {
        e.preventDefault();
        var text = e.clipboardData.getData('text/plain');
        window.document.execCommand('insertText', false, text);
    }
    else if (window.clipboardData && window.clipboardData.getData) {
        // Stop stack overflow
        if (!_onPaste_StripFormatting_IEPaste) {
            _onPaste_StripFormatting_IEPaste = true;
            e.preventDefault();
            window.document.execCommand('ms-pasteTextOnly', false);
        }
        _onPaste_StripFormatting_IEPaste = false;
    }

};

var ContentEditable = React.createClass({
    render: function () {
        return <div
            onInput={this.emitChange}
            onBlur={this.emitChange}
            onPaste={function(event){OnPaste_StripFormatting(this, event);}}
            contentEditable
            dangerouslySetInnerHTML={{__html: this.props.html}}></div>;
    },

    shouldComponentUpdate: function (nextProps) {
        return nextProps.html !== this.getDOMNode().innerHTML;
    },

    componentDidUpdate: function () {
        if (this.props.html !== this.getDOMNode().innerHTML) {
            this.getDOMNode().innerHTML = this.props.html;
        }
    },

    emitChange: function () {
        var html = this.getDOMNode().innerHTML;
        if (this.props.onChange && html !== this.lastHtml) {
            this.props.onChange({
                target: {
                    value: html
                }
            });
        }
        this.lastHtml = html;
    }
});

Array.prototype.getUnique = function(){
    var u = {}, a = [];
    for(var i = 0, l = this.length; i < l; ++i){
        if(u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a;
}


var Editor = React.createClass({
    getInitialState: function() {
        return {text: ''};
    },
    render: function () {
        return <textarea onChange={this.handleChange} rows="50" value={this.state.text}></textarea>;
    },
    handleChange: function(e) {
        this.setState({text: e.target.value});

        var lines = e.target.value.split('\n').map(function(line){
            var normalised = line.toLowerCase();
            var normalised = normalised.replace(/[.,-\/#!\$%\^&\*;:{}=\-_`~()]/g," ");

            var words = normalised.match(/([^ ]+)/gi);
            if(!words) {
                words = []
            }
            //console.log(words);
            var uniqueWords = words.getUnique();
            return {
                text: line,
                unique: uniqueWords.length,
                total: words.length
            }
        });



        ReactDOM.render(
            <Lines lines={lines}/>,
            document.getElementById('content')
        );
    }
});

var Line = React.createClass({
    render: function () {
        var k = this.props.unique / this.props.total;
        if(!k) {
            k = '';
        } else {
            k = k.toFixed(2);
        }


        return (
            <tr>
            <td>{this.props.text}</td>
            <td>{this.props.unique}</td>
            <td>{this.props.total}</td>
            <td>{k}</td>
        </tr>
        );
    },
});

function selectElementContents(el) {
    var body = document.body, range, sel;
    if (document.createRange && window.getSelection) {
        range = document.createRange();
        sel = window.getSelection();
        sel.removeAllRanges();
        try {
            range.selectNodeContents(el);
            sel.addRange(range);
        } catch (e) {
            range.selectNode(el);
            sel.addRange(range);
        }
    } else if (body.createTextRange) {
        range = body.createTextRange();
        range.moveToElementText(el);
        range.select();
    }
}

var Lines = React.createClass({
    render: function () {
        var lineNodes = this.props.lines.map(function(line, i) {
            return (
                <Line key={i} text={line.text} unique={line.unique} total={line.total} />
            );
        });
        return (
            <table onClick={function(e){
                    selectElementContents(document.getElementById('content'));
                    try {
                        var successful = document.execCommand('copy');
                        var msg = successful ? 'successful' : 'unsuccessful';
                        console.log('Copying text command was ' + msg);
                      } catch (err) {
                        console.log('Oops, unable to copy');
                      }
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                }}>
                <thead>
                <tr>
                    <th>Text</th>
                    <th>Uni</th>
                    <th>Tot</th>
                    <th>K</th>
                </tr>
                </thead>
                <tbody>
                {lineNodes}
                </tbody>
            </table>
        );
    },
    handleChange: function(e) {
        this.setState({text: e.target.value});
    }
});

function onChange(e){

}

ReactDOM.render(
    <Editor />,
    document.getElementById('editor')
);
