import treeBuilder from './builder.js';

const dTree = {

  init(data, options = {}) {

    var opts = _.defaults(options || {}, {
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
      }
    });

    var root = data.root;
    var siblings = data.siblings;

    treeBuilder.create(root, siblings, opts);

  }

};

export default dTree;
