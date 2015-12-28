class TreeBuilder {

  constructor(root, siblings, opts) {
    this.root = root;
    this.siblings = siblings;
    this.opts = opts;

    // flatten nodes
    this.allNodes = this._flatten(this.root);
    this.nodeSize = this._calculateNodeSize();
  }

  create() {

    var opts = this.opts;
    var allNodes = this.allNodes;
    var nodeSize = this.nodeSize;

    var zoom = d3.behavior.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', _.bind(function() {
        svg.attr('transform', 'translate(' + d3.event.translate + ')' +
          ' scale(' + d3.event.scale + ')');
      }, this));

    //make an SVG
    var svg = this.svg = d3.select(opts.target)
      .append('svg')
      .attr('width', opts.width + opts.margin.left + opts.margin.right)
      .attr('height', opts.height + opts.margin.top + opts.margin.bottom)
      .call(zoom)
      .append('g')
      .attr('transform', 'translate(' + opts.margin.left + ',' + opts.margin.top + ')');

    // Compute the layout.
    this.tree = d3.layout.tree()
      .nodeSize(nodeSize);

    this.tree.separation(function separation(a, b) {
      if (a.hidden || b.hidden) {
        return 0.3;
      } else {
        return 0.6;
      }
    });

    this._update(this.root);

  }

  _update(source) {

    var opts = this.opts;
    var allNodes = this.allNodes;
    var nodeSize = this.nodeSize;

    var nodes = this.tree.nodes(source);

    // Since root node is hidden, readjust height.
    var rootOffset = 0;
    if (nodes.length > 1) {
      rootOffset = nodes[1].y;
    }
    _.forEach(nodes, function(n) {
      n.y = n.y - rootOffset / 2;
    });

    var links = this.tree.links(nodes);

    // Create the link lines.
    this.svg.selectAll('.link')
      .data(links)
      .enter()
      .append('path')
      .attr('class', opts.styles.linage)
      .attr('d', this._elbow);

    var nodes = this.svg.selectAll('.node')
      .data(nodes)
      .enter();

    this._linkSiblings();

    // Draw siblings (marriage)
    this.svg.selectAll('.sibling')
      .data(this.siblings)
      .enter()
      .append('path')
      .attr('class', opts.styles.marriage)
      .attr('d', this._siblingLine);

    // Create the node rectangles.
    nodes.append('rect')
      .attr('class', function(d) {
        return d.class ? d.class : opts.styles.nodes;
      })
      .attr('width', nodeSize[0] / 2)
      .attr('height', nodeSize[1] / 3)
      .attr('id', function(d) {
        return d.id;
      })
      .attr('display', function(d) {
        if (d.hidden) {
          return 'none';
        } else {
          return '';
        };
      })
      .attr('x', function(d) {
        return d.x - nodeSize[0] / 4;
      })
      .attr('y', function(d) {
        return d.y - nodeSize[1] / 6;
      })
      .on('click', function(d) {
        opts.callbacks.nodeClick(d.name, d.extra, d.id);
      });

    // Create the node text label.
    nodes.append('text')
      .text(function(d) {
        return d.name;
      })
      .attr('class', function(d) {
        return d.textClass ? d.textClass : opts.styles.text;
      })
      .attr('x', function(d) {
        return d.x - nodeSize[0] / 4 + 5;
      })
      .attr('y', function(d) {
        return d.y + 4;
      })
      .on('click', function(d) {
        opts.callbacks.nodeClick(d.name, d.extra, d.id);
      });
  }

  _flatten(root) {
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

  _elbow(d, i) {
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

    var fun = d3.svg.line()
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      })
      .interpolate('step-after');
    return fun(linedata);
  }

  _linkSiblings() {

    var allNodes = this.allNodes;

    _.forEach(this.siblings, function(d)  {
      var start = allNodes.filter(function(v) {
        return d.source.id == v.id;
      });
      var end = allNodes.filter(function(v) {
        return d.target.id == v.id;
      });
      d.source.x = start[0].x;
      d.source.y = start[0].y;
      d.target.x = end[0].x;
      d.target.y = end[0].y;
    });

  }

  _siblingLine(d, i) {

    var ny = d.target.y + (d.source.y - d.target.y) * 0.50;

    var linedata = [{
      x: d.source.x,
      y: d.source.y
    }, {
      x: d.target.x,
      y: ny
    }, {
      x: d.target.x,
      y: d.target.y
    }];

    var fun = d3.svg.line()
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      })
      .interpolate('step-after');
    return fun(linedata);
  }

  _calculateNodeSize() {
    var longest = '';
    _.forEach(this.allNodes, function(n) {
      if (n.name.length > longest.length) {
        longest = n.name;
      }
    });

    return [longest.length * 10 + 10, longest.length * 5];
  }

}

export default TreeBuilder;
