const treeBuilder = {

  create(root, siblings, opts) {

      var kx = function(d) {
        return d.x - 20;
      };
      var ky = function(d) {
        return d.y - 10;
      };
      //this place the text x axis adjust this to center align the text
      var tx = function(d) {
        return d.x + opts.textOffset.x;
      };
      //this place the text y axis adjust this to center align the text
      var ty = function(d) {
        return d.y + opts.textOffset.y;
      };

      //make an SVG
      var svg = d3.select(opts.target)
        .append('svg')
        .attr('width', opts.width + opts.margin.left + opts.margin.right)
        .attr('height', opts.height + opts.margin.top + opts.margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + opts.margin.left + ',' + opts.margin.top + ')');

      // Compute the layout.
      var tree = d3.layout.tree()
        .size([opts.width, opts.height]);
      var nodes = tree.nodes(root);

      // Since root node is hidden, readjust height.
      var root_offset = nodes[1].y;
      _.forEach(nodes, function(n) {
        n.y = n.y - root_offset / 2;
      });

      var links = tree.links(nodes);

      // Create the link lines.
      svg.selectAll('.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', opts.styles.linage)
        .attr('d', this._elbow);

      var nodes = svg.selectAll('.node')
        .data(nodes)
        .enter();

      var allNodes = this._flatten(root);
      this._linkSiblings(allNodes, siblings);

      //First draw sibling line with blue line
      svg.selectAll('.sibling')
        .data(siblings)
        .enter()
        .append('path')
        .attr('class', opts.styles.marriage)
        .attr('d', this._siblingLine);

      // Create the node rectangles.
      nodes.append('rect')
        .attr('class', function(d) {
          if (d.class) {
            return d.class;
          } else {
            return opts.styles.node;
          }
        })
        .attr('height', 20)
        .attr('width', 40)
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
        .attr('x', kx)
        .attr('y', ky);

      // Create the node text label.
      nodes.append('text')
        .text(function(d) {
          return d.name;
        })
        .attr('x', tx)
        .attr('y', ty);
    },

    _flatten: function(root) {
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
    },

    _elbow: function(d, i) {
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
    },

    _linkSiblings: function(allNodes, siblings) {

      _.forEach(siblings, function(d) {
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

    },

    _siblingLine: function(d, i) {

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

};

export default treeBuilder;
