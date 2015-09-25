var treelib_util = {
  removeElementFromArray: function (arr,val,deleteFirst) {
    for (var i = 0; i < arr.length; i++) {
      if(arr[i] == val) {
        delete arr[i];
        if(deleteFirst) break;
      };
    }
  },
  nodeInArray: function (el, arr) {
    for (var i = 0; i < arr.length; i++) {
      if(arr[i] && arr[i].id == el) return true;
    }
    return false;
  }
};

var treelib = {
  __id: 0,
  NODE: 1,
  LINK: 2,
  findStartPoint: function (nodes) {
    var entry = null;
    jQuery.each(nodes, function (ndIdx, nd) {
      if(nd) {
        var found = false;
        jQuery.each(nd.connections, function (k,v) {
          if(v) {
            found = true;
            if(v.startPoint) {
              return false;
            } else if(v.target.id === nd.id) {
              found = false;
              return false;
            }
          }
        });
        if(found)  {
          entry = nd;
          return false;
        }
      }
    });
    return entry;
  },
  Node: function (data) {
    var maxCharsInLine = 33;
    this.id = data.id;
    this.text = data.text;
    this.isAnswer = data.isAnswer;
    this.children = data.linksTo;
    this.startPoint = data.startPoint != null ? data.startPoint : false;
    this.isQuickLink = data.quickLink != null ? data.quickLink : false;
    if(data.nextScript) {
      this.nextScript = data.nextScript;
    }
    //this will be used in future to hold related connections
    //when update is coming
    this.connections = {};

    //updates visual state of object
    this.update = function () {
      //This is hack
      var prevZoom = this.__diagram.__canvas.getZoom();
      this.__diagram.__canvas.zoomToPoint(this.__diagram.zoomPoint,1);

      var txt = this.fabric.getObjects()[1],
      rect = this.fabric.getObjects()[0];
      var bounds = txt.getBoundingRect();
      rect.width = 10 + bounds.width;
      rect.height = 10 + bounds.height;
      rect.top = -rect.height/2;
      rect.left = -rect.width / 2;
      txt.top = rect.top;
      txt.left = rect.left;
      this.fabric.width = rect.width;
      this.fabric.height = rect.height;
      //This is hack


      jQuery.each(this.connections, function (k, v) {
        if(v) v.update();
      });
      this.__diagram.__canvas.zoomToPoint(this.__diagram.zoomPoint,prevZoom);
    };
    this.setText = function (txt) {
      var prevZoom = this.__diagram.__canvas.getZoom(),
      result = [],
      words = [],
      counter = 0,
      start = 0;
      this.__diagram.__canvas.zoomToPoint(this.__diagram.zoomPoint,1);
      words = txt.split(' ');
      jQuery.each(words, function (idx, val) {
        counter += val.length;
        if(idx === (words.length-1)) counter = 1000000;
        if(counter >= maxCharsInLine) {
          result[result.length] = words.slice(start, idx+1);
          start = idx+1;
          counter = 0;
        }
      });
      if(result.length > 0) {
        var genText = '';
        jQuery.each(result, function (wIdx, wVal) {
          genText += wVal.join(' ');
          if((result.length - 1) !== wIdx)
            genText += '\n';
        });
        this.fabric.getObjects()[1].setText(genText);
      } else {
        this.fabric.getObjects()[1].setText(txt);
      }
      this.text = txt;
      this.update();
      this.__diagram.__canvas.zoomToPoint(this.__diagram.zoomPoint,prevZoom);
    };
    this.getText = function () {
      return this.fabric.getObjects()[1].text;
    };
    this.setQuickLink = function (flag) {
      if(this.isAnswer) {
        this.isQuickLink = flag;
        return true;
      } else {
        return false
      }
    };
    this.getQuickLink = function () {
      return this.isQuickLink;
    };
    this.toggleQuickLink = function () {
      this.setQuickLink(!this.getQuickLink());
    };
    this.setNextScript = function (scr) {
      if(scr) {
        this.nextScript = scr;
      } else {
        this.nextScript = undefined;
      }
    };

    //Creating visual fabricjs Object
    var color = "#63CB78";
    if(data.isAnswer) {
      if(data.nextScript) {
        color = '#ECBA60';
      } else {
        color = '#50B1B0';
      }
    }
    var rect = new fabric.Rect({
      fill: color
    });
    var txt = new fabric.Text(data.text, {
      fontFamily: 'Roboto',
      fontSize: 20,
      top: rect.top,
      left: rect.left,
      color: '#000',
      textAlign: 'center'
    });
    var grp = new fabric.Group([rect, txt], {
      hasControls: false,
      borderColor: 'red',
      padding: 5
    });
    if(data.x && data.y) {
      grp.left = data.x;
      grp.top = data.y;
    }
    this.fabric = grp;
    this.fabric.treelib_type = treelib.NODE;
    this.fabric.treelib_model = this;

    //Initialization
    //this.update();
  },
  Link: function (origin, target) {
    var checkLineIntersection = function (p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
      // var denominator, a, b, numerator1, numerator2, result = {
      //   x: null,
      //   y: null,
      //   result: false
      // };
      // denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
      // if (denominator == 0) {
      //   return result;
      // }
      // a = line1StartY - line2StartY;
      // b = line1StartX - line2StartX;
      // numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
      // numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
      // a = numerator1 / denominator;
      // b = numerator2 / denominator;
      // result.x = line1StartX + (a * (line1EndX - line1StartX));
      // result.y = line1StartY + (a * (line1EndY - line1StartY));
      // var onLine1 = false, onLine2 = false;
      // if (a > 0 && a < 1) {
      //   onLine1 = true;
      // }
      // if (b > 0 && b < 1) {
      //   onLine2 = true;
      // }
      // result.result = onLine1 && onLine2;
      // return result;
      var ip = {x: 0, y: 0, result: false},
      nx = (p4x - p3x) * (p1y - p3y) - (p4y - p3y) * (p1x - p3x);
      ny = (p2x - p1x) * (p1y - p3y) - (p2y - p1y) * (p1x - p3x);
      dn = (p4y - p3y) * (p2x - p1x) - (p4x - p3x) * (p2y - p1y);

      nx /= dn;
      ny /= dn;

      // has intersection
      if(nx>= 0 && nx <= 1 && ny>= 0 && ny <= 1){
        ny = p1y + nx * (p2y - p1y);
        nx = p1x + nx * (p2x - p1x);
        ip.x = nx;
        ip.y = ny;
        ip.result = true;
      }
      return ip;
    };
    var calculateIntersectionPoint = function (origin, targetObject) {
      //Calculate center point
      var center = [
        origin.fabric.left + (origin.fabric.getBoundingRectWidth()/2),
        origin.fabric.top + (origin.fabric.getBoundingRectHeight()/2)
      ],
      t = [
        targetObject.fabric.left + (targetObject.fabric.getBoundingRectWidth()/2),
        targetObject.fabric.top + (targetObject.fabric.getBoundingRectHeight()/2)
      ];

      var l = [], k = [], m = [];
      if(t[0] > center[0]) {
        l[0] = origin.fabric.left + origin.fabric.getBoundingRectWidth();
        m[0] = origin.fabric.left;
      } else {
        l[0] = origin.fabric.left;
        m[0] = origin.fabric.left + origin.fabric.getBoundingRectWidth();
      }
      if(t[1] > center[1]) {
        l[1] = origin.fabric.top + origin.fabric.getBoundingRectHeight();
        k[1] = origin.fabric.top;
      } else {
        l[1] = origin.fabric.top;
        k[1] = origin.fabric.top + origin.fabric.getBoundingRectHeight();
      }
      k[0] = l[0];
      m[1] = l[1];
      var p1 = checkLineIntersection(center[0], center[1], t[0], t[1], l[0], l[1], k[0], k[1]),
      p2 = checkLineIntersection(center[0], center[1], t[0], t[1], l[0], l[1], m[0], m[1]);
      return p1.result ? p1 : p2;
    };
    this.updateArrowHead = function(p1, p2) {
      var dx = p2.x - p1.x,
      dy = p2.y - p1.y,
      angle = Math.atan2(dy, dx);
      angle *= 180 / Math.PI;
      angle += 90;
      this.triangle.angle = angle;
      this.triangle.top = p2.y;
      this.triangle.left = p2.x;
    };
    var headLength = 15;
    this.id = treelib.__id++;
    this.origin = origin;
    this.target = target;
    if(!this.origin || !this.target) {
      console.log("ERROR");
    }
    this.origin.connections[this.id] = this;
    this.target.connections[this.id] = this;
    this.triangle = new fabric.Triangle({
      angle: 0,
      fill: '#207cca',
      top: 0,
      left: 0,
      height: headLength,
      width: headLength,
      originX: 'center',
      originY: 'center',
      selectable: false
    });
    this.fabric = new fabric.Line([0,0,150,150],{
      fill: 'blue',
      stroke: 'blue',
      strokeWidth: 4,
      perPixelTargetFind: true,
      hasControls: false,
      lockMovementX: true,
      lockMovementY: true,
      originX: 'center',
      originY: 'center'
    });
    this.update = function () {
      //Check if origin and target are not intersecting.
      //We don't have draw something if they are intersecting.
      var prevZoom = this.__diagram.__canvas.getZoom();
      this.__diagram.__canvas.zoomToPoint(this.__diagram.zoomPoint,1);
      this.__diagram.__canvas.sendToBack(this.fabric);

      if(!this.origin.fabric.intersectsWithObject(this.target.fabric)) {
        this.fabric.setVisible(true);
        this.triangle.setVisible(true);
        var p1 = { x: this.origin.fabric.left + this.origin.fabric.getBoundingRectWidth()/2, y: this.origin.fabric.top+ this.origin.fabric.getBoundingRectHeight()/2 };//calculateIntersectionPoint(origin, target);
        var p2 = calculateIntersectionPoint(target, origin);
        this.updateArrowHead(p1,p2);
        this.fabric.set({'x1': p1.x, 'y1': p1.y});
        this.fabric.set({'x2': p2.x, 'y2': p2.y});
      } else {
        this.fabric.setVisible(false);
        this.triangle.setVisible(false);
      }
      this.__diagram.__canvas.zoomToPoint(this.__diagram.zoomPoint,prevZoom);
    };
    this.fabric.treelib_model = this;
    this.fabric.treelib_type = treelib.LINK;
    //this.update();
  },
  Diagram: function (cnv) {
    var nodes = [], nodesFabric = [],
    links = [],
    topGap = 50,
    gap = 30, initComplete = false;
    this.__canvas = cnv;
    this.zoomPoint = new fabric.Point(0,0);
    this.__id = 0;
    this.generateId = function () {
      return this.__id++;
    };
    this.add = function (element) {
      if(element.origin !== undefined) {
        links[element.id] = element;
        if(initComplete) this.__canvas.add(element.triangle);
      } else {
        nodes[element.id] = element;
      }
      element.__diagram = this;
      if(initComplete) {
        this.__canvas.add(element.fabric);
        element.update();
      }
    };
    this.remove = function (element) {
      if(element.origin != null) {
        element.origin.connections[element.id] = undefined;
        treelib_util.removeElementFromArray(element.origin.children, element.target.id);
        element.target.connections[element.id] = undefined;
        this.__canvas.remove(element.triangle);
        this.__canvas.remove(element.fabric);
        delete links[element.id];
        this.__canvas.renderAll();
      } else {
        var questions = 0;
        nodes.forEach(function (val,idx,arr) {
          if(!val.isAnswer) questions++;
        });
        if((questions === 1) && (!element.isAnswer)) {
          return false;
        } else {
          var thisClosure = this;
          jQuery.each(element.connections, function (k,v) {
            if(v) thisClosure.remove(v);
          });
          delete nodes[element.id];
          this.__canvas.remove(element.fabric);
          this.__canvas.renderAll();
        }
      }
      return true;
    };
    this.init = function () {
      //Add links
      var thisObject = this;
      nodes.forEach(function (el, idx, arr) {
        thisObject.__canvas.add(el.fabric);
        if(thisObject.__id <= el.id) thisObject.__id = el.id+1;
        for (var i = 0; i < el.children.length; i++) {
          if(el.children[i]) {
            var link = new treelib.Link(el, nodes[el.children[i]]);
            thisObject.__canvas.add(link.fabric);
            thisObject.__canvas.add(link.triangle);
            thisObject.add(link);
            link.update();
          }
        }
      });
      initComplete = true;
    };
    this.refresh = function () {
      nodes.forEach(function (val, idx, arr) {
        val.update();
      });
      this.__canvas.renderAll();
    };
    this.connect = function (node1, node2) {
      var flag = 0; //0 - good, 1 - already connected, 2 - answer and answer or node and node, 3 - attempt to connect to cross-script node
      if(node1.nextScript) {
        return 3;
      }
      if(node1.isAnswer ? !node2.isAnswer : node2.isAnswer) { // this is XOR
        for (var i = 0; i < node1.children.length; i++) {
          if(node1.children[i] === node2.id) {
            flag = 1;
          }
        }
        for (var i = 0; i < node2.children.length; i++) {
          if(node2.children[i] === node1.id) {
            flag = 1;
          }
        }
        if(flag === 0) {
          var link = new treelib.Link(node1, node2);
          node1.children.push(node2.id);
          this.add(link);
          link.fabric.bringToFront();
          link.triangle.bringToFront();
        }
        return flag;
      } else {
        return 2;
      }
    };
    // TODO: ПЕРЕДЕЛАТЬ ЭТОТ МЕТОД ВООБЩЕ, СДЕЛАТЬ КАК МОЖНО ПРОЩЕ
    this.buildTree = function (entryId) {
      var prevZoom = this.__canvas.getZoom();
      this.__canvas.zoomToPoint(this.zoomPoint,1);
      //Find entry point
      var entry = null;
      if(entryId) {
        entry = nodes[entryId];
      } else {
        nodes.forEach(function (nd, ndIdx, ndArr) {
          if(nd) {
            var found = false;
            jQuery.each(nd.connections, function (k,v) {
              if(v) {
                found = true;
                if(v.target.id === nd.id) {
                  found = false;
                  return false;
                }
              }
            });
            if(found) entry = nd;
          }
        });
      }
      //Define recursive function
      var wasRead = {},
      center = this.__canvas.getWidth()/2,
      r = function (nds, prevHeight, offsetLeft) {
        var nextNds = [],
        sumWidth = 0,
        pointer = 0,
        maxHeight = 0;
        jQuery.each(nds, function (ndsIdx, ndsVal) {
          if(ndsVal && !wasRead[ndsVal.id]) {
            jQuery.each(ndsVal.children, function (chIdx, chVal) {
              if(!treelib_util.nodeInArray(chVal ,nextNds)) nextNds.push(nodes[chVal]);
            });
            sumWidth += ndsVal.fabric.getBoundingRectWidth() + gap;
            wasRead[ndsVal.id] = true;
            ndsVal.fabric.top = prevHeight;
            if(maxHeight < ndsVal.fabric.getBoundingRectHeight()) {
              maxHeight = ndsVal.fabric.getBoundingRectHeight();
            }
          }
        });
        sumWidth -= gap;
        pointer = (offsetLeft ? offsetLeft : center) - sumWidth/2;
        jQuery.each(nds, function (ndsIdx, compNode) {
          if(compNode) {
            compNode.fabric.left = pointer;
            pointer += compNode.fabric.getBoundingRectWidth() + gap;
            compNode.update();
          }
        });
        if(sumWidth > 0) {
          r(nextNds, prevHeight + maxHeight + topGap, offsetLeft ? offsetLeft : undefined);
        }
      };
      if(entryId) {
        r([entry], entry.fabric.top, entry.fabric.left + entry.fabric.getBoundingRectWidth()/2);
      } else {
        r([entry], topGap);
      }
      this.__canvas.zoomToPoint(this.zoomPoint,prevZoom);
      //this.__canvas.renderAll();
    };
    this.loadFromJson = function (jsonObject) {
      var thisObject = this;
      jQuery.each(jsonObject, function (idx, val) {
        var nd = new treelib.Node(val);
        thisObject.add(nd);
        nd.setText(val.text);
      });
    };
    this.saveToJson = function () {
      var result = [];
      jQuery.each(nodes, function (idx, val) {
        if(val) {
          var jsonObj = {};
          jsonObj.id = val.id;
          jsonObj.text = val.text;
          jsonObj.isAnswer = val.isAnswer;
          jsonObj.startPoint = val.startPoint != null ? val.startPoint : false;
          jsonObj.linksTo = val.children;
          jsonObj.x = val.fabric.left;
          jsonObj.y = val.fabric.top;
          jsonObj.quickLink = val.getQuickLink();
          if(val.nextScript) jsonObj.nextScript = val.nextScript;
          result.push(jsonObj);
        }
      });
      return result;
    };
    this.getQuickLinks = function () {
      var result = [];
      for (var i = 0; i < nodes.length; i++) {
        if(nodes[i] && nodes[i].getQuickLink()) {
          result.push(nodes[i]);
        }
      }
      return result;
    };
    this.__canvas.on('object:moving',function (e) {
      if(e.target && e.target.treelib_model) {
        e.target.treelib_model.update();
      }
    });
  }
};
