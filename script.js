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
            var normalised = line.toLowerCase().replace(/[.,-\/#!\$%\^&\*;:{}=\-_`~()]/g," ");

            var re = /([^ ]+)/gi;

            var words = [];
            var match = null;
            while (match=re.exec(normalised)) {
                var start = match.index,
                    end = match.index + match[0].length;
                words.push({
                    value: normalised.slice(start, end),
                    start: start,
                    end: end
                });
            }

            if(!words) {
                words = []
            }
            var unique = words.map(function(val){ return val.value; }).getUnique();

            var unique_counts = unique.map(function(v1){
                return [v1, words.filter(function(v2){ return v2.value == v1; }).sort(function(a,b){ return a.start - b.start; })]
            });

            console.log(unique_counts);

            return {
                text: line,
                unique: unique_counts,
                total: words
            }
        });



        ReactDOM.render(
            <Lines lines={lines}/>,
            document.getElementById('content')
        );
    }
});

var Line = React.createClass({
    renderText: function(text, unique) {
        var unique = unique.filter(function(v){return v[1].length > 1;});

        var p = 0;

        var unique_len = unique.map(function(v) {
            return v[1].map(function(v2){
                return [v[1].length, v2]
            });
        });
        unique_len = unique_len.reduce(function(a,b){ return [].concat(a, b); }, []);
        unique_len.sort(function(a,b){
            return a[1].start - b[1].start;
        }).map(function(v){
            var v_l = v[0],
                v2 = v[1];

            var classes = 'coloured coloured-' +v_l;
            if (v_l > 5) {
                classes += ' coloured-lot';
            }
            var text_new = text.substring(0, v2.start + p) + '<span class="' + classes + '">' +  text.substring(v2.start + p, v2.end + p) + "</span>" + text.substring(v2.end + p);
            p += text_new.length - text.length;
            text = text_new;
        });



        return text;
    },
    render: function () {
        var k = this.props.unique.length / this.props.total.length;
        if(!k) {
            k = '';
        } else {
            k = k.toFixed(2);
        }


        return (
            <tr>
            <td dangerouslySetInnerHTML={{__html: this.renderText(this.props.text, this.props.unique)}} />
            <td>{this.props.unique.length}</td>
            <td>{this.props.total.length}</td>
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
            <table>
                <thead>
                <tr>
                    <th>Text <button onClick={function(e){
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
                }}>Copy</button></th>
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
