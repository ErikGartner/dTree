import TreeBuilder from './builder.js';

const dTree = {

  VERSION: '/* @echo DTREE_VERSION */',

  init: function(data, options = {}) {

    var opts = _.defaultsDeep(options || {}, {
      target: '#graph',
      debug: false,
      width: 600,
      height: 600,
      callbacks: {
        nodeClick: function(name, extra, id) {},
        nodeRenderer: function(name, x, y, height, width, extra, id, nodeClass, textClass, textRenderer) {
          return TreeBuilder._nodeRenderer(name, x, y, height, width, extra,
            id,nodeClass, textClass, textRenderer);
        },
        nodeSorter: function(aName, aExtra, bName, bExtra) {return 0;},
        textRenderer: function(name, extra, textClass) {
          return TreeBuilder._textRenderer(name, extra, textClass);
        },
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

    var data = this._preprocess(data, opts);
    var treeBuilder = new TreeBuilder(data.root, data.siblings, opts);
    treeBuilder.create();

  },

  _preprocess: function(data, opts) {

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

      // sort children
      dTree._sortPersons(person.children, opts);

      // add "direct" children
      _.forEach(person.children, function(child) {
        reconstructTree(child, node);
      });

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

        var marriedCouple = dTree._sortPersons([node, spouse], opts);
        parent.children.push(marriedCouple[0], m, marriedCouple[1]);

        dTree._sortPersons(person.marriage.children, opts);
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

      } else {
        parent.children.push(node);
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

  },

  _sortPersons: function(persons, opts) {
    if (persons != undefined) {
      persons.sort(function(a, b) {
        return opts.callbacks.nodeSorter(a.name, a.extra, b.name, b.extra);
      });
    }
    return persons;
  }

};

export default dTree;
