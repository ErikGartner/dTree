import TreeBuilder from './builder.js';

const dTree = {

  version: '/* @echo DTREE_VERSION */',

  init: function(data, options = {}) {

    var opts = _.defaultsDeep(options || {}, {
      target: '#graph',
      width: 600,
      height: 600,
      callbacks: {
        nodeClick: function(name, extra, id) {},
        text: function(name, extra, id) {return name;}
      },
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      styles: {
        node: 'node',
        linage: 'linage',
        marriage: 'marriage',
        text: 'nodeText'
      }
    });

    var data = this._preprocess(data);
    var treeBuilder = new TreeBuilder(data.root, data.siblings, opts);
    treeBuilder.create();

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
        extra: person.extra,
        textClass: person.textClass,
        class: person.class
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
          children: [],
          extra: person.marriage.extra
        };

        parent.children.push(m);

        var spouse = {
          name: person.marriage.spouse.name,
          id: id++,
          hidden: false,
          noParent: true,
          children: [],
          textClass: person.marriage.spouse.textClass,
          class: person.marriage.spouse.class,
          extra: person.marriage.spouse.extra
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
