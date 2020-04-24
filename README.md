# dTree
*A library for visualizing data trees with multiple parents built on top of [D3](https://github.com/mbostock/d3).*

[![npm](https://img.shields.io/npm/v/d3-dtree.svg)](https://www.npmjs.com/package/d3-dtree) [![Bower](https://img.shields.io/bower/v/d3-dtree.svg)](https://github.com/ErikGartner/dTree) [![](https://data.jsdelivr.com/v1/package/npm/d3-dtree/badge?style=rounded)](https://www.jsdelivr.com/package/npm/d3-dtree)

**Using dTree? Send me a message with a link to your website to be listed below.**

## The Online Viewer
There exists an online viewer for dTree graphs called [Treehouse](https://treehouse.gartner.io), similar to [https://bl.ocks.org/](https://bl.ocks.org/) for D3. Treehouse allows anybody to host a dTree graph without having to create a website or interact directly with the library. It fetches data from Github's gists and displays it in a nice format. All graphs are unlisted so without your Gist ID nobody else can view them. Checkout the *demo* graph for dTree:

https://treehouse.gartner.io/ErikGartner/58e58be650453b6d49d7

The same demo is also available on [JSFiddle](https://jsfiddle.net/rha8sg79/).

## Installation
There are several ways to use dTree. One way is to simply include the compiled file ```dTree.js``` that then exposes a ```dTree``` variable. dTree is available on both NPM and Bower as *d3-dtree*.

```bash
npm install d3-dtree
bower install d3-dtree
yarn add d3-dtree
```

Lastly dTree is also available through several CDNs such as [jsDelivr](https://www.jsdelivr.com/package/npm/d3-dtree):
```
https://cdn.jsdelivr.net/npm/d3-dtree@2.4.1/dist/dTree.min.js
```

## Requirements
To use the library the follow dependencies must be loaded:

 - [D3](https://github.com/mbostock/d3) v4.x
 - [lodash](https://github.com/lodash/lodash) v4.x

## Usage
To create a graph from data use the following command:
```javascript
tree = dTree.init(data, options);
```

The data object should have the following structure:
```javascript
[{
  name: "Father",                         // The name of the node
  class: "node",                          // The CSS class of the node
  textClass: "nodeText",                  // The CSS class of the text in the node
  depthOffset: 1,                         // Generational height offset
  marriages: [{                           // Marriages is a list of nodes
    spouse: {                             // Each marriage has one spouse
      name: "Mother",
    },
    children: [{                          // List of children nodes
      name: "Child",
    }]
  }],
  extra: {}                               // Custom data passed to renderers
}]
```

The following CSS sets some good defaults:
```css
.linage {
    fill: none;
    stroke: black;
}
.marriage {
    fill: none;
    stroke: black;
}
.node {
    background-color: lightblue;
    border-style: solid;
    border-width: 1px;
}
.nodeText{
    font: 10px sans-serif;
}
.marriageNode {
    background-color: black;
    border-radius: 50%;
}
```

The options object has the following default values:
```javascript
{
  target: '#graph',
  debug: false,
  width: 600,
  height: 600,
  hideMarriageNodes: true,
  marriageNodeSize: 10,
  callbacks: {
    /*
      Callbacks should only be overwritten on a need to basis.
      See the section about callbacks below.
    */
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
}
```

### Zooming
The returned object, `tree = dTree.init(data, options)`,  contains functions to control the viewport.

- `tree.resetZoom(duration = 500)` - Reset zoom and position to initial state
- `zoomTo(x, y, zoom = 1, duration = 500)` - Zoom to a specific position
- `zoomToNode(nodeId, zoom = 2, duration = 500)` - Zoom to a specific node
- `zoomToFit(duration = 500)` - Zoom to fit the entire tree into the viewport

### Callbacks
Below follows a short descriptions of the available callback functions that may be passed to dTree. See [dtree.js](https://github.com/ErikGartner/dTree/blob/master/src/dtree.js) for the *default implementations*. Information about e.g. mouse cursor position can retrieved by interacting with the `this` object, i.e. `d3.mouse(this)`.

#### nodeClick
```javascript
function(name, extra, id)
```
The nodeClick function is called by dTree when the node or text is clicked by the user. It shouldn't return any value.

#### nodeRightClick
```javascript
function(name, extra, id)
```
The nodeRightClick function is called by dTree when the node or text is right-clicked by the user. It shouldn't return any value.

#### nodeRenderer
```javascript
function(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer)
```
The nodeRenderer is called once for each node and is expected to return a string containing the node. By default the node is rendered using a div containing the text returned from the default textRendeder. See the JSFiddle above for an example on how to set the callback.

#### nodeHeightSeperation
```javascript
function(nodeWidth, nodeMaxHeight)
```
The nodeHeightSeperation is called during intial layout calculation. It shall return one number representing the distance between the levels in the graph.

#### nodeSize
```javascript
function(nodes, width, textRenderer)
```
This nodeSize function takes all nodes and a preferred width set by the user. It is then expected to return an array containing the width and height for all nodes (they all share the same width and height during layout though nodes may be rendered as smaller by the nodeRenderer).

#### nodeSorter
```javascript
function(aName, aExtra, bName, bExtra)
```
The nodeSorterer takes two nodes names and extra data, it then expected to return -1, 0 or 1 depending if A is less, equal or greater than B. This is used for sorting the nodes in the tree during layout.

#### textRenderer
```javascript
function(name, extra, textClass)
```
The textRenderer function returns the formatted text to the nodeRenderer. This way the user may chose to overwrite only what text is shown but may opt to keep the default nodeRenderer.

#### marriageClick
```javascript
function(extra, id)
```
Same as `nodeClick` but for the marriage nodes (connector).

#### marriageRightClick
```javascript
function(extra, id)
```
Same as `nodeRightClick` but for the marriage nodes (connector).

#### marriageRenderer
```javascript
function(x, y, height, width, extra, id, nodeClass)
```
Same as `nodeRenderer` but for the marriage nodes (connector).

#### marriageSize
```javascript
function(nodes, size)
```
Same as `nodeSize` but for the marriage nodes (connector).


## Development
dTree has the following development environment:

- node v11.x (use Docker [image](https://hub.docker.com/_/node/) `node:11`)
- gulp 3.x
- [Yarn](https://yarnpkg.com/) instead of npm.

To setup and build the library from scratch follow these steps:

1. ```yarn install```
2. ```yarn run build```

A demo is available by running:
```
yarn run demo
```
It hosts a demo on localhost:3000/ by serving [test/demo](test/demo) and using the latest compiled local version of the library.

## Contributing
Contributions are very welcomed! Checkout the [CONTRIBUTING](CONTRIBUTING.md) document for style information.
A good place to start is to make a pull request to solve an open issue. Feel free to ask questions regarding the issue since most have a sparse description.

## License
The MIT License (MIT)

Copyright (c) 2015-2019 Erik Gärtner
