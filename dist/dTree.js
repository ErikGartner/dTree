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

      // calculate node sizes
      this.nodeSize = opts.callbacks.nodeSize.call(this,
      // filter hidden and marriage nodes
      _.filter(this.allNodes, function (node) {
        return !(node.hidden || _.get(node, 'data.isMarriage'));
      }), opts.nodeWidth, opts.callbacks.textRenderer);
      this.marriageSize = opts.callbacks.marriageSize.call(this,
      // filter hidden and non marriage nodes
      _.filter(this.allNodes, function (node) {
        return !node.hidden && _.get(node, 'data.isMarriage');
      }), this.opts.marriageNodeSize);
    }

    _createClass(TreeBuilder, [{
      key: 'create',
      value: function create() {

        var opts = this.opts;
        var allNodes = this.allNodes;
        var nodeSize = this.nodeSize;

        var width = opts.width + opts.margin.left + opts.margin.right;
        var height = opts.height + opts.margin.top + opts.margin.bottom;

        // create zoom handler
        var zoom = this.zoom = d3.zoom().scaleExtent([0.1, 10]).on('zoom', function () {
          g.attr('transform', d3.event.transform);
        });

        // make a svg
        var svg = this.svg = d3.select(opts.target).append('svg').attr('viewBox', [0, 0, width, height]).call(zoom);

        // create svg group that holds all nodes
        var g = this.g = svg.append('g');

        // set zoom identity
        svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, opts.margin.top).scale(1));

        // Compute the layout.
        this.tree = d3.tree().nodeSize([nodeSize[0] * 2, opts.callbacks.nodeHeightSeperation.call(this, nodeSize[0], nodeSize[1])]);

        this.tree.separation(function separation(a, b) {
          if (a.data.hidden || b.data.hidden) {
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
        var marriageSize = this.marriageSize;

        var treenodes = this.tree(source);
        var links = treenodes.links();

        // Create the link lines.
        this.g.selectAll('.link').data(links).enter()
        // filter links with no parents to prevent empty nodes
        .filter(function (l) {
          return !l.target.data.noParent;
        }).append('path').attr('class', opts.styles.linage).attr('d', this._elbow);

        var nodes = this.g.selectAll('.node').data(treenodes.descendants()).enter();

        this._linkSiblings();

        // Draw siblings (marriage)
        this.g.selectAll('.sibling').data(this.siblings).enter().append('path').attr('class', opts.styles.marriage).attr('d', _.bind(this._siblingLine, this));

        // Create the node rectangles.
        nodes.append('foreignObject').filter(function (d) {
          return d.data.hidden ? false : true;
        }).attr('x', function (d) {
          return Math.round(d.x - d.cWidth / 2) + 'px';
        }).attr('y', function (d) {
          return Math.round(d.y - d.cHeight / 2) + 'px';
        }).attr('width', function (d) {
          return d.cWidth + 'px';
        }).attr('height', function (d) {
          return d.cHeight + 'px';
        }).attr('id', function (d) {
          return d.id;
        }).html(function (d) {
          if (d.data.isMarriage) {
            return opts.callbacks.marriageRenderer.call(this, d.x, d.y, marriageSize[0], marriageSize[1], d.data.extra, d.data.id, d.data['class']);
          } else {
            return opts.callbacks.nodeRenderer.call(this, d.data.name, d.x, d.y, nodeSize[0], nodeSize[1], d.data.extra, d.data.id, d.data['class'], d.data.textClass, opts.callbacks.textRenderer);
          }
        }).on('dblclick', function () {
          // do not propagate a double click on a node
          // to prevent the zoom from being triggered
          d3.event.stopPropagation();
        }).on('click', function (d) {
          // ignore double-clicks and clicks on hidden nodes
          if (d3.event.detail === 2 || d.data.hidden) {
            return;
          }
          if (d.data.isMarriage) {
            opts.callbacks.marriageClick.call(this, d.data.extra, d.data.id);
          } else {
            opts.callbacks.nodeClick.call(this, d.data.name, d.data.extra, d.data.id);
          }
        }).on('contextmenu', function (d) {
          if (d.data.hidden) {
            return;
          }
          d3.event.preventDefault();
          if (d.data.isMarriage) {
            opts.callbacks.marriageRightClick.call(this, d.data.extra, d.data.id);
          } else {
            opts.callbacks.nodeRightClick.call(this, d.data.name, d.data.extra, d.data.id);
          }
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
        if (d.target.data.noParent) {
          return 'M0,0L0,0';
        }
        var ny = Math.round(d.target.y + (d.source.y - d.target.y) * 0.50);

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

        var fun = d3.line().curve(d3.curveStepAfter).x(function (d) {
          return d.x;
        }).y(function (d) {
          return d.y;
        });
        return fun(linedata);
      }
    }, {
      key: '_linkSiblings',
      value: function _linkSiblings() {

        var allNodes = this.allNodes;

        _.forEach(this.siblings, function (d) {
          var start = allNodes.filter(function (v) {
            return d.source.id == v.data.id;
          });
          var end = allNodes.filter(function (v) {
            return d.target.id == v.data.id;
          });
          d.source.x = start[0].x;
          d.source.y = start[0].y;
          d.target.x = end[0].x;
          d.target.y = end[0].y;

          var marriageId = start[0].data.marriageNode != null ? start[0].data.marriageNode.id : end[0].data.marriageNode.id;
          var marriageNode = allNodes.find(function (n) {
            return n.data.id == marriageId;
          });
          d.source.marriageNode = marriageNode;
          d.target.marriageNode = marriageNode;
        });
      }
    }, {
      key: '_siblingLine',
      value: function _siblingLine(d, i) {

        var ny = Math.round(d.target.y + (d.source.y - d.target.y) * 0.50);
        var nodeWidth = this.nodeSize[0];
        var nodeHeight = this.nodeSize[1];

        // Not first marriage
        if (d.number > 0) {
          ny -= Math.round(nodeHeight * 8 / 10);
        }

        var linedata = [{
          x: d.source.x,
          y: d.source.y
        }, {
          x: Math.round(d.source.x + nodeWidth * 6 / 10),
          y: d.source.y
        }, {
          x: Math.round(d.source.x + nodeWidth * 6 / 10),
          y: ny
        }, {
          x: d.target.marriageNode.x,
          y: ny
        }, {
          x: d.target.marriageNode.x,
          y: d.target.y
        }, {
          x: d.target.x,
          y: d.target.y
        }];

        var fun = d3.line().curve(d3.curveStepAfter).x(function (d) {
          return d.x;
        }).y(function (d) {
          return d.y;
        });
        return fun(linedata);
      }
    }], [{
      key: '_nodeHeightSeperation',
      value: function _nodeHeightSeperation(nodeWidth, nodeMaxHeight) {
        return nodeMaxHeight + 25;
      }
    }, {
      key: '_nodeSize',
      value: function _nodeSize(nodes, width, textRenderer) {
        var maxWidth = 0;
        var maxHeight = 0;
        var tmpSvg = document.createElement('svg');
        document.body.appendChild(tmpSvg);

        _.map(nodes, function (n) {
          var container = document.createElement('div');
          container.setAttribute('class', n.data['class']);
          container.style.visibility = 'hidden';
          container.style.maxWidth = width + 'px';

          var text = textRenderer(n.data.name, n.data.extra, n.data.textClass);
          container.innerHTML = text;

          tmpSvg.appendChild(container);
          var height = container.offsetHeight;
          tmpSvg.removeChild(container);

          maxHeight = Math.max(maxHeight, height);
          n.cHeight = height;
          if (n.data.hidden) {
            n.cWidth = 0;
          } else {
            n.cWidth = width;
          }
        });
        document.body.removeChild(tmpSvg);

        return [width, maxHeight];
      }
    }, {
      key: '_marriageSize',
      value: function _marriageSize(nodes, size) {
        _.map(nodes, function (n) {
          if (!n.data.hidden) {
            n.cHeight = size;
            n.cWidth = size;
          }
        });

        return [size, size];
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
      key: '_marriageRenderer',
      value: function _marriageRenderer(x, y, height, width, extra, id, nodeClass) {
        return '<div style="height:100%" class="' + nodeClass + '" id="node' + id + '"></div>';
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

    VERSION: '2.4.1',

    init: function init(data) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var opts = _.defaultsDeep(options || {}, {
        target: '#graph',
        debug: false,
        width: 600,
        height: 600,
        hideMarriageNodes: true,
        callbacks: {
          nodeClick: function nodeClick(name, extra, id) {},
          nodeRightClick: function nodeRightClick(name, extra, id) {},
          marriageClick: function marriageClick(extra, id) {},
          marriageRightClick: function marriageRightClick(extra, id) {},
          nodeHeightSeperation: function nodeHeightSeperation(nodeWidth, nodeMaxHeight) {
            return TreeBuilder._nodeHeightSeperation(nodeWidth, nodeMaxHeight);
          },
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
          },
          marriageRenderer: function marriageRenderer(x, y, height, width, extra, id, nodeClass) {
            return TreeBuilder._marriageRenderer(x, y, height, width, extra, id, nodeClass);
          },
          marriageSize: function marriageSize(nodes, size) {
            return TreeBuilder._marriageSize(nodes, size);
          }
        },
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        },
        nodeWidth: 100,
        marriageNodeSize: 10,
        styles: {
          node: 'node',
          marriageNode: 'marriageNode',
          linage: 'linage',
          marriage: 'marriage',
          text: 'nodeText'
        }
      });

      var data = this._preprocess(data, opts);
      var treeBuilder = new TreeBuilder(data.root, data.siblings, opts);
      treeBuilder.create();

      function _zoomTo(x, y) {
        var zoom = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];
        var duration = arguments.length <= 3 || arguments[3] === undefined ? 500 : arguments[3];

        treeBuilder.svg.transition().duration(duration).call(treeBuilder.zoom.transform, d3.zoomIdentity.translate(opts.width / 2, opts.height / 2).scale(zoom).translate(-x, -y));
      }

      return {
        resetZoom: function resetZoom() {
          var duration = arguments.length <= 0 || arguments[0] === undefined ? 500 : arguments[0];

          treeBuilder.svg.transition().duration(duration).call(treeBuilder.zoom.transform, d3.zoomIdentity.translate(opts.width / 2, opts.margin.top).scale(1));
        },
        zoomTo: _zoomTo,
        zoomToNode: function zoomToNode(nodeId) {
          var zoom = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];
          var duration = arguments.length <= 2 || arguments[2] === undefined ? 500 : arguments[2];

          var node = _.find(treeBuilder.allNodes, { data: { id: nodeId } });
          if (node) {
            _zoomTo(node.x, node.y, zoom, duration);
          }
        },
        zoomToFit: function zoomToFit() {
          var duration = arguments.length <= 0 || arguments[0] === undefined ? 500 : arguments[0];

          var groupBounds = treeBuilder.g.node().getBBox();
          var width = groupBounds.width;
          var height = groupBounds.height;
          var fullWidth = treeBuilder.svg.node().clientWidth;
          var fullHeight = treeBuilder.svg.node().clientHeight;
          var scale = 0.95 / Math.max(width / fullWidth, height / fullHeight);

          treeBuilder.svg.transition().duration(duration).call(treeBuilder.zoom.transform, d3.zoomIdentity.translate(fullWidth / 2 - scale * (groupBounds.x + width / 2), fullHeight / 2 - scale * (groupBounds.y + height / 2)).scale(scale));
        }
      };
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

        //sort marriages
        dTree._sortMarriages(person.marriages, opts);

        // go through marriage
        _.forEach(person.marriages, function (marriage, index) {
          var m = {
            name: '',
            id: id++,
            hidden: opts.hideMarriageNodes,
            noParent: true,
            children: [],
            isMarriage: true,
            extra: marriage.extra,
            'class': marriage['class'] ? marriage['class'] : opts.styles.marriageNode
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
            extra: sp.extra,
            marriageNode: m
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
        root: d3.hierarchy(root),
        siblings: siblings
      };
    },

    _sortPersons: function _sortPersons(persons, opts) {
      if (persons != undefined) {
        persons.sort(function (a, b) {
          return opts.callbacks.nodeSorter.call(this, a.name, a.extra, b.name, b.extra);
        });
      }
      return persons;
    },

    _sortMarriages: function _sortMarriages(marriages, opts) {
      if (marriages != undefined && Array.isArray(marriages)) {
        marriages.sort(function (marriageA, marriageB) {
          var a = marriageA.spouse;
          var b = marriageB.spouse;
          return opts.callbacks.nodeSorter.call(this, a.name, a.extra, b.name, b.extra);
        });
      }
      return marriages;
    }

  };

  return dTree;
});
//# sourceMappingURL=dTree.js.map
