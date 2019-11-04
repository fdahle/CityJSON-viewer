//
//this file contains background functions
//

var ALLCOLOURS = {
  "Building": 0xcc0000,
  "BuildingPart": 0xcc0000,
  "BuildingInstallation": 0xcc0000,
  "Bridge": 0x999999,
  "BridgePart": 0x999999,
  "BridgeInstallation": 0x999999,
  "BridgeConstructionElement": 0x999999,
  "CityObjectGroup": 0xffffb3,
  "CityFurniture": 0xcc0000,
  "GenericCityObject": 0xcc0000,
  "LandUse": 0xffffb3,
  "PlantCover": 0x39ac39,
  "Railway": 0x000000,
  "Road": 0x999999,
  "SolitaryVegetationObject": 0x39ac39,
  "TINRelief": 0x3FD43F,
  "TransportSquare": 0x999999,
  "Tunnel": 0x999999,
  "TunnelPart": 0x999999,
  "TunnelInstallation": 0x999999,
  "WaterBody": 0x4da6ff
};

function storeColors() {
  for (var key in ALLCOLOURS) {
    if (localStorage.getItem("color_" + key) === null) {
      var elem = ALLCOLOURS[key].toString(16)
      if (elem == 0) {
        elem = "000000"
      }
      localStorage.setItem("color_" + key, "0x" + elem);
    }
  }
}

function buildColors() {
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.substring(0, 6) == "color_") {
      var item = localStorage.getItem(key);
      var name = key.substring(6);
      var elem = Number(item).toString(16)
      if (elem == 0) {
        elem = "000000"
      }
      $('#settings_Color').append('<label class="labelColor" for="' + key + '">' + name + ' :</label>');
      $('#settings_Color').append('<input class="inputColorPicker" id="' + key + '" type="color" onchange="changeColor(this);" value="#' + elem + '"/>');
      $('#settings_Color').append('<br><br>')
    };
  }
}

function changeColor(input) {
  var val = "0x" + input.value.substring(1);
  var coType = input.id.substring(6);
  localStorage.setItem(input.id, val);

  for (var i in meshes) {
    if (meshes[i].coType == coType) {
      meshes[i].material.color.setHex(val);
    };
  }

  renderer.render(scene, camera);
}

//not used can be deleted prob
function sortVert(pList, type) {

  // Array of points;
  const points = [];
  for (var i = 0; i < pList.length; i = i + 3) {
    points.push({
      x: pList[i],
      y: pList[i + 1],
      z: pList[i + 2]
    })
  }

  // Find min max to get center
  // Sort from top to bottom
  points.sort((a, b) => a.y - b.y);

  // Get center y
  const cy = (points[0].y + points[points.length - 1].y) / 2;

  // Sort from right to left
  points.sort((a, b) => b.x - a.x);

  // Get center x
  const cx = (points[0].x + points[points.length - 1].x) / 2;

  // Center point
  const center = {
    x: cx,
    y: cy
  };

  // Starting angle used to reference other angles
  var startAng;
  points.forEach(point => {
    var ang = Math.atan2(point.y - center.y, point.x - center.x);
    if (!startAng) {
      startAng = ang
    } else {
      if (ang < startAng) { // ensure that all points are clockwise of the start point
        ang += Math.PI * 2;
      }
    }
    point.angle = ang; // add the angle to the point
  });

  if (type == "cw") {

    // Sort clockwise;
    points.sort((a, b) => a.angle - b.angle);
  } else if (type == "ccw") {

    // first sort clockwise
    points.sort((a, b) => a.angle - b.angle);

    // then reverse the order
    points = points.reverse();

    // move the last point back to the start
    points.unshift(points.pop());

  }
  pList = []

  for (i = 0; i < points.length; i++) {
    pList.push(points[i].x)
    pList.push(points[i].y)
    pList.push(points[i].z)
  }

  return (pList)

}

//-- calculate normal of a set of points
function get_normal_newell(indices) {

  // find normal with Newell's method
  var n = [0.0, 0.0, 0.0];

  for (var i = 0; i < indices.length; i++) {
    var nex = i + 1;
    if (nex == indices.length) {
      nex = 0;
    };
    n[0] = n[0] + ((indices[i].y - indices[nex].y) * (indices[i].z + indices[nex].z));
    n[1] = n[1] + ((indices[i].z - indices[nex].z) * (indices[i].x + indices[nex].x));
    n[2] = n[2] + ((indices[i].x - indices[nex].x) * (indices[i].y + indices[nex].y));
  };
  var b = new THREE.Vector3(n[0], n[1], n[2]);
  return (b.normalize())
};

function to_2d(p, n) {
  p = new THREE.Vector3(p.x, p.y, p.z)
  var x3 = new THREE.Vector3(1.1, 1.1, 1.1);
  if (x3.distanceTo(n) < 0.01) {
    x3.add(new THREE.Vector3(1.0, 2.0, 3.0));
  }
  var tmp = x3.dot(n);
  var tmp2 = n.clone();
  tmp2.multiplyScalar(tmp);
  x3.sub(tmp2);
  x3.normalize();
  var y3 = n.clone();
  y3.cross(x3);
  let x = p.dot(x3);
  let y = p.dot(y3);
  var re = {
    x: x,
    y: y
  };
  return re;
}

function getStats(json) {

  vertices = json.vertices

  var minX = Number.MAX_VALUE;
  var minY = Number.MAX_VALUE;
  var minZ = Number.MAX_VALUE;

  var maxX = Number.MIN_VALUE;
  var maxY = Number.MIN_VALUE;
  var maxZ = Number.MIN_VALUE;

  var sumX = 0;
  var sumY = 0;
  var sumZ = 0
  var counter = 0

  for (var i in vertices) {
    if (vertices[i][0] < minX) {
      minX = vertices[i][0]
    }
    if (vertices[i][0] > maxX) {
      maxX = vertices[i][0]
    }

    if (vertices[i][1] < minY) {
      minY = vertices[i][1]
    }
    if (vertices[i][1] > maxY) {
      maxY = vertices[i][1]
    }

    if (vertices[i][2] < minZ) {
      minZ = vertices[i][2]
    }
    if (vertices[i][2] > maxZ) {
      maxZ = vertices[i][2]
    }
    counter = counter + 1
  }

  var avgX = maxX - (maxX - minX) / 2;
  var avgY = maxY - (maxY - minY) / 2;
  var avgZ = maxZ - (maxZ - minZ) / 2;

  //get stats from geographicalExtent (if availabe)
  if (json.metadata != undefined && json.metadata.geographicalExtent != undefined) {

    var gEx = json.metadata.geographicalExtent;

    var minXge = gEx[0];
    var minYge = gEx[1];
    var minZge = gEx[2];

    var maxXge = gEx[3];
    var maxYge = gEx[4];
    var maxZge = gEx[5];

    var avgXge = maxXge + minXge / 2;
    var avgYge = maxYge + minYge / 2;
    var avgZge = maxZge + minZge / 2;

    var same = true;

    if (minXge != minX) {
      same = false
    };
    if (minYge != minY) {
      same = false
    };
    if (minZge != minZ) {
      same = false
    };

    if (maxXge != maxX) {
      same = false
    };
    if (maxYge != maxY) {
      same = false
    };
    if (maxZge != maxZ) {
      same = false
    };

    if (avgXge != avgX) {
      same = false
    };
    if (avgYge != avgY) {
      same = false
    };
    if (avgZge != avgZ) {
      same = false
    };

    if (same == false) {
      addtoLog("Warning: geographicalExtent is different from the real values!");
    }
  }

  divisor = false
  if (maxZ > 1000) {
    addtoLog("Warning: unusual high Z-values detected (max height " + maxZ + "m)! Z-values divided by the factor of 1000");
    maxZ = maxZ / 1000;
    minZ = minZ / 1000;
    avgZ = avgZ / 1000;
    divisor = true;
  }



  return ([minX, minY, minZ, avgX, avgY, avgZ, maxX, maxY, maxZ, divisor])

}

//returns true if ccw, false if cw
function checkRotation(pList) {
  console.log(pList);

  var sum = 0
  for (var i = 0; i < pList.length; i++) {
    var x1 = pList[i].x;
    var y1 = pList[i].y;

    var j = i + 1
    if (j = pList.length - 1) {
      j = 0
    }
    var x2 = pList[j].x;
    var y2 = pList[j].y;

    sum = sum + (x2 - x1) * (y2 + y1);

  }

  console.log(sum);
}

function toggleSettings(state) {

  if (state == false) {
    $("#settingsBox").hide();
  } else {
    $("#settingsBox").show();
  }
}

function showLog() {
  $("#log").css("opacity", 0.8);
}

function hideLog() {
  $("#log").css("opacity", 0.2);
}

function addtoLog(string) {
  $("#log").append("- " + string + "<br />");
  $("#log").scrollTop($("#log").prop("scrollHeight"));
}
