# dTree
*A library for visualizing data trees with multiple parents built on top of D3.*

## Requirements
To use the library the only dependency is that [D3](https://github.com/mbostock/d3) v3 is loaded first.

## Usage
Just include the compiled file ```dTree.js```, it exposes a ```dTree``` variable.

To create a graph from data use the following command:
```
dTree.init("#target-continer", treeData, options);
```

## Development
To setup and build the library from scratch follow these steps:
1. ```npm install --save-dev```
2. ```npm run-script build```

A demo is avaible by running:
```
npm run-script demo
```

## Contributions
To make contributions please follow the contributions document.

## License
The MIT License (MIT)

Copyright (c) 2015 Erik Gärtner
