# dTree
*A library for visualizing data trees with multiple parents built on top of D3.*

[![Dependency Status](https://david-dm.org/ErikGartner/dtree.svg)](https://david-dm.org/ErikGartner/dtree) [![devDependency Status](https://david-dm.org/ErikGartner/dtree/dev-status.svg)](https://david-dm.org/ErikGartner/dtree#info=devDependencies)

## Requirements
To use the library the follow dependencies must be loaded:

 - [D3](https://github.com/mbostock/d3) v3.
 - [lodash](https://github.com/lodash/lodash) v3.10

## Usage
Just include the compiled file ```dTree.js```, it exposes a ```dTree``` variable.

To create a graph from data use the following command:
```
dTree.init(data, options);
```

The data object should have the following structure:
```
[{
  name: "Father",
  class: "overriding-css-class",
  marriage: {
    spouse: {
      name: "Mother",
      class: "overriding-css-class"
    },
    children: [{
      name: "Child",
      class: "child-class"
    }]
  },
  extra: {}
}]
```

The options object has the following default values:
```
{
  target: '#graph',
  width: 600,
  height: 600,
  margin: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  },
  textOffset: {
    x: -3,
    y: 3
  },
  styles: {
    node: 'node',
    linage: 'linage',
    marriage: 'marriage'
  }
}
```

## Development
To setup and build the library from scratch follow these steps:

1. ```npm install --save-dev```
2. ```npm run-script build```

A demo is available by running:
```
npm run-script demo
```
It hosts a demo on localhost:3000 located in ```test/demo```. Note that the library must be built first.

## Contributions
To make contributions please follow the contributions document.

## License
The MIT License (MIT)

Copyright (c) 2015 Erik Gärtner
