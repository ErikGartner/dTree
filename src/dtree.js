import treeBuilder from './builder.js';

const dTree = {

  init: function(data, options = {}) {

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
      },
      styles: {
        node: 'node',
        link: 'link',
        marriage: 'marriage',
      }
    });

    var data = this._preprocess(data);
    treeBuilder.create(data.root, data.siblings, opts);

  },

  _preprocess: function(data) {

    var siblings = [];
    var id = 0;

    var root = {
      name: '',
      id: id++,
      hidden: true,
      children: []
    };

    var reconstructTree = function(person, parent) {

      // convert to person to d3 node
      var node = {
        name: person.name,
        id: id++,
        hidden: false,
        children: [],
      };

      // add to parent as child
      parent.children.push(node);

      // go through marriage
      if (person.marriage) {

        var m = {
          name: '',
          id: id++,
          hidden: true,
          noParent: true,
          children: []
        };

        parent.children.push(m);

        var spouse = {
          name: person.marriage.spouse.name,
          id: id++,
          hidden: false,
          noParent: true,
          children: []
        };

        parent.children.push(spouse);

        _.forEach(person.marriage.children, function(child) {
          reconstructTree(child, m);
        });

        siblings.push({
          source: {
            id: node.id
          },
          target: {
            id: spouse.id
          }
        });

      }

    };

    _.forEach(data, function(person) {
      reconstructTree(person, root);
    });

    _.forEach(root.children, function(child) {
      child.noParent = true;
    });

    return {
      root: root,
      siblings: siblings
    };

  }

};

export default dTree;
