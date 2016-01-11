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
        nodeSize: function(nodes, width, textRenderer) {
          return TreeBuilder._nodeSize(nodes, width, textRenderer);
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
      nodeWidth: 100,
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
        textClass: person.textClass ? person.textClass : opts.styles.text,
        class: person.class ? person.class : opts.styles.node
      };

      // hide linages to the hidden root node
      if (parent == root) {
        node.noParent = true;
      }

      // apply depth offset
      for (var i = 0; i < person.depthOffset; i++) {
        var pushNode = {
          name: '',
          id: id++,
          hidden: true,
          children: [],
          noParent: node.noParent
        };
        parent.children.push(pushNode);
        parent = pushNode;
      }

      // sort children
      dTree._sortPersons(person.children, opts);

      // add "direct" children
      _.forEach(person.children, function(child) {
        reconstructTree(child, node);
      });

      parent.children.push(node);

      // DEPRECATED: Backwards-compatability for v1.x syntax, remove for 2.0
      if (person.marriage) {
        console.log('DEPRECATED: The data attribute "marriage" is deprecated in favor of "marriages" that takes an array. It will be removed in 2.0.');
        person.marriages = [person.marriage];
      }

      //sort marriages
      dTree._sortMarriages(person.marriages, opts);

      // go through marriage
      _.forEach(person.marriages, function(marriage, index) {

        var m = {
          name: '',
          id: id++,
          hidden: true,
          noParent: true,
          children: [],
          extra: marriage.extra
        };

        var sp = marriage.spouse;

        var spouse = {
          name: sp.name,
          id: id++,
          hidden: false,
          noParent: true,
          children: [],
          textClass: sp.textClass ? sp.textClass : opts.styles.text,
          class: sp.class ? sp.class : opts.styles.node,
          extra: sp.extra
        };

        parent.children.push(m, spouse);

        dTree._sortPersons(marriage.children, opts);
        _.forEach(marriage.children, function(child) {
          reconstructTree(child, m);
        });

        siblings.push({
          source: {
            id: node.id
          },
          target: {
            id: spouse.id
          },
          number: index
        });
      });

    };

    _.forEach(data, function(person) {
      reconstructTree(person, root);
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
  },

  _sortMarriages: function(marriages, opts) {
    if (marriages != undefined && Array.isArray(marriages)) {
      marriages.sort(function(marriageA, marriageB) {
        var a = marriageA.spouse;
        var b = marriageB.spouse;
        return opts.callbacks.nodeSorter(a.name, a.extra, b.name, b.extra);
      });
    }
    return marriages;
  }

};

export default dTree;
