class TreeBuilder {

  constructor(root, siblings, opts) {
    TreeBuilder.DEBUG_LEVEL = opts.debug ? 1 : 0;

    this.root = root;
    this.siblings = siblings;
    this.opts = opts;

    // flatten nodes
    this.allNodes = this._flatten(this.root);

    // Calculate node size
    let visibleNodes = _.filter(this.allNodes, function(n) {
      return !n.hidden;
    });
    this.nodeSize = opts.callbacks.nodeSize(visibleNodes,
      opts.nodeWidth, opts.callbacks.textRenderer);
  }

  create() {

    let opts = this.opts;
    let allNodes = this.allNodes;
    let nodeSize = this.nodeSize;

    let width = opts.width + opts.margin.left + opts.margin.right;
    let height = opts.height + opts.margin.top + opts.margin.bottom;

    let zoom = this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', function () {
        g.attr('transform', d3.event.transform)
      })

    // make a svg
    let svg = this.svg = d3.select(opts.target)
      .append('svg')
      .attr('viewBox', [0, 0, width, height])
      .call(zoom)

    // create svg group that holds all nodes
    const g = this.g = svg.append('g')

    // set zoom identity
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, opts.margin.top).scale(1))

    // Compute the layout.
    this.tree = d3.tree()
      .nodeSize([nodeSize[0] * 2,
                 opts.callbacks.nodeHeightSeperation(nodeSize[0], nodeSize[1])]);

    this.tree.separation(function separation(a, b) {
      if (a.data.hidden || b.data.hidden) {
        return 0.3;
      } else {
        return 0.6;
      }
    });

    this._update(this.root);

  }

  _update(source) {

    let opts = this.opts;
    let allNodes = this.allNodes;
    let nodeSize = this.nodeSize;

    let treenodes = this.tree(source);
    let links = treenodes.links();

    // Create the link lines.
    this.g.selectAll('.link')
      .data(links)
      .enter()
      // filter links with no parents to prevent empty nodes
      .filter(function(l) {
        return !l.target.data.noParent;
      })
      .append('path')
      .attr('class', opts.styles.linage)
      .attr('d', this._elbow);

    let nodes = this.g.selectAll('.node')
      .data(treenodes.descendants())
      .enter();

    this._linkSiblings();

    // Draw siblings (marriage)
    this.g.selectAll('.sibling')
      .data(this.siblings)
      .enter()
      .append('path')
      .attr('class', opts.styles.marriage)
      .attr('d', _.bind(this._siblingLine, this));

    // Create the node rectangles.
    nodes.append('foreignObject')
      .filter(function(d) {
        return d.data.hidden ? false : true;
      })
      .attr('x', function(d) {
        return Math.round(d.x - d.cWidth / 2) + 'px';
      })
      .attr('y', function(d) {
        return Math.round(d.y - d.cHeight / 2) + 'px';
      })
      .attr('width', function(d) {
        return d.cWidth + 'px';
      })
      .attr('height', function(d) {
        return d.cHeight + 'px';
      })
      .attr('id', function(d) {
        return d.id;
      })
      .html(function(d) {
        return opts.callbacks.nodeRenderer(
          d.data.name,
          d.x,
          d.y,
          nodeSize[0],
          nodeSize[1],
          d.data.extra,
          d.data.id,
          d.data.class,
          d.data.textClass,
          opts.callbacks.textRenderer);
      })
      .on('dblclick', function () {
        // do not propagate a double click to prevent the zoom from being triggered
        d3.event.stopPropagation()
      })
      .on('click', function (d) {
        // ignore double-clicks and clicks on hidden nodes
        if (d3.event.detail === 2 || d.data.hidden) {
          return
        }
        opts.callbacks.nodeClick(d.data.name, d.data.extra, d.data.id, d3.mouse(this))
      })
      .on('contextmenu', function(d)  {
        if (d.data.hidden) {
          return;
        }
        d3.event.preventDefault();
        opts.callbacks.nodeRightClick(d.data.name, d.data.extra, d.data.id, d3.mouse(this));
      });
  }

  _flatten(root) {
    let n = [];
    let i = 0;

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
    if (d.target.data.noParent) {
      return 'M0,0L0,0';
    }
    let ny = Math.round(d.target.y + (d.source.y - d.target.y) * 0.50);

    let linedata = [{
      x: d.target.x,
      y: d.target.y
    }, {
      x: d.target.x,
      y: ny
    }, {
      x: d.source.x,
      y: d.source.y
    }];

    let fun = d3.line().curve(d3.curveStepAfter)
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      });
    return fun(linedata);
  }

  _linkSiblings() {

    let allNodes = this.allNodes;

    _.forEach(this.siblings, function(d) {
      let start = allNodes.filter(function(v) {
        return d.source.id == v.data.id;
      });
      let end = allNodes.filter(function(v) {
        return d.target.id == v.data.id;
      });
      d.source.x = start[0].x;
      d.source.y = start[0].y;
      d.target.x = end[0].x;
      d.target.y = end[0].y;

      let marriageId = (start[0].data.marriageNode != null ?
                        start[0].data.marriageNode.id :
                        end[0].data.marriageNode.id);
      let marriageNode = allNodes.find(function(n) {
        return n.data.id == marriageId;
      });
      d.source.marriageNode = marriageNode;
      d.target.marriageNode = marriageNode;
    });

  }

  _siblingLine(d, i) {

    let ny = Math.round(d.target.y + (d.source.y - d.target.y) * 0.50);
    let nodeWidth = this.nodeSize[0];
    let nodeHeight = this.nodeSize[1];

    // Not first marriage
    if (d.number > 0) {
      ny -= Math.round(nodeHeight * 8 / 10);
    }

    let linedata = [{
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

    let fun = d3.line().curve(d3.curveStepAfter)
      .x(function(d) {
        return d.x;
      })
      .y(function(d) {
        return d.y;
      });
    return fun(linedata);
  }

  static _nodeHeightSeperation(nodeWidth, nodeMaxHeight) {
    return nodeMaxHeight + 25;
  }

  static _nodeSize(nodes, width, textRenderer) {
    let maxWidth = 0;
    let maxHeight = 0;
    let tmpSvg = document.createElement('svg');
    document.body.appendChild(tmpSvg);

    _.map(nodes, function(n) {
      let container = document.createElement('div');
      container.setAttribute('class', n.data.class);
      container.style.visibility = 'hidden';
      container.style.maxWidth = width + 'px';

      let text = textRenderer(n.data.name, n.data.extra, n.data.textClass);
      container.innerHTML = text;

      tmpSvg.appendChild(container);
      let height = container.offsetHeight;
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

  static _nodeRenderer(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
    let node = '';
    node += '<div ';
    node += 'style="height:100%;width:100%;" ';
    node += 'class="' + nodeClass + '" ';
    node += 'id="node' + id + '">\n';
    node += textRenderer(name, extra, textClass);
    node += '</div>';
    return node;
  }

  static _textRenderer(name, extra, textClass) {
    let node = '';
    node += '<p ';
    node += 'align="center" ';
    node += 'class="' + textClass + '">\n';
    node += name;
    node += '</p>\n';
    return node;
  }

  static _debug(msg) {
    if (TreeBuilder.DEBUG_LEVEL > 0)  {
      console.log(msg);
    }
  }

}

export default TreeBuilder;
