var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.dTree = factory();
})(this, function () {
  'use strict';

  var TreeBuilder = (function () {
    function TreeBuilder(root, siblings, opts) {
      _classCallCheck(this, TreeBuilder);

      TreeBuilder.DEBUG_LEVEL = opts.debug ? 1 : 0;

      this.root = root;
      this.siblings = siblings;
      this.opts = opts;

      // flatten nodes
      this.allNodes = this._flatten(this.root);

      // Calculate node size
      var visibleNodes = _.filter(this.allNodes, function (n) {
        return !n.hidden;
      });
      this.nodeSize = opts.callbacks.nodeSize(visibleNodes, opts.nodeWidth, opts.callbacks.textRenderer);
    }

    _createClass(TreeBuilder, [{
      key: 'create',
      value: function create() {

        var opts = this.opts;
        var allNodes = this.allNodes;
        var nodeSize = this.nodeSize;

        var width = opts.width + opts.margin.left + opts.margin.right;
        var height = opts.height + opts.margin.top + opts.margin.bottom;

        var zoom = d3.behavior.zoom().scaleExtent([0.1, 10]).on('zoom', _.bind(function () {
          svg.attr('transform', 'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');
        }, this));

        //make an SVG
        var svg = this.svg = d3.select(opts.target).append('svg').attr('width', width).attr('height', height).call(zoom).append('g').attr('transform', 'translate(' + width / 2 + ',' + opts.margin.top + ')');

        zoom.translate([width / 2, opts.margin.top]);

        // Compute the layout.
        this.tree = d3.layout.tree().nodeSize([nodeSize[0] * 2, nodeSize[1] * 2.5]);

        this.tree.separation(function separation(a, b) {
          if (a.hidden || b.hidden) {
            return 0.3;
          } else {
            return 0.6;
          }
        });

        this._update(this.root);
      }
    }, {
      key: '_update',
      value: function _update(source) {

        var opts = this.opts;
        var allNodes = this.allNodes;
        var nodeSize = this.nodeSize;

        var nodes = this.tree.nodes(source);

        var links = this.tree.links(nodes);

        // Create the link lines.
        this.svg.selectAll('.link').data(links).enter().append('path').attr('class', opts.styles.linage).attr('d', this._elbow);

        var nodes = this.svg.selectAll('.node').data(nodes).enter();

        this._linkSiblings();

        // Draw siblings (marriage)
        this.svg.selectAll('.sibling').data(this.siblings).enter().append('path').attr('class', opts.styles.marriage).attr('d', _.bind(this._siblingLine, this));

        // Create the node rectangles.
        nodes.append('foreignObject').filter(function (d) {
          return d.hidden ? false : true;
        }).attr('x', function (d) {
          return d.x - d.cWidth / 2 + 'px';
        }).attr('y', function (d) {
          return d.y - d.cHeight / 2 + 'px';
        }).attr('width', function (d) {
          return d.cWidth + 'px';
        }).attr('height', function (d) {
          return d.cHeight + 'px';
        }).attr('id', function (d) {
          return d.id;
        }).html(function (d) {
          return opts.callbacks.nodeRenderer(d.name, d.x, d.y, nodeSize[0], nodeSize[1], d.extra, d.id, d['class'], d.textClass, opts.callbacks.textRenderer);
        }).on('click', function (d) {
          if (d.hidden) {
            return;
          }
          opts.callbacks.nodeClick(d.name, d.extra, d.id);
        });
      }
    }, {
      key: '_flatten',
      value: function _flatten(root) {
        var n = [];
        var i = 0;

        function recurse(node) {
          if (node.children) {
            node.children.forEach(recurse);
          }
          if (!node.id) {
            node.id = ++i;
          }
          n.push(node);
        }
        recurse(root);
        return n;
      }
    }, {
      key: '_elbow',
      value: function _elbow(d, i) {
        if (d.target.noParent) {
          return 'M0,0L0,0';
        }
        var ny = d.target.y + (d.source.y - d.target.y) * 0.50;

        var linedata = [{
          x: d.target.x,
          y: d.target.y
        }, {
          x: d.target.x,
          y: ny
        }, {
          x: d.source.x,
          y: d.source.y
        }];

        var fun = d3.svg.line().x(function (d) {
          return d.x;
        }).y(function (d) {
          return d.y;
        }).interpolate('step-after');
        return fun(linedata);
      }
    }, {
      key: '_linkSiblings',
      value: function _linkSiblings() {

        var allNodes = this.allNodes;

        _.forEach(this.siblings, function (d) {
          var start = allNodes.filter(function (v) {
            return d.source.id == v.id;
          });
          var end = allNodes.filter(function (v) {
            return d.target.id == v.id;
          });
          d.source.x = start[0].x;
          d.source.y = start[0].y;
          d.target.x = end[0].x;
          d.target.y = end[0].y;
        });
      }
    }, {
      key: '_siblingLine',
      value: function _siblingLine(d, i) {

        var ny = d.target.y + (d.source.y - d.target.y) * 0.50;
        var nodeWidth = this.nodeSize[0];
        var nodeHeight = this.nodeSize[1];

        // Not first marriage
        if (d.number > 0) {
          ny -= nodeHeight * 8 / 10;
        }

        var linedata = [{
          x: d.source.x,
          y: d.source.y
        }, {
          x: d.source.x + nodeWidth * 6 / 10,
          y: d.source.y
        }, {
          x: d.source.x + nodeWidth * 6 / 10,
          y: ny
        }, {
          x: d.target.x - nodeWidth * 6 / 10,
          y: ny
        }, {
          x: d.target.x - nodeWidth * 6 / 10,
          y: d.target.y
        }, {
          x: d.target.x,
          y: d.target.y
        }];

        var fun = d3.svg.line().x(function (d) {
          return d.x;
        }).y(function (d) {
          return d.y;
        }).interpolate('linear');
        return fun(linedata);
      }
    }], [{
      key: '_nodeSize',
      value: function _nodeSize(nodes, width, textRenderer) {
        var maxWidth = 0;
        var maxHeight = 0;
        var tmpSvg = document.createElement('svg');
        document.body.appendChild(tmpSvg);

        _.map(nodes, function (n) {
          var container = document.createElement('div');
          container.setAttribute('class', n['class']);
          container.style.visibility = 'hidden';
          container.style.maxWidth = width + 'px';

          var text = textRenderer(n.name, n.extra, n.textClass);
          container.innerHTML = text;

          tmpSvg.appendChild(container);
          var height = container.offsetHeight;
          tmpSvg.removeChild(container);

          maxHeight = Math.max(maxHeight, height);
          n.cHeight = height;
          n.cWidth = width;
        });
        document.body.removeChild(tmpSvg);

        return [width, maxHeight];
      }
    }, {
      key: '_nodeRenderer',
      value: function _nodeRenderer(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
        var node = '';
        node += '<div ';
        node += 'style="height:100%;width:100%;" ';
        node += 'class="' + nodeClass + '" ';
        node += 'id="node' + id + '">\n';
        node += textRenderer(name, extra, textClass);
        node += '</div>';
        return node;
      }
    }, {
      key: '_textRenderer',
      value: function _textRenderer(name, extra, textClass) {
        var node = '';
        node += '<p ';
        node += 'align="center" ';
        node += 'class="' + textClass + '">\n';
        node += name;
        node += '</p>\n';
        return node;
      }
    }, {
      key: '_debug',
      value: function _debug(msg) {
        if (TreeBuilder.DEBUG_LEVEL > 0) {
          console.log(msg);
        }
      }
    }]);

    return TreeBuilder;
  })();

  var dTree = {

    VERSION: '1.3.1',

    init: function init(data) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var opts = _.defaultsDeep(options || {}, {
        target: '#graph',
        debug: false,
        width: 600,
        height: 600,
        callbacks: {
          nodeClick: function nodeClick(name, extra, id) {},
          nodeRenderer: function nodeRenderer(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
            return TreeBuilder._nodeRenderer(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer);
          },
          nodeSize: function nodeSize(nodes, width, textRenderer) {
            return TreeBuilder._nodeSize(nodes, width, textRenderer);
          },
          nodeSorter: function nodeSorter(aName, aExtra, bName, bExtra) {
            return 0;
          },
          textRenderer: function textRenderer(name, extra, textClass) {
            return TreeBuilder._textRenderer(name, extra, textClass);
          }
        },
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        nodeWidth: 100,
        styles: {
          node: 'node',
          linage: 'linage',
          marriage: 'marriage',
          text: 'nodeText'
        }
      });

      var data = this._preprocess(data, opts);
      var treeBuilder = new TreeBuilder(data.root, data.siblings, opts);
      treeBuilder.create();
    },

    _preprocess: function _preprocess(data, opts) {

      var siblings = [];
      var id = 0;

      var root = {
        name: '',
        id: id++,
        hidden: true,
        children: []
      };

      var reconstructTree = function reconstructTree(person, parent) {

        // convert to person to d3 node
        var node = {
          name: person.name,
          id: id++,
          hidden: false,
          children: [],
          extra: person.extra,
          textClass: person.textClass ? person.textClass : opts.styles.text,
          'class': person['class'] ? person['class'] : opts.styles.node
        };

        // hide linages to the hidden root node
        if (parent == root) {
          node.noParent = true;
        }

        // apply depth offset
        for (var i = 0; i < person.depthOffset; i++) {
          var pushNode = {
            name: '',
            id: id++,
            hidden: true,
            children: [],
            noParent: node.noParent
          };
          parent.children.push(pushNode);
          parent = pushNode;
        }

        // sort children
        dTree._sortPersons(person.children, opts);

        // add "direct" children
        _.forEach(person.children, function (child) {
          reconstructTree(child, node);
        });

        parent.children.push(node);

        // DEPRECATED: Backwards-compatability for v1.x syntax, remove for 2.0
        if (person.marriage) {
          console.log('DEPRECATED: The data attribute "marriage" is deprecated in favor of "marriages" that takes an array. It will be removed in 2.0.');
          person.marriages = [person.marriage];
        }

        //sort marriages
        dTree._sortMarriages(person.marriages, opts);

        // go through marriage
        _.forEach(person.marriages, function (marriage, index) {

          var m = {
            name: '',
            id: id++,
            hidden: true,
            noParent: true,
            children: [],
            extra: marriage.extra
          };

          var sp = marriage.spouse;

          var spouse = {
            name: sp.name,
            id: id++,
            hidden: false,
            noParent: true,
            children: [],
            textClass: sp.textClass ? sp.textClass : opts.styles.text,
            'class': sp['class'] ? sp['class'] : opts.styles.node,
            extra: sp.extra
          };

          parent.children.push(m, spouse);

          dTree._sortPersons(marriage.children, opts);
          _.forEach(marriage.children, function (child) {
            reconstructTree(child, m);
          });

          siblings.push({
            source: {
              id: node.id
            },
            target: {
              id: spouse.id
            },
            number: index
          });
        });
      };

      _.forEach(data, function (person) {
        reconstructTree(person, root);
      });

      return {
        root: root,
        siblings: siblings
      };
    },

    _sortPersons: function _sortPersons(persons, opts) {
      if (persons != undefined) {
        persons.sort(function (a, b) {
          return opts.callbacks.nodeSorter(a.name, a.extra, b.name, b.extra);
        });
      }
      return persons;
    },

    _sortMarriages: function _sortMarriages(marriages, opts) {
      if (marriages != undefined && Array.isArray(marriages)) {
        marriages.sort(function (marriageA, marriageB) {
          var a = marriageA.spouse;
          var b = marriageB.spouse;
          return opts.callbacks.nodeSorter(a.name, a.extra, b.name, b.extra);
        });
      }
      return marriages;
    }

  };

  return dTree;
});
//# sourceMappingURL=dTree.js.map
