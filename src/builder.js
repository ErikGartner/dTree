const treeBuilder = {

  create(root, siblings, opts) {

    /**
    This draws the sibling line.
    **/
    function siblingLine(d, i) {

      //start point
      var start = allNodes.filter(function(v) {
        if (d.source.id == v.id) {
          return true;
        } else {
          return false;
        }
      });
      //end point
      var end = allNodes.filter(function(v) {
        if (d.target.id == v.id) {
          return true;
        } else {
          return false;
        }
      });

      //define the start coordinate and end co-ordinate
      var linedata = [{
        x: start[0].x,
        y: start[0].y
      }, {
        x: end[0].x,
        y: end[0].y
      }];

      var fun = d3.svg.line().x(function(d) {
        return d.x;
      }).y(function(d) {
        return d.y;
      }).interpolate('linear');
      return fun(linedata);
    }

    /**
      This draws the lines between nodes.
    **/
    function elbow(d, i) {
      if (d.target.noParent) {
        return 'M0,0L0,0';
      }
      var diff = d.source.y - d.target.y;
      //0.40 defines the point from where you need the line to break out change is as per your choice.
      var ny = d.target.y + diff * 0.40;

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

      var fun = d3.svg.line().x(function(d) {
        return d.x;
      }).y(function(d) {
        return d.y;
      }).interpolate('step-after');
      return fun(linedata);
    }

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
    var svg = d3.select(opts.target).append('svg')
      .attr('width', opts.width + opts.margin.left + opts.margin.right)
      .attr('height', opts.height + opts.margin.top + opts.margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + opts.margin.left + ',' + opts.margin.top + ')');

    console.log(root);
    var allNodes = this._flatten(root);
    //This maps the siblings together mapping uses the ID using the blue line

    // Compute the layout.
    var tree = d3.layout.tree().size([opts.width, opts.height]);
    var nodes = tree.nodes(root);
    console.log(nodes);
    var links = tree.links(nodes);
    console.log(links);

    // Create the link lines.
    svg.selectAll('.link')
      .data(links)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', elbow);

    var nodes = svg.selectAll('.node')
      .data(nodes)
      .enter();

    //First draw sibling line with blue line
    svg.selectAll('.sibling')
      .data(siblings)
      .enter().append('path')
      .attr('class', 'sibling')
      .attr('d', siblingLine);

    // Create the node rectangles.
    nodes.append('rect')
      .attr('class', 'node')
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

  /**
    To make the nodes in flat mode.
    This gets all the nodes in same level
  **/
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

};

export default treeBuilder;
